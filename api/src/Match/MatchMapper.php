<?php

declare(strict_types=1);

namespace App\Match;

use App\Match\Dto\Lineup;
use App\Match\Dto\MatchDetail;
use App\Match\Dto\MatchSummary;
use App\Match\Dto\Participant;
use App\Match\Dto\Team;
use App\Match\Dto\TeamObjectives;

/**
 * Transforme une game brute de match-v5 en objets prêts pour le front.
 */
final class MatchMapper
{
    private const POSITION_ORDER = ['TOP' => 0, 'JUNGLE' => 1, 'MIDDLE' => 2, 'BOTTOM' => 3, 'UTILITY' => 4];

    /**
     * @param array{metadata: array<string, mixed>, info: array<string, mixed>} $match
     */
    public function toSummary(array $match, string $puuid): MatchSummary
    {
        $info = $match['info'];
        $raw = $this->sortedParticipants($info['participants']);
        $player = array_values(array_filter($raw, static fn (array $p) => $p['puuid'] === $puuid))[0]
            ?? throw new \InvalidArgumentException(\sprintf('Player %s did not play %s.', $puuid, $match['metadata']['matchId']));

        return new MatchSummary(
            matchId: $match['metadata']['matchId'],
            queueId: $info['queueId'],
            startedAt: $info['gameStartTimestamp'],
            durationSeconds: $info['gameDuration'],
            remake: $this->isRemake($raw),
            player: $this->participant($player, $info),
            lineup: array_map(static fn (array $p) => new Lineup(
                puuid: $p['puuid'],
                gameName: $p['riotIdGameName'] ?? '',
                tagLine: $p['riotIdTagline'] ?? '',
                teamId: $p['teamId'],
                championName: $p['championName'],
            ), $raw),
        );
    }

    /**
     * @param array{metadata: array<string, mixed>, info: array<string, mixed>} $match
     */
    public function toDetail(array $match): MatchDetail
    {
        $info = $match['info'];
        $raw = $this->sortedParticipants($info['participants']);

        $teams = array_map(function (array $team) use ($raw, $info): Team {
            $members = array_values(array_filter($raw, static fn (array $p) => $p['teamId'] === $team['teamId']));
            $objectives = $team['objectives'];

            return new Team(
                teamId: $team['teamId'],
                win: $team['win'],
                kills: $objectives['champion']['kills'] ?? array_sum(array_column($members, 'kills')),
                gold: array_sum(array_column($members, 'goldEarned')),
                objectives: new TeamObjectives(
                    towers: $objectives['tower']['kills'] ?? 0,
                    inhibitors: $objectives['inhibitor']['kills'] ?? 0,
                    dragons: $objectives['dragon']['kills'] ?? 0,
                    barons: $objectives['baron']['kills'] ?? 0,
                    riftHeralds: $objectives['riftHerald']['kills'] ?? 0,
                    voidGrubs: $objectives['horde']['kills'] ?? 0,
                    atakhans: $objectives['atakhan']['kills'] ?? 0,
                ),
                participants: array_map(fn (array $p) => $this->participant($p, $info), $members),
            );
        }, $info['teams']);

        usort($teams, static fn (Team $a, Team $b): int => $a->teamId <=> $b->teamId);

        return new MatchDetail(
            matchId: $match['metadata']['matchId'],
            queueId: $info['queueId'],
            startedAt: $info['gameStartTimestamp'],
            durationSeconds: $info['gameDuration'],
            remake: $this->isRemake($raw),
            gameVersion: $info['gameVersion'],
            teams: $teams,
        );
    }

    /**
     * @param array<string, mixed> $p
     * @param array<string, mixed> $info
     */
    private function participant(array $p, array $info): Participant
    {
        $teamKills = array_sum(array_map(
            static fn (array $other) => $other['teamId'] === $p['teamId'] ? $other['kills'] : 0,
            $info['participants'],
        ));
        $cs = $p['totalMinionsKilled'] + $p['neutralMinionsKilled'];
        $minutes = max($info['gameDuration'], 1) / 60;
        $styles = $p['perks']['styles'] ?? [];

        return new Participant(
            puuid: $p['puuid'],
            gameName: $p['riotIdGameName'] ?? '',
            tagLine: $p['riotIdTagline'] ?? '',
            teamId: $p['teamId'],
            position: ($p['teamPosition'] ?? '') ?: null,
            championName: $p['championName'],
            championLevel: $p['champLevel'],
            win: $p['win'],
            kills: $p['kills'],
            deaths: $p['deaths'],
            assists: $p['assists'],
            killParticipation: $teamKills > 0 ? round(($p['kills'] + $p['assists']) / $teamKills, 3) : 0.0,
            largestMultiKill: $p['largestMultiKill'] ?? 0,
            cs: $cs,
            csPerMinute: round($cs / $minutes, 1),
            gold: $p['goldEarned'],
            damageToChampions: $p['totalDamageDealtToChampions'],
            damageTaken: $p['totalDamageTaken'],
            visionScore: $p['visionScore'],
            wardsPlaced: $p['wardsPlaced'],
            wardsKilled: $p['wardsKilled'],
            controlWardsBought: $p['visionWardsBoughtInGame'],
            items: [$p['item0'], $p['item1'], $p['item2'], $p['item3'], $p['item4'], $p['item5']],
            trinket: $p['item6'],
            summonerSpells: [$p['summoner1Id'], $p['summoner2Id']],
            keystone: $styles[0]['selections'][0]['perk'] ?? 0,
            secondaryRuneStyle: $styles[1]['style'] ?? 0,
        );
    }

    /**
     * Équipe bleue puis rouge, et dans chaque équipe : top, jungle, mid, adc, support.
     *
     * @param list<array<string, mixed>> $participants
     *
     * @return list<array<string, mixed>>
     */
    private function sortedParticipants(array $participants): array
    {
        $order = static fn (array $p): array => [$p['teamId'], self::POSITION_ORDER[$p['teamPosition'] ?? ''] ?? 5];
        usort($participants, static fn (array $a, array $b): int => $order($a) <=> $order($b));

        return $participants;
    }

    /**
     * @param list<array<string, mixed>> $participants
     */
    private function isRemake(array $participants): bool
    {
        return (bool) ($participants[0]['gameEndedInEarlySurrender'] ?? false);
    }
}
