<?php

declare(strict_types=1);

namespace App\Pathing\Dto;

/** Gold total à une minute : ton équipe contre l'adverse, ton jungler contre celui d'en face. */
final readonly class GoldPoint
{
    public function __construct(
        public int $t,
        public int $ally,
        public int $enemy,
        public ?int $allyJungler,
        public ?int $enemyJungler,
    ) {
    }
}
