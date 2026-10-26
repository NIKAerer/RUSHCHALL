<?php

declare(strict_types=1);

namespace App\Match\Dto;

final readonly class TeamObjectives
{
    public function __construct(
        public int $towers,
        public int $inhibitors,
        public int $dragons,
        public int $barons,
        public int $riftHeralds,
        public int $voidGrubs,
        public int $atakhans,
    ) {
    }
}
