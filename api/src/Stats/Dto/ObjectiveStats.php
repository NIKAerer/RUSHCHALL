<?php

declare(strict_types=1);

namespace App\Stats\Dto;

final readonly class ObjectiveStats
{
    public function __construct(
        /** dragon, grubs, herald, baron, atakhan */
        public string $type,
        public int $taken,
        public int $lost,
        /** Écart de gold moyen des équipes au moment où l'objectif est pris, puis perdu. */
        public ?int $goldDiffTaken,
        public ?int $goldDiffLost,
    ) {
    }
}
