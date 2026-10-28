<?php

declare(strict_types=1);

namespace App\Stats\Dto;

final readonly class LpPoint
{
    public function __construct(
        /** En millisecondes. */
        public int $t,
        public string $tier,
        public ?string $division,
        public int $leaguePoints,
        /** LP depuis Fer IV, pour tracer une seule courbe à travers les divisions. */
        public int $ladder,
    ) {
    }
}
