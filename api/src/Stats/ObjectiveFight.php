<?php

declare(strict_types=1);

namespace App\Stats;

/** Un objectif neutre de la game, pris par l'équipe du joueur suivi ou par l'adversaire. */
final readonly class ObjectiveFight
{
    public function __construct(
        /** dragon, grubs, herald, baron, atakhan */
        public string $type,
        public int $t,
        public bool $taken,
        /** Écart de gold entre les deux équipes au moment de l'objectif. */
        public int $goldDiff,
    ) {
    }
}
