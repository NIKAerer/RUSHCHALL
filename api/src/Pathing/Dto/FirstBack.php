<?php

declare(strict_types=1);

namespace App\Pathing\Dto;

final readonly class FirstBack
{
    /**
     * @param list<int> $itemIds items achetés pendant ce back, dans l'ordre
     */
    public function __construct(
        public int $t,
        public array $itemIds,
        /** Gold en poche au dernier relevé avant le back. */
        public ?int $gold,
    ) {
    }
}
