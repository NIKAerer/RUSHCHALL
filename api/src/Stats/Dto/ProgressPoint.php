<?php

declare(strict_types=1);

namespace App\Stats\Dto;

/**
 * Une game sur la courbe de progression, dans l'ordre chronologique.
 */
final readonly class ProgressPoint
{
    public function __construct(
        public string $matchId,
        /** Début de la game, en millisecondes. */
        public int $t,
        public bool $win,
        public float $rating,
        public float $kda,
        public float $csPerMinute,
        /** LP de la game, quand les relevés de rang permettent de les attribuer. */
        public ?int $lpChange,
    ) {
    }
}
