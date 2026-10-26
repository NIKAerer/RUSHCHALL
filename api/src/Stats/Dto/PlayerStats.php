<?php

declare(strict_types=1);

namespace App\Stats\Dto;

final readonly class PlayerStats
{
    /**
     * @param list<ChampionStats>  $champions  le plus joué d'abord
     * @param list<MatchupStats>   $matchups   adversaires au même poste, toutes games confondues
     * @param list<DiffStats>      $diffs      à 10 puis à 15 minutes
     * @param list<ObjectiveStats> $objectives
     */
    public function __construct(
        public int $games,
        public int $wins,
        public float $kills,
        public float $deaths,
        public float $assists,
        public float $rating,
        public int $mvp,
        public int $ace,
        public array $champions,
        public array $matchups,
        public array $diffs,
        public JungleStats $jungle,
        public array $objectives,
        public Heatmap $heatmap,
        public FormStats $form,
    ) {
    }
}
