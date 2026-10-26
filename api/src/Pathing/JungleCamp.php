<?php

declare(strict_types=1);

namespace App\Pathing;

/**
 * Camps de la jungle et leur position sur la Faille (x, y Riot), par côté.
 * Riot ne dit pas quel camp a été tué : on retient le camp le plus proche du jungler.
 */
enum JungleCamp: string
{
    case Blue = 'blue';
    case Gromp = 'gromp';
    case Wolves = 'wolves';
    case Raptors = 'raptors';
    case Red = 'red';
    case Krugs = 'krugs';
    case Scuttle = 'scuttle';

    /** Au-delà, le jungler est entre deux camps. */
    private const MAX_DISTANCE = 1500;

    /** @var list<array{self, int, int, ?int}> camp, x, y, équipe dont c'est la jungle (null : rivière) */
    private const SPOTS = [
        [self::Blue, 3800, 7900, 100],
        [self::Gromp, 2100, 8400, 100],
        [self::Wolves, 3800, 6500, 100],
        [self::Raptors, 6950, 5400, 100],
        [self::Red, 7800, 4000, 100],
        [self::Krugs, 8400, 2700, 100],
        [self::Blue, 11000, 6900, 200],
        [self::Gromp, 12700, 6400, 200],
        [self::Wolves, 11000, 8400, 200],
        [self::Raptors, 7850, 9500, 200],
        [self::Red, 7100, 10900, 200],
        [self::Krugs, 6400, 12250, 200],
        [self::Scuttle, 4400, 9600, null],
        [self::Scuttle, 10500, 5100, null],
    ];

    /**
     * Camp le plus proche d'une position, avec l'équipe qui le possède.
     *
     * @return array{self, ?int}|null
     */
    public static function near(int $x, int $y): ?array
    {
        $best = null;
        $bestDistance = self::MAX_DISTANCE;
        foreach (self::SPOTS as [$camp, $campX, $campY, $owner]) {
            $distance = hypot($x - $campX, $y - $campY);
            if ($distance <= $bestDistance) {
                $best = [$camp, $owner];
                $bestDistance = $distance;
            }
        }

        return $best;
    }

    public function label(): string
    {
        return match ($this) {
            self::Blue => 'Bleu',
            self::Gromp => 'Gromp',
            self::Wolves => 'Loups',
            self::Raptors => 'Raptors',
            self::Red => 'Rouge',
            self::Krugs => 'Krugs',
            self::Scuttle => 'Carapateur',
        };
    }
}
