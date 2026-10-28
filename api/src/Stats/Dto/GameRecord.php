<?php

declare(strict_types=1);

namespace App\Stats\Dto;

final readonly class GameRecord
{
    public function __construct(
        public string $matchId,
        public string $championName,
        public int $durationSeconds,
        public bool $win,
        /** En millisecondes. */
        public int $startedAt,
    ) {
    }
}
