<?php

declare(strict_types=1);

namespace App\Stats\Dto;

final readonly class Heatmap
{
    /**
     * @param list<array{0: int, 1: int, 2: int}> $cells  colonne, ligne et nombre de relevés, sur une grille de size × size
     * @param list<array{0: int, 1: int}>         $deaths positions des morts sur la carte
     */
    public function __construct(
        public int $size,
        public array $cells,
        public array $deaths,
    ) {
    }
}
