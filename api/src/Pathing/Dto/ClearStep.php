<?php

declare(strict_types=1);

namespace App\Pathing\Dto;

/** Position relevée à une minute du premier clear, rattachée au camp le plus proche quand il y en a un. */
final readonly class ClearStep
{
    public function __construct(
        public int $t,
        /** blue, gromp, wolves, raptors, red, krugs, scuttle, ou null entre deux camps */
        public ?string $camp,
        public string $label,
        /** ally, enemy, river, ou null hors des camps */
        public ?string $side,
        public int $jungleCs,
        public int $x,
        public int $y,
    ) {
    }
}
