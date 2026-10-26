<?php

declare(strict_types=1);

namespace App\Pathing\Dto;

final readonly class EarlyGame
{
    /**
     * @param list<ClearStep>  $clear  relevés minute par minute jusqu'à la fin du premier clear
     * @param array<int, ?int> $levels secondes où le niveau 3, 4 et 6 est atteint
     */
    public function __construct(
        public array $clear,
        public ?int $clearEnd,
        /** back, ou le type du premier moment fort (gank, kill, assist, death) : ce qui met fin au premier clear */
        public ?string $clearEndReason,
        public int $jungleCsAtClearEnd,
        public array $levels,
        public ?FirstBack $firstBack,
        public ?Moment $firstGank,
        /** Première fois dans la jungle adverse, en secondes. */
        public ?int $firstInvade,
    ) {
    }
}
