<?php

declare(strict_types=1);

namespace App\Pathing\Dto;

final readonly class Objective
{
    public function __construct(
        public int $t,
        /** dragon, baron, herald, grubs, atakhan */
        public string $type,
        public string $label,
        public int $teamId,
        public int $x,
        public int $y,
    ) {
    }
}
