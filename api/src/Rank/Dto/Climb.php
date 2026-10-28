<?php

declare(strict_types=1);

namespace App\Rank\Dto;

/** Le joueur suivi face aux seuils Grandmaster et Challenger, et son rythme de montée. */
final readonly class Climb
{
    public function __construct(
        /** Dernier relevé de rang ; null tant qu'aucun relevé n'existe. */
        public ?string $tier,
        public ?int $leaguePoints,
        /** LP du dernier joueur de chaque ligue ; null si Riot ne répond pas. */
        public ?int $challenger,
        public ?int $grandmaster,
        /** LP gagnés par jour sur la dernière semaine de relevés ; null s'ils couvrent moins d'un jour. */
        public ?float $lpPerDay,
    ) {
    }
}
