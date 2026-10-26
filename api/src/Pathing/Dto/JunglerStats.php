<?php

declare(strict_types=1);

namespace App\Pathing\Dto;

final readonly class JunglerStats
{
    public function __construct(
        /** Côté de la carte au début du premier clear : "haut" ou "bas". */
        public ?string $startSide,
        public ?int $csAt10,
        public ?int $goldAt10,
        public ?int $levelAt10,
        public int $ganksBefore14,
        /** Minutes (relevés de position) passées dans la jungle adverse. */
        public int $minutesInEnemyJungle,
        public int $objectives,
    ) {
    }
}
