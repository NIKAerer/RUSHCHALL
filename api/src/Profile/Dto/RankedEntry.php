<?php

declare(strict_types=1);

namespace App\Profile\Dto;

final readonly class RankedEntry
{
    public function __construct(
        /** "solo" ou "flex" */
        public string $queue,
        public string $tier,
        public ?string $division,
        public int $leaguePoints,
        public int $wins,
        public int $losses,
    ) {
    }
}
