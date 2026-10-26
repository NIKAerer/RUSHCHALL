<?php

declare(strict_types=1);

namespace App\Match\Dto;

final readonly class MatchDetail
{
    /**
     * @param array{0: Team, 1: Team} $teams bleue puis rouge
     */
    public function __construct(
        public string $matchId,
        public int $queueId,
        public int $startedAt,
        public int $durationSeconds,
        public bool $remake,
        public string $gameVersion,
        public array $teams,
    ) {
    }
}
