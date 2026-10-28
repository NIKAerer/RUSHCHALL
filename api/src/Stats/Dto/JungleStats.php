<?php

declare(strict_types=1);

namespace App\Stats\Dto;

final readonly class JungleStats
{
    /**
     * @param list<Record> $starts      par camp de départ
     * @param list<Record> $routes      par premier clear, les camps séparés par « > »
     * @param list<Record> $firstGanks  par voie du premier gank
     */
    public function __construct(
        public int $games,
        public array $starts,
        public array $routes,
        public array $firstGanks,
        /** Seconde moyenne du premier gank. */
        public ?int $firstGankAt,
    ) {
    }
}
