<?php

declare(strict_types=1);

namespace App\Tests\Rank;

use App\Rank\LpChangeResolver;
use PHPUnit\Framework\TestCase;

final class LpChangeResolverTest extends TestCase
{
    public function testOneGameBetweenTwoSnapshotsGetsTheDifference(): void
    {
        $changes = (new LpChangeResolver())->resolve(
            [$this->snapshot(100, 'MASTER', null, 1400, 50, 30), $this->snapshot(200, 'MASTER', null, 1421, 51, 30), $this->snapshot(300, 'MASTER', null, 1403, 51, 31)],
            [['match_id' => 'A', 'ended_at' => 150], ['match_id' => 'B', 'ended_at' => 250]],
        );

        self::assertSame(['A' => 21, 'B' => -18], $changes);
    }

    public function testCrossesDivisionsOnTheSameLadder(): void
    {
        $changes = (new LpChangeResolver())->resolve(
            [$this->snapshot(100, 'DIAMOND', 'I', 90, 10, 10), $this->snapshot(200, 'MASTER', null, 10, 11, 10)],
            [['match_id' => 'A', 'ended_at' => 150]],
        );

        self::assertSame(['A' => 20], $changes);
    }

    public function testSeveralGamesBetweenSnapshotsStayUnknown(): void
    {
        $changes = (new LpChangeResolver())->resolve(
            [$this->snapshot(100, 'MASTER', null, 1400, 50, 30), $this->snapshot(400, 'MASTER', null, 1440, 52, 30)],
            [['match_id' => 'A', 'ended_at' => 150], ['match_id' => 'B', 'ended_at' => 250]],
        );

        self::assertSame([], $changes);
    }

    public function testGameMissingFromTheBaseIsNotBlamed(): void
    {
        // Le compteur a avancé de 1 mais deux games de la base finissent dans l'intervalle (un remake, par exemple).
        $changes = (new LpChangeResolver())->resolve(
            [$this->snapshot(100, 'MASTER', null, 1400, 50, 30), $this->snapshot(400, 'MASTER', null, 1420, 51, 30)],
            [['match_id' => 'A', 'ended_at' => 150], ['match_id' => 'B', 'ended_at' => 250]],
        );

        self::assertSame([], $changes);
    }

    /**
     * @return array{taken_at: int, tier: string, division: ?string, league_points: int, wins: int, losses: int}
     */
    private function snapshot(int $takenAt, string $tier, ?string $division, int $lp, int $wins, int $losses): array
    {
        return ['taken_at' => $takenAt, 'tier' => $tier, 'division' => $division, 'league_points' => $lp, 'wins' => $wins, 'losses' => $losses];
    }
}
