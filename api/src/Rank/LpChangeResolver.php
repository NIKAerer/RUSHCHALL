<?php

declare(strict_types=1);

namespace App\Rank;

/**
 * Retrouve les LP gagnés ou perdus sur chaque game à partir des relevés de rang.
 *
 * Riot ne donne pas les LP d'une game : on compare deux relevés consécutifs, et on n'attribue l'écart
 * que si une seule game a été jouée entre les deux (les victoires + défaites ont avancé de 1 et
 * une seule game s'est terminée dans l'intervalle). Sinon la game reste sans valeur.
 */
final class LpChangeResolver
{
    /**
     * @param list<array{taken_at: int, tier: string, division: ?string, league_points: int, wins: int, losses: int}> $snapshots du plus ancien au plus récent
     * @param list<array{match_id: string, ended_at: int}>                                                            $games     fin de chaque game, en secondes
     *
     * @return array<string, int> LP par identifiant de game, pour les games qu'on sait attribuer
     */
    public function resolve(array $snapshots, array $games): array
    {
        $changes = [];
        for ($i = 1, $n = \count($snapshots); $i < $n; ++$i) {
            [$before, $after] = [$snapshots[$i - 1], $snapshots[$i]];
            if ($after['wins'] + $after['losses'] - $before['wins'] - $before['losses'] !== 1) {
                continue;
            }

            $between = array_values(array_filter($games, static fn (array $g) => $g['ended_at'] > $before['taken_at'] && $g['ended_at'] <= $after['taken_at']));
            if (1 !== \count($between)) {
                continue;
            }

            $changes[$between[0]['match_id']] = Ladder::score($after['tier'], $after['division'], $after['league_points'])
                - Ladder::score($before['tier'], $before['division'], $before['league_points']);
        }

        return $changes;
    }
}
