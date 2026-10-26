<?php

declare(strict_types=1);

namespace App\Pathing\Dto;

final readonly class JunglerPath
{
    /**
     * @param list<PathPoint> $points relevés minute par minute et positions des événements, dans l'ordre
     * @param list<Moment>    $moments
     */
    public function __construct(
        public string $puuid,
        public string $gameName,
        public string $championName,
        public int $teamId,
        public bool $isTrackedPlayer,
        public array $points,
        public array $moments,
        public JunglerStats $stats,
    ) {
    }
}
