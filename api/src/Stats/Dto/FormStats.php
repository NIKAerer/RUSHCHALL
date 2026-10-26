<?php

declare(strict_types=1);

namespace App\Stats\Dto;

final readonly class FormStats
{
    /**
     * @param list<bool>   $recent dernières games, la plus récente en dernier
     * @param list<Record> $byHour une entrée par heure de début (heure de Paris), de 0 à 23
     * @param list<LpPoint> $lp
     */
    public function __construct(
        /** Série en cours : positive pour des victoires, négative pour des défaites. */
        public int $streak,
        public int $longestWinStreak,
        public int $longestLossStreak,
        public array $recent,
        public array $byHour,
        public array $lp,
    ) {
    }
}
