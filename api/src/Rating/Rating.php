<?php

declare(strict_types=1);

namespace App\Rating;

/** Note d'un joueur sur une game, façon dpm.lol. */
final readonly class Rating
{
    public function __construct(
        /** De 0 à 10, une décimale. */
        public float $score,
        /** Place parmi les 10 joueurs, 1 = meilleure note. */
        public int $rank,
        /** MVP (meilleur de l'équipe gagnante), ACE (meilleur de l'équipe perdante) ou null. */
        public ?string $badge,
    ) {
    }
}
