<?php

declare(strict_types=1);

namespace App\Stats\Dto;

/** Écarts moyens avec l'adversaire direct à une minute donnée. */
final readonly class DiffStats
{
    public function __construct(
        public int $minute,
        public int $games,
        public int $gold,
        public int $xp,
        public float $cs,
        /** Part des games où le joueur suivi a plus de gold que son adversaire. */
        public float $aheadRate,
    ) {
    }
}
