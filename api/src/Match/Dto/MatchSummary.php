<?php

declare(strict_types=1);

namespace App\Match\Dto;

final readonly class MatchSummary
{
    /**
     * @param list<Lineup> $lineup
     */
    public function __construct(
        public string $matchId,
        public int $queueId,
        public int $startedAt,
        public int $durationSeconds,
        public bool $remake,
        public Participant $player,
        public array $lineup,
    ) {
    }
}
