<?php

declare(strict_types=1);

namespace App\Pathing;

use App\Pathing\Dto\Fighter;
use App\Pathing\Dto\JunglePathing;
use App\Pathing\Dto\JunglerPath;
use App\Pathing\Dto\JunglerStats;
use App\Pathing\Dto\Moment;
use App\Pathing\Dto\Objective;
use App\Pathing\Dto\PathPoint;

/**
 * Reconstitue la route des deux junglers d'une game à partir de la timeline Riot :
 * un relevé de position par minute, complété par les positions des kills et des objectifs.
 */
final class JunglePathingAnalyzer
{
    public function __construct(private readonly EarlyGameAnalyzer $earlyGame = new EarlyGameAnalyzer())
    {
    }

    private const GANK_WINDOW_SECONDS = 14 * 60;

    private const OBJECTIVES = [
        'DRAGON' => ['dragon', 'Drake'],
        'BARON_NASHOR' => ['baron', 'Nashor'],
        'RIFTHERALD' => ['herald', 'Héraut'],
        'HORDE' => ['grubs', 'Larve'],
        'ATAKHAN' => ['atakhan', 'Atakhan'],
    ];

    private const MULTI_KILLS = [2 => 'double', 3 => 'triple', 4 => 'quadra', 5 => 'penta'];

    /** Badges qui font d'un kill un moment fort même sans jungler dedans. */
    private const KEY_BADGES = ['first_blood' => 'First blood', 'triple' => 'Triple kill', 'quadra' => 'Quadra kill', 'penta' => 'Penta kill', 'ace' => 'Ace'];

    /** Écart toléré entre un CHAMPION_SPECIAL_KILL et le kill qu'il qualifie. */
    private const SPECIAL_KILL_TOLERANCE_MS = 3000;

    private const DRAGONS = [
        'FIRE_DRAGON' => ['infernal', 'Infernal'],
        'EARTH_DRAGON' => ['mountain', 'Montagne'],
        'WATER_DRAGON' => ['ocean', 'Océan'],
        'AIR_DRAGON' => ['cloud', 'Nuages'],
        'HEXTECH_DRAGON' => ['hextech', 'Hextech'],
        'CHEMTECH_DRAGON' => ['chemtech', 'Chemtech'],
        'ELDER_DRAGON' => ['elder', 'Ancien'],
    ];

    /**
     * @param array{metadata: array<string, mixed>, info: array<string, mixed>} $match
     * @param array{metadata: array<string, mixed>, info: array<string, mixed>} $timeline
     */
    public function analyze(array $match, array $timeline, string $trackedPuuid): JunglePathing
    {
        $participants = [];
        foreach ($match['info']['participants'] as $p) {
            $participants[$p['participantId']] = $p;
        }

        $trackedTeam = null;
        foreach ($participants as $p) {
            if ($p['puuid'] === $trackedPuuid) {
                $trackedTeam = $p['teamId'];
            }
        }

        $junglers = array_filter($participants, static fn (array $p) => 'JUNGLE' === ($p['teamPosition'] ?? null));
        // L'équipe du joueur suivi d'abord.
        usort($junglers, static fn (array $a, array $b) => ($b['teamId'] === $trackedTeam) <=> ($a['teamId'] === $trackedTeam));

        $frames = $timeline['info']['frames'];
        $events = $this->withBadges(array_merge(...array_map(static fn (array $frame) => $frame['events'] ?? [], $frames)));

        return new JunglePathing(
            matchId: $match['metadata']['matchId'],
            durationSeconds: $match['info']['gameDuration'],
            junglers: array_map(
                fn (array $jungler) => $this->path($jungler, $participants, $frames, $events, $trackedPuuid),
                array_values($junglers),
            ),
            objectives: $this->objectives($events, $participants),
            highlights: $this->highlights($events, $participants, array_column($junglers, 'participantId'), $trackedTeam ?? 100),
        );
    }

    /**
     * @param array<string, mixed>             $jungler
     * @param array<int, array<string, mixed>> $participants
     * @param list<array<string, mixed>>       $frames
     * @param list<array<string, mixed>>       $events
     */
    private function path(array $jungler, array $participants, array $frames, array $events, string $trackedPuuid): JunglerPath
    {
        $id = $jungler['participantId'];
        $team = $jungler['teamId'];
        $points = [];
        $moments = [];

        foreach ($frames as $frame) {
            $position = $frame['participantFrames'][(string) $id]['position'] ?? null;
            // Le relevé de la minute 0 est en fontaine : il n'apporte rien à la route.
            if (null !== $position && $frame['timestamp'] > 0) {
                $points[] = $this->point(intdiv($frame['timestamp'], 1000), $position, $team);
            }
        }

        foreach ($events as $event) {
            $moment = $this->moment($event, $id, $team, $participants);
            if (null !== $moment) {
                $moments[] = $moment;
                $points[] = new PathPoint($moment->t, $moment->x, $moment->y, $moment->zone);
            }
        }

        usort($points, static fn (PathPoint $a, PathPoint $b) => $a->t <=> $b->t);
        usort($moments, static fn (Moment $a, Moment $b) => $a->t <=> $b->t);

        return new JunglerPath(
            puuid: $jungler['puuid'],
            gameName: $jungler['riotIdGameName'] ?? '',
            championName: $jungler['championName'],
            teamId: $team,
            isTrackedPlayer: $jungler['puuid'] === $trackedPuuid,
            points: $points,
            moments: $moments,
            stats: $this->stats($id, $team, $frames, $moments),
            earlyGame: $this->earlyGame->analyze($id, $team, $frames, $events, $moments),
        );
    }

    /**
     * @param array<string, mixed>             $event
     * @param array<int, array<string, mixed>> $participants
     */
    private function moment(array $event, int $id, int $team, array $participants): ?Moment
    {
        if (!isset($event['position'])) {
            return null;
        }

        $t = intdiv($event['timestamp'], 1000);
        $x = $event['position']['x'];
        $y = $event['position']['y'];
        $zone = MapZone::of($x, $y, $team);
        $champion = static fn (int $participantId) => $participants[$participantId]['championName'] ?? '?';

        if ('CHAMPION_KILL' === $event['type']) {
            $involved = $event['killerId'] === $id || \in_array($id, $event['assistingParticipantIds'] ?? [], true);
            $moment = fn (string $type, string $label) => $this->fight($event, $type, $label, $zone, $participants);

            if ($event['victimId'] === $id) {
                return $moment('death', \sprintf('Mort contre %s (%s)', $champion($event['killerId']), $zone->label()));
            }
            if (!$involved) {
                return null;
            }
            if ($zone->isLane() && $t < self::GANK_WINDOW_SECONDS) {
                return $moment('gank', \sprintf('Gank %s : %s', $zone->label(), $champion($event['victimId'])));
            }
            $type = $event['killerId'] === $id ? 'kill' : 'assist';

            return $moment($type, \sprintf('%s %s (%s)', 'kill' === $type ? 'Kill sur' : 'Assist sur', $champion($event['victimId']), $zone->label()));
        }

        if ('ELITE_MONSTER_KILL' === $event['type'] && $event['killerId'] === $id && isset(self::OBJECTIVES[$event['monsterType']])) {
            return new Moment(
                t: $t,
                type: 'objective',
                label: $this->objectiveLabel($event),
                x: $x,
                y: $y,
                zone: $zone->value,
                killer: $this->fighter($id, $participants),
                objective: self::DRAGONS[$event['monsterSubType'] ?? ''][0] ?? self::OBJECTIVES[$event['monsterType']][0],
                badges: $event['badges'] ?? [],
            );
        }

        return null;
    }

    /**
     * @param list<array<string, mixed>> $frames
     * @param list<Moment>               $moments
     */
    private function stats(int $id, int $team, array $frames, array $moments): JunglerStats
    {
        $at = static fn (int $minute) => $frames[$minute]['participantFrames'][(string) $id] ?? null;
        $start = $at(2)['position'] ?? null;
        $tenMinutes = $at(10);

        $enemyJungleMinutes = 0;
        foreach ($frames as $frame) {
            $position = $frame['participantFrames'][(string) $id]['position'] ?? null;
            if (null !== $position && MapZone::EnemyJungle === MapZone::of($position['x'], $position['y'], $team)) {
                ++$enemyJungleMinutes;
            }
        }

        $count = static fn (string $type, ?int $before = null) => \count(array_filter(
            $moments,
            static fn (Moment $m) => $m->type === $type && (null === $before || $m->t < $before),
        ));

        return new JunglerStats(
            // Au-dessus de la diagonale base bleue -> base rouge : moitié haute de la carte.
            startSide: null === $start ? null : ($start['y'] > $start['x'] ? 'haut' : 'bas'),
            csAt10: null === $tenMinutes ? null : $tenMinutes['minionsKilled'] + $tenMinutes['jungleMinionsKilled'],
            goldAt10: $tenMinutes['totalGold'] ?? null,
            levelAt10: $tenMinutes['level'] ?? null,
            ganksBefore14: $count('gank', self::GANK_WINDOW_SECONDS),
            minutesInEnemyJungle: $enemyJungleMinutes,
            objectives: $count('objective'),
        );
    }

    /**
     * @param array<string, mixed>             $event       un CHAMPION_KILL
     * @param array<int, array<string, mixed>> $participants
     */
    private function fight(array $event, string $type, string $label, MapZone $zone, array $participants): Moment
    {
        return new Moment(
            t: intdiv($event['timestamp'], 1000),
            type: $type,
            label: $label,
            x: $event['position']['x'],
            y: $event['position']['y'],
            zone: $zone->value,
            killer: $this->fighter($event['killerId'], $participants),
            victim: $this->fighter($event['victimId'], $participants),
            assists: array_values(array_filter(array_map(
                fn (int $participantId) => $this->fighter($participantId, $participants),
                $event['assistingParticipantIds'] ?? [],
            ))),
            badges: [...$event['badges'] ?? [], ...(($event['shutdownBounty'] ?? 0) > 0 ? ['shutdown'] : [])],
        );
    }

    /**
     * @param array<int, array<string, mixed>> $participants
     */
    private function fighter(int $participantId, array $participants): ?Fighter
    {
        $p = $participants[$participantId] ?? null;

        return null === $p ? null : new Fighter($p['championName'], $p['teamId']);
    }

    /**
     * Kills marquants de la game (first blood, triple kill et plus, ace) auxquels aucun jungler n'a participé :
     * ils ne sont dans la route de personne, mais on les veut dans les moments forts.
     *
     * @param list<array<string, mixed>>       $events
     * @param array<int, array<string, mixed>> $participants
     * @param list<int>                        $junglerIds
     *
     * @return list<Moment>
     */
    private function highlights(array $events, array $participants, array $junglerIds, int $trackedTeam): array
    {
        $highlights = [];
        foreach ($events as $event) {
            $key = array_values(array_intersect($event['badges'] ?? [], array_keys(self::KEY_BADGES)));
            if ('CHAMPION_KILL' !== $event['type'] || [] === $key || !isset($event['position'])) {
                continue;
            }
            $involved = array_intersect($junglerIds, [$event['killerId'], $event['victimId'], ...$event['assistingParticipantIds'] ?? []]);
            if ([] !== $involved) {
                continue;
            }

            $highlights[] = $this->fight(
                $event,
                'kill',
                \sprintf('%s de %s', self::KEY_BADGES[$key[0]], $participants[$event['killerId']]['championName'] ?? '?'),
                MapZone::of($event['position']['x'], $event['position']['y'], $trackedTeam),
                $participants,
            );
        }

        return $highlights;
    }

    /**
     * Riot annonce first blood, multi-kills, aces et âme du dragon dans des événements à part :
     * on les rattache, sous forme de badges, au kill ou au drake qu'ils qualifient.
     *
     * @param list<array<string, mixed>> $events
     *
     * @return list<array<string, mixed>>
     */
    private function withBadges(array $events): array
    {
        foreach ($events as $soul) {
            // L'âme va à l'équipe qui vient de tuer le drake : on la marque sur ce drake.
            if ('DRAGON_SOUL_GIVEN' !== $soul['type']) {
                continue;
            }
            $dragons = array_filter($events, static fn (array $e) => 'ELITE_MONSTER_KILL' === $e['type'] && 'DRAGON' === $e['monsterType'] && $e['timestamp'] <= $soul['timestamp'] + self::SPECIAL_KILL_TOLERANCE_MS);
            if ([] !== $dragons) {
                $events[array_key_last($dragons)]['badges'][] = 'soul';
            }
        }

        foreach ($events as $special) {
            if ('CHAMPION_SPECIAL_KILL' !== $special['type']) {
                continue;
            }
            $badge = match ($special['killType'] ?? null) {
                'KILL_FIRST_BLOOD' => 'first_blood',
                'KILL_ACE' => 'ace',
                'KILL_MULTI' => self::MULTI_KILLS[$special['multiKillLength'] ?? 0] ?? null,
                default => null,
            };
            if (null === $badge) {
                continue;
            }

            $best = null;
            foreach ($events as $i => $kill) {
                $gap = abs($kill['timestamp'] - $special['timestamp']);
                if ('CHAMPION_KILL' === $kill['type'] && $kill['killerId'] === $special['killerId'] && $gap <= self::SPECIAL_KILL_TOLERANCE_MS
                    && (null === $best || $gap < abs($events[$best]['timestamp'] - $special['timestamp']))) {
                    $best = $i;
                }
            }
            if (null !== $best) {
                $events[$best]['badges'][] = $badge;
            }
        }

        return $events;
    }

    /**
     * @param list<array<string, mixed>>       $events
     * @param array<int, array<string, mixed>> $participants
     *
     * @return list<Objective>
     */
    private function objectives(array $events, array $participants): array
    {
        $objectives = [];
        foreach ($events as $event) {
            if ('ELITE_MONSTER_KILL' !== $event['type'] || !isset(self::OBJECTIVES[$event['monsterType']], $event['position'])) {
                continue;
            }

            $objectives[] = new Objective(
                t: intdiv($event['timestamp'], 1000),
                type: self::OBJECTIVES[$event['monsterType']][0],
                label: $this->objectiveLabel($event),
                teamId: $event['killerTeamId'] ?? ($participants[$event['killerId']]['teamId'] ?? 0),
                x: $event['position']['x'],
                y: $event['position']['y'],
            );
        }

        usort($objectives, static fn (Objective $a, Objective $b) => $a->t <=> $b->t);

        return $objectives;
    }

    /**
     * @param array<string, mixed> $event
     */
    private function objectiveLabel(array $event): string
    {
        $label = self::OBJECTIVES[$event['monsterType']][1];
        $dragon = self::DRAGONS[$event['monsterSubType'] ?? ''][1] ?? null;

        return null !== $dragon ? \sprintf('%s %s', $label, $dragon) : $label;
    }

    /**
     * @param array{x: int, y: int} $position
     */
    private function point(int $t, array $position, int $team): PathPoint
    {
        return new PathPoint($t, $position['x'], $position['y'], MapZone::of($position['x'], $position['y'], $team)->value);
    }
}
