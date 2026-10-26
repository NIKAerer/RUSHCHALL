<?php

declare(strict_types=1);

namespace App\Pathing;

/**
 * Zone de la Faille de l'invocateur pour une position Riot (x et y de 0 à ~15 000, base bleue en bas à gauche).
 * Découpage volontairement simple : il sert à qualifier un gank ou une invade, pas à tracer la carte.
 */
enum MapZone: string
{
    case Base = 'base';
    case Top = 'top';
    case Mid = 'mid';
    case Bot = 'bot';
    case River = 'river';
    case AllyJungle = 'allyJungle';
    case EnemyJungle = 'enemyJungle';

    private const RIVER_AXIS = 14900;
    private const LANE_WIDTH = 2300;
    private const MID_WIDTH = 1300;
    private const RIVER_WIDTH = 1300;

    public static function of(int $x, int $y, int $teamId): self
    {
        $sum = $x + $y;

        return match (true) {
            $sum < 5000 || $sum > 24800 => self::Base,
            $x < self::LANE_WIDTH || $y > 15000 - self::LANE_WIDTH => self::Top,
            $y < self::LANE_WIDTH || $x > 15000 - self::LANE_WIDTH => self::Bot,
            abs($x - $y) < self::MID_WIDTH => self::Mid,
            abs($sum - self::RIVER_AXIS) < self::RIVER_WIDTH => self::River,
            ($sum < self::RIVER_AXIS) === (100 === $teamId) => self::AllyJungle,
            default => self::EnemyJungle,
        };
    }

    public function isLane(): bool
    {
        return \in_array($this, [self::Top, self::Mid, self::Bot], true);
    }

    public function label(): string
    {
        return match ($this) {
            self::Base => 'base',
            self::Top => 'top',
            self::Mid => 'mid',
            self::Bot => 'bot',
            self::River => 'rivière',
            self::AllyJungle => 'sa jungle',
            self::EnemyJungle => 'jungle adverse',
        };
    }
}
