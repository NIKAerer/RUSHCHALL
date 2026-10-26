<?php

declare(strict_types=1);

namespace App\Pathing\Dto;

final readonly class PathPoint
{
    public function __construct(
        /** Secondes depuis le début de la game. */
        public int $t,
        public int $x,
        public int $y,
        public string $zone,
    ) {
    }
}
