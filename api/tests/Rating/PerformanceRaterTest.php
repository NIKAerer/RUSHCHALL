<?php

declare(strict_types=1);

namespace App\Tests\Rating;

use App\Rating\PerformanceRater;
use PHPUnit\Framework\TestCase;

final class PerformanceRaterTest extends TestCase
{
    public function testRanksTheTenPlayersWithOneMvpAndOneAce(): void
    {
        $info = $this->fixture('EUW1_7412345678');
        $ratings = (new PerformanceRater())->rate($info);

        self::assertCount(10, $ratings);
        $ranks = array_map(static fn ($r) => $r->rank, $ratings);
        sort($ranks);
        self::assertSame(range(1, 10), $ranks);

        $wins = array_column(array_map(static fn (array $p) => [$p['puuid'], $p['win']], $info['participants']), 1, 0);
        $badges = [];
        foreach ($ratings as $puuid => $rating) {
            self::assertGreaterThanOrEqual(0.0, $rating->score);
            self::assertLessThanOrEqual(10.0, $rating->score);
            if (null !== $rating->badge) {
                $badges[$rating->badge][] = $wins[$puuid];
            }
        }
        self::assertSame([true], $badges['MVP']);
        self::assertSame([false], $badges['ACE']);
    }

    public function testMvpIsTheBestRatedWinner(): void
    {
        $info = $this->fixture('EUW1_7412345678');
        $ratings = (new PerformanceRater())->rate($info);
        $winners = array_filter($info['participants'], static fn (array $p) => $p['win']);
        $best = max(array_map(static fn (array $p) => $ratings[$p['puuid']]->score, $winners));

        $mvp = array_values(array_filter($ratings, static fn ($r) => 'MVP' === $r->badge))[0];
        self::assertSame($best, $mvp->score);
    }

    /** @return array<string, mixed> */
    private function fixture(string $matchId): array
    {
        return json_decode((string) file_get_contents(__DIR__.'/../Fixtures/riot/match_'.$matchId.'.json'), true, flags: \JSON_THROW_ON_ERROR)['info'];
    }
}
