<?php

declare(strict_types=1);

namespace App\Stats\Dto;

/** Une session : des games enchaînées sans pause de plus de 45 minutes. */
final readonly class SessionRecord
{
    public function __construct(
        /** En millisecondes. */
        public int $startedAt,
        public int $games,
        public int $wins,
        public int $minutes,
    ) {
    }
}
