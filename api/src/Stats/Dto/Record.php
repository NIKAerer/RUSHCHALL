<?php

declare(strict_types=1);

namespace App\Stats\Dto;

/** Games jouées et gagnées, pour un camp, une voie, une heure… */
final readonly class Record
{
    public function __construct(
        public string $key,
        public int $games,
        public int $wins,
    ) {
    }
}
