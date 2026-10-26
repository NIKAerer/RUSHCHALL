<?php

declare(strict_types=1);

namespace App\Pathing\Dto;

final readonly class Moment
{
    public function __construct(
        public int $t,
        /** gank, kill, assist, death, objective */
        public string $type,
        public string $label,
        public int $x,
        public int $y,
        public string $zone,
        /** Auteur du kill ou du smite ; null quand c'est une tourelle ou des sbires. */
        public ?Fighter $killer = null,
        public ?Fighter $victim = null,
        /** @var list<Fighter> */
        public array $assists = [],
    ) {
    }
}
