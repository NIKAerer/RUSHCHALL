<?php

declare(strict_types=1);

namespace App\Match\Dto;

final readonly class MatchSummary
{
    /**
     * @param list<Lineup> $lineup
     */
    public function __construct(
        public string $matchId,
        public int $queueId,
        public int $startedAt,
        public int $durationSeconds,
        public bool $remake,
        public Participant $player,
        public array $lineup,
        /** LP gagnés ou perdus, quand les relevés de rang permettent de les attribuer à cette game. */
        public ?int $lpChange = null,
        /** Coché par le joueur : routine respectée sur cette game. */
        public bool $routine = false,
    ) {
    }

    public function withTracking(?int $lpChange, bool $routine): self
    {
        return new self($this->matchId, $this->queueId, $this->startedAt, $this->durationSeconds, $this->remake, $this->player, $this->lineup, $lpChange, $routine);
    }
}
