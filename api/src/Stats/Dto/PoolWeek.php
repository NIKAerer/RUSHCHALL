<?php

declare(strict_types=1);

namespace App\Stats\Dto;

/** Une semaine de jeu, vue sous l'angle du pool de champions. */
final readonly class PoolWeek
{
    public function __construct(
        /** Lundi de la semaine, AAAA-MM-JJ. */
        public string $week,
        public int $games,
        /** Games jouées sur les champions principaux de la période. */
        public int $mainGames,
        /** Champions différents joués. */
        public int $champions,
    ) {
    }
}
