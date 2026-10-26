<?php

declare(strict_types=1);

namespace App\Pathing\Dto;

/** Champion impliqué dans un moment fort. */
final readonly class Fighter
{
    public function __construct(
        public string $championName,
        public int $teamId,
    ) {
    }
}
