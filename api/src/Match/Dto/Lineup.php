<?php

declare(strict_types=1);

namespace App\Match\Dto;

/**
 * Version légère d'un participant, pour la liste des 10 joueurs dans l'historique.
 */
final readonly class Lineup
{
    public function __construct(
        public string $puuid,
        public string $gameName,
        public string $tagLine,
        public int $teamId,
        public string $championName,
    ) {
    }
}
