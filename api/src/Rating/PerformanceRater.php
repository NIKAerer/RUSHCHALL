<?php

declare(strict_types=1);

namespace App\Rating;

/**
 * Note chaque joueur d'une game de 0 à 10 en le comparant aux 9 autres :
 * KDA, participation aux kills, part des dégâts et du gold de son équipe, dégâts aux objectifs,
 * vision et morts. Une victoire ajoute un petit bonus, comme sur dpm.lol.
 */
final class PerformanceRater
{
    private const WEIGHTS = [
        'kda' => 0.20,
        'killParticipation' => 0.20,
        'damageShare' => 0.20,
        'goldShare' => 0.10,
        'objectiveShare' => 0.10,
        'vision' => 0.10,
        'survival' => 0.10,
    ];

    /** KDA à partir duquel la composante est au maximum. */
    private const KDA_CAP = 8.0;
    private const WIN_BONUS = 0.5;

    /**
     * @param array<string, mixed> $info info d'une game match-v5
     *
     * @return array<string, Rating> par puuid
     */
    public function rate(array $info): array
    {
        $players = $info['participants'];
        $teamSum = static function (string $field, int $team) use ($players): int {
            return array_sum(array_map(static fn (array $p) => $p['teamId'] === $team ? ($p[$field] ?? 0) : 0, $players));
        };
        $maxOf = static fn (string $field) => max(1, ...array_map(static fn (array $p) => $p[$field] ?? 0, $players));
        $ratio = static fn (int|float $value, int|float $total) => $total > 0 ? min($value / $total, 1.0) : 0.0;

        $maxVision = $maxOf('visionScore');
        $maxDeaths = $maxOf('deaths');

        $scores = [];
        foreach ($players as $p) {
            $team = $p['teamId'];
            $components = [
                'kda' => min(($p['kills'] + $p['assists']) / max(1, $p['deaths']) / self::KDA_CAP, 1.0),
                'killParticipation' => $ratio($p['kills'] + $p['assists'], $teamSum('kills', $team)),
                // Le meilleur dégâts d'une équipe pèse en général 30 à 40 % du total.
                'damageShare' => $ratio($p['totalDamageDealtToChampions'] * 2.5, $teamSum('totalDamageDealtToChampions', $team)),
                'goldShare' => $ratio($p['goldEarned'] * 2.5, $teamSum('goldEarned', $team)),
                'objectiveShare' => $ratio(($p['damageDealtToObjectives'] ?? 0) * 2.5, $teamSum('damageDealtToObjectives', $team)),
                'vision' => $ratio($p['visionScore'], $maxVision),
                'survival' => 1 - $p['deaths'] / $maxDeaths,
            ];

            $score = 0.0;
            foreach (self::WEIGHTS as $name => $weight) {
                $score += $weight * $components[$name];
            }
            $scores[$p['puuid']] = [
                'score' => min(10.0, round($score * 10 + ($p['win'] ? self::WIN_BONUS : 0), 1)),
                'win' => $p['win'],
            ];
        }

        uasort($scores, static fn (array $a, array $b) => $b['score'] <=> $a['score']);
        $ratings = [];
        $rank = 0;
        $badged = [true => false, false => false];
        foreach ($scores as $puuid => ['score' => $score, 'win' => $win]) {
            $badge = null;
            if (!$badged[$win]) {
                $badge = $win ? 'MVP' : 'ACE';
                $badged[$win] = true;
            }
            $ratings[$puuid] = new Rating($score, ++$rank, $badge);
        }

        return $ratings;
    }
}
