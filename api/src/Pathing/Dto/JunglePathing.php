<?php

declare(strict_types=1);

namespace App\Pathing\Dto;

final readonly class JunglePathing
{
    /**
     * @param list<JunglerPath> $junglers celui de l'équipe du joueur suivi, puis celui d'en face
     * @param list<Objective>   $objectives
     * @param list<Moment>      $highlights kills marquants sans jungler (first blood, triple kill…)
     */
    public function __construct(
        public string $matchId,
        public int $durationSeconds,
        public array $junglers,
        public array $objectives,
        public array $highlights = [],
    ) {
    }
}
