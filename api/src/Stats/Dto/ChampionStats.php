<?php

declare(strict_types=1);

namespace App\Stats\Dto;

final readonly class ChampionStats
{
    /**
     * @param list<MatchupStats> $matchups contre chaque adversaire au même poste, le plus joué d'abord
     */
    public function __construct(
        public string $championName,
        public int $games,
        public int $wins,
        public float $kills,
        public float $deaths,
        public float $assists,
        public float $csPerMinute,
        public ?int $goldAt15,
        public float $rating,
        public array $matchups,
    ) {
    }
}
