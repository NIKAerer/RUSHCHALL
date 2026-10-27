<?php

declare(strict_types=1);

namespace App\Rank;

/**
 * Position d'un rang sur une seule échelle de LP : 400 par palier, 100 par division.
 */
final class Ladder
{
    private const TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND'];
    private const DIVISIONS = ['IV', 'III', 'II', 'I'];

    public static function score(string $tier, ?string $division, int $leaguePoints): int
    {
        $tierIndex = array_search($tier, self::TIERS, true);
        if (false === $tierIndex) {
            // Master et au-dessus : une seule échelle de LP, au-dessus de Diamant I.
            return \count(self::TIERS) * 400 + $leaguePoints;
        }

        return $tierIndex * 400 + (int) array_search($division, self::DIVISIONS, true) * 100 + $leaguePoints;
    }
}
