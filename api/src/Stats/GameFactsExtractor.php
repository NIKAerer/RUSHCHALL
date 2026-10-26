<?php

declare(strict_types=1);

namespace App\Stats;

use App\Pathing\Dto\GoldPoint;
use App\Pathing\Dto\JunglePathing;
use App\Pathing\JunglePathingAnalyzer;
use App\Rating\PerformanceRater;

final class GameFactsExtractor
{
    public function __construct(
        private readonly PerformanceRater $rater = new PerformanceRater(),
        private readonly JunglePathingAnalyzer $pathing = new JunglePathingAnalyzer(),
    ) {
    }

    /**
     * @param array{metadata: array<string, mixed>, info: array<string, mixed>}      $match
     * @param array{metadata: array<string, mixed>, info: array<string, mixed>}|null $timeline
     */
    public function extract(array $match, ?array $timeline, string $puuid): GameFacts
    {
        $info = $match['info'];
        $me = $this->find($info['participants'], static fn (array $p) => $p['puuid'] === $puuid)
            ?? throw new \InvalidArgumentException(\sprintf('%s is not in %s.', $puuid, $match['metadata']['matchId']));
        $position = ($me['teamPosition'] ?? '') ?: null;
        $opponent = null === $position ? null : $this->find(
            $info['participants'],
            static fn (array $p) => $p['teamId'] !== $me['teamId'] && ($p['teamPosition'] ?? null) === $position,
        );
        $rating = $this->rater->rate($info)[$puuid];
        $frames = $timeline['info']['frames'] ?? [];

        $facts = [
            'matchId' => $match['metadata']['matchId'],
            'startedAt' => $info['gameStartTimestamp'],
            'durationSeconds' => $info['gameDuration'],
            'remake' => (bool) ($me['gameEndedInEarlySurrender'] ?? false),
            'win' => $me['win'],
            'championName' => $me['championName'],
            'position' => $position,
            'opponent' => $opponent['championName'] ?? null,
            'kills' => $me['kills'],
            'deaths' => $me['deaths'],
            'assists' => $me['assists'],
            'cs' => $me['totalMinionsKilled'] + $me['neutralMinionsKilled'],
            'rating' => $rating->score,
            'badge' => $rating->badge,
            'goldAt15' => $frames[15]['participantFrames'][(string) $me['participantId']]['totalGold'] ?? null,
            'at10' => $this->diff($frames, 10, $me, $opponent),
            'at15' => $this->diff($frames, 15, $me, $opponent),
        ];
        if (null === $timeline) {
            return new GameFacts(...$facts);
        }

        $pathing = $this->pathing->analyze($match, $timeline, $puuid);
        $id = $me['participantId'];

        return new GameFacts(
            ...$facts,
            ...$this->jungle($pathing),
            objectives: $this->objectives($pathing, $me['teamId']),
            positions: $this->positions($frames, $id),
            deathSpots: $this->deathSpots($frames, $id),
        );
    }

    /**
     * Premier clear et premier gank, quand le joueur suivi est le jungler.
     *
     * @return array{clear?: list<string>, firstGankAt?: int, firstGankLane?: string}
     */
    private function jungle(JunglePathing $pathing): array
    {
        $path = $pathing->junglers[0] ?? null;
        if (null === $path || !$path->isTrackedPlayer) {
            return [];
        }

        $camps = [];
        foreach ($path->earlyGame->clear as $step) {
            if (null !== $step->camp && end($camps) !== $step->camp) {
                $camps[] = $step->camp;
            }
        }
        $gank = $path->earlyGame->firstGank;

        return ['clear' => $camps, 'firstGankAt' => $gank?->t, 'firstGankLane' => $gank?->zone];
    }

    /**
     * @return list<ObjectiveFight>
     */
    private function objectives(JunglePathing $pathing, int $team): array
    {
        return array_map(fn ($objective) => new ObjectiveFight(
            type: $objective->type,
            t: $objective->t,
            taken: $objective->teamId === $team,
            goldDiff: $this->goldDiffAt($pathing->gold, $objective->t),
        ), $pathing->objectives);
    }

    /**
     * Écart de gold des équipes à la seconde t, interpolé entre les relevés de chaque minute.
     *
     * @param list<GoldPoint> $gold
     */
    private function goldDiffAt(array $gold, int $t): int
    {
        $before = null;
        foreach ($gold as $point) {
            if ($point->t >= $t) {
                if (null === $before || $point->t === $before->t) {
                    return $point->ally - $point->enemy;
                }
                $ratio = ($t - $before->t) / ($point->t - $before->t);

                return (int) round(($before->ally - $before->enemy) * (1 - $ratio) + ($point->ally - $point->enemy) * $ratio);
            }
            $before = $point;
        }

        return null === $before ? 0 : $before->ally - $before->enemy;
    }

    /**
     * @param list<array<string, mixed>> $frames
     * @param array<string, mixed>       $me
     * @param array<string, mixed>|null  $opponent
     */
    private function diff(array $frames, int $minute, array $me, ?array $opponent): ?LaneDiff
    {
        $mine = $frames[$minute]['participantFrames'][(string) $me['participantId']] ?? null;
        $theirs = null === $opponent ? null : ($frames[$minute]['participantFrames'][(string) $opponent['participantId']] ?? null);
        if (null === $mine || null === $theirs) {
            return null;
        }
        $cs = static fn (array $state) => $state['minionsKilled'] + $state['jungleMinionsKilled'];

        return new LaneDiff($mine['totalGold'] - $theirs['totalGold'], $mine['xp'] - $theirs['xp'], $cs($mine) - $cs($theirs));
    }

    /**
     * @param list<array<string, mixed>> $frames
     *
     * @return list<array{0: int, 1: int}>
     */
    private function positions(array $frames, int $id): array
    {
        $positions = [];
        foreach ($frames as $frame) {
            $position = $frame['participantFrames'][(string) $id]['position'] ?? null;
            // À la minute 0, tout le monde est en fontaine.
            if (null !== $position && $frame['timestamp'] > 0) {
                $positions[] = [$position['x'], $position['y']];
            }
        }

        return $positions;
    }

    /**
     * @param list<array<string, mixed>> $frames
     *
     * @return list<array{0: int, 1: int}>
     */
    private function deathSpots(array $frames, int $id): array
    {
        $spots = [];
        foreach ($frames as $frame) {
            foreach ($frame['events'] ?? [] as $event) {
                if ('CHAMPION_KILL' === $event['type'] && $id === $event['victimId'] && isset($event['position'])) {
                    $spots[] = [$event['position']['x'], $event['position']['y']];
                }
            }
        }

        return $spots;
    }

    /**
     * @param list<array<string, mixed>>          $participants
     * @param callable(array<string, mixed>): bool $matches
     *
     * @return array<string, mixed>|null
     */
    private function find(array $participants, callable $matches): ?array
    {
        foreach ($participants as $p) {
            if ($matches($p)) {
                return $p;
            }
        }

        return null;
    }
}
