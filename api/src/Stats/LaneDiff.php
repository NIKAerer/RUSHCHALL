<?php

declare(strict_types=1);

namespace App\Stats;

/** Écart avec l'adversaire direct à une minute donnée (positif : le joueur suivi est devant). */
final readonly class LaneDiff
{
    public function __construct(
        public int $gold,
        public int $xp,
        public int $cs,
    ) {
    }
}
