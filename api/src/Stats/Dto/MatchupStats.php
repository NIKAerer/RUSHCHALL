<?php

declare(strict_types=1);

namespace App\Stats\Dto;

final readonly class MatchupStats
{
    public function __construct(
        public string $opponent,
        public int $games,
        public int $wins,
        /** Écart moyen à 15 minutes avec l'adversaire. */
        public ?int $goldDiffAt15,
    ) {
    }
}
