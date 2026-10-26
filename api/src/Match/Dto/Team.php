<?php

declare(strict_types=1);

namespace App\Match\Dto;

final readonly class Team
{
    /**
     * @param list<Participant> $participants
     */
    public function __construct(
        public int $teamId,
        public bool $win,
        public int $kills,
        public int $gold,
        public TeamObjectives $objectives,
        public array $participants,
    ) {
    }
}
