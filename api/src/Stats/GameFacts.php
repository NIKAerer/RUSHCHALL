<?php

declare(strict_types=1);

namespace App\Stats;

/**
 * Ce qu'on retient d'une game du joueur suivi pour ses stats. Une game terminée ne change jamais,
 * ces faits sont donc calculés une seule fois puis mis en cache.
 */
final readonly class GameFacts
{
    /**
     * @param list<string>                $clear      camps du premier clear, dans l'ordre
     * @param list<ObjectiveFight>        $objectives
     * @param list<array{0: int, 1: int}> $positions  relevés minute par minute
     * @param list<array{0: int, 1: int}> $deathSpots
     */
    public function __construct(
        public string $matchId,
        /** Début de la game, en millisecondes. */
        public int $startedAt,
        public int $durationSeconds,
        public bool $remake,
        public bool $win,
        public string $championName,
        public ?string $position,
        /** Champion de l'adversaire au même poste. */
        public ?string $opponent,
        public int $kills,
        public int $deaths,
        public int $assists,
        public int $cs,
        public int $gold,
        public int $pentaKills,
        public bool $firstBlood,
        public float $rating,
        public ?string $badge,
        public ?int $goldAt15,
        public ?LaneDiff $at10,
        public ?LaneDiff $at15,
        public array $clear = [],
        /** Premier gank : seconde et voie (top, mid, bot). */
        public ?int $firstGankAt = null,
        public ?string $firstGankLane = null,
        public array $objectives = [],
        public array $positions = [],
        public array $deathSpots = [],
    ) {
    }
}
