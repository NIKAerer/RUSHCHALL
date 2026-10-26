<?php

declare(strict_types=1);

namespace App\Match\Dto;

final readonly class Participant
{
    /**
     * @param list<int>         $items          6 emplacements, 0 = vide
     * @param array{0:int,1:int} $summonerSpells
     */
    public function __construct(
        public string $puuid,
        public string $gameName,
        public string $tagLine,
        public int $teamId,
        public ?string $position,
        public string $championName,
        public int $championLevel,
        public bool $win,
        public int $kills,
        public int $deaths,
        public int $assists,
        public float $killParticipation,
        public int $largestMultiKill,
        public int $cs,
        public float $csPerMinute,
        public int $gold,
        public int $damageToChampions,
        public int $damageTaken,
        public int $visionScore,
        public int $wardsPlaced,
        public int $wardsKilled,
        public int $controlWardsBought,
        public array $items,
        public int $trinket,
        public array $summonerSpells,
        public int $keystone,
        public int $secondaryRuneStyle,
    ) {
    }
}
