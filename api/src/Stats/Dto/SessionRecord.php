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
        /** LP nets de la session ; null si aucune de ses games n'a de LP connus. */
        public ?int $lp = null,
        /** Note moyenne sur 10. */
        public ?float $rating = null,
    ) {
    }
}
