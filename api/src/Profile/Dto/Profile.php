<?php

declare(strict_types=1);

namespace App\Profile\Dto;

final readonly class Profile
{
    /**
     * @param list<RankedEntry> $ranked
     */
    public function __construct(
        public string $puuid,
        public string $gameName,
        public string $tagLine,
        public string $platform,
        public int $profileIconId,
        public int $summonerLevel,
        public array $ranked,
    ) {
    }
}
