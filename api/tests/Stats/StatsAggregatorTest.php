<?php

declare(strict_types=1);

namespace App\Tests\Stats;

use App\Stats\GameFacts;
use App\Stats\LaneDiff;
use App\Stats\ObjectiveFight;
use App\Stats\StatsAggregator;
use PHPUnit\Framework\TestCase;

final class StatsAggregatorTest extends TestCase
{
    public function testRemakesAreIgnored(): void
    {
        $stats = (new StatsAggregator())->aggregate([$this->game(true), $this->game(false, remake: true)]);

        self::assertSame(1, $stats->games);
        self::assertSame(1, $stats->wins);
    }

    public function testStreaksFollowTheOrderOfTheGames(): void
    {
        $results = [true, true, true, false, false, true, false, false];
        $stats = (new StatsAggregator())->aggregate(array_map(fn (bool $win) => $this->game($win), $results));

        self::assertSame(-2, $stats->form->streak);
        self::assertSame(3, $stats->form->longestWinStreak);
        self::assertSame(2, $stats->form->longestLossStreak);
        self::assertSame($results, $stats->form->recent);
    }

    public function testDiffsAndObjectivesAreAveraged(): void
    {
        $stats = (new StatsAggregator())->aggregate([
            $this->game(true, at10: new LaneDiff(600, 200, 10), objectives: [new ObjectiveFight('dragon', 400, true, 1000)]),
            $this->game(false, at10: new LaneDiff(-200, 0, -3), objectives: [new ObjectiveFight('dragon', 500, false, -3000), new ObjectiveFight('dragon', 900, true, 0)]),
        ]);

        self::assertCount(1, $stats->diffs);
        self::assertSame([10, 2, 200, 100, 3.5, 0.5], [$stats->diffs[0]->minute, $stats->diffs[0]->games, $stats->diffs[0]->gold, $stats->diffs[0]->xp, $stats->diffs[0]->cs, $stats->diffs[0]->aheadRate]);

        $dragons = $stats->objectives[2];
        self::assertSame(['dragon', 2, 1, 500, -3000], [$dragons->type, $dragons->taken, $dragons->lost, $dragons->goldDiffTaken, $dragons->goldDiffLost]);
    }

    public function testFirstClearsAreGroupedByStartAndRoute(): void
    {
        $stats = (new StatsAggregator())->aggregate([
            $this->game(true, clear: ['red', 'krugs', 'raptors']),
            $this->game(false, clear: ['red', 'blue']),
            $this->game(true, clear: ['blue', 'gromp']),
        ]);

        self::assertSame(3, $stats->jungle->games);
        self::assertSame(['red', 2, 1], [$stats->jungle->starts[0]->key, $stats->jungle->starts[0]->games, $stats->jungle->starts[0]->wins]);
        self::assertSame('red>krugs>raptors', $stats->jungle->routes[0]->key);
    }

    public function testGamesSplitIntoSessionsAfterABreak(): void
    {
        $hour = 3600 * 1000;
        // Trois games enchaînées (30 min chacune), puis une seule le lendemain.
        $stats = (new StatsAggregator())->aggregate([
            $this->game(false, startedAt: 0),
            $this->game(true, startedAt: $hour),
            $this->game(true, startedAt: 2 * $hour),
            $this->game(false, startedAt: 24 * $hour),
        ]);
        $grind = $stats->grind;

        self::assertSame(2, $grind->sessions);
        self::assertSame([3, 2, 150], [$grind->longestSession?->games, $grind->longestSession?->wins, $grind->longestSession?->minutes]);
        self::assertSame(['1', '2', '3'], array_map(static fn ($r) => $r->key, $grind->bySessionGame));
        self::assertSame([2, 0], [$grind->bySessionGame[0]->games, $grind->bySessionGame[0]->wins]);
        self::assertSame([1, 1], [$grind->afterLoss->games, $grind->afterLoss->wins]);
        self::assertSame([1, 1], [$grind->afterWin->games, $grind->afterWin->wins]);
        self::assertSame(2.0, $grind->hours);
        self::assertSame(0, $grind->afterTwoLosses->games);
        self::assertSame([1800, 1800], [$grind->winDuration, $grind->lossDuration]);
    }

    public function testGrindTracksBreaksSessionsRoutineAndStopLoss(): void
    {
        $minute = 60 * 1000;
        // Deux défaites (2 min de pause), une victoire après 10 min de pause, puis une victoire le lendemain.
        $stats = (new StatsAggregator())->aggregate(
            [
                $this->game(false, startedAt: 0, matchId: 'A'),
                $this->game(false, startedAt: 32 * $minute, matchId: 'B'),
                $this->game(true, startedAt: 72 * $minute, matchId: 'C'),
                $this->game(true, startedAt: 24 * 60 * $minute, matchId: 'D'),
            ],
            lpChanges: ['B' => -15, 'C' => 20],
            routine: ['C', 'D'],
        );
        $grind = $stats->grind;

        self::assertSame([['short', 1, 0], ['medium', 1, 1], ['long', 0, 0]], array_map(static fn ($r) => [$r->key, $r->games, $r->wins], $grind->byBreak));
        self::assertSame([[1, 1, null], [3, 1, 5]], array_map(static fn ($s) => [$s->games, $s->wins, $s->lp], $grind->recentSessions));
        self::assertSame(['1970-01-01', '1970-01-02'], array_map(static fn ($r) => $r->key, $grind->calendar));
        self::assertSame([2, 2], [$grind->routine->games, $grind->routine->wins]);
        self::assertSame([2, 0], [$grind->noRoutine->games, $grind->noRoutine->wins]);
        self::assertSame(20, $grind->afterTwoLossesLp);
    }

    public function testGrindAdvisesWhenToStopAndSplitsLpDurationsAndPool(): void
    {
        $day = 86_400_000;
        $monday = 1_792_382_400_000; // lundi 19 octobre 2026, 6 h à Paris
        $games = [];
        // Cinq sessions : une victoire, puis une défaite 35 minutes plus tard.
        foreach (range(0, 4) as $i) {
            $games[] = $this->game(true, startedAt: $monday + $i * 2 * $day, matchId: "W$i", champion: 0 === $i ? 'Viego' : 'LeeSin', duration: 20 * 60);
            $games[] = $this->game(false, startedAt: $monday + $i * 2 * $day + 35 * 60_000, matchId: "L$i", champion: $i >= 3 ? 'Kayn' : 'Graves', duration: 32 * 60);
        }
        $grind = (new StatsAggregator())->aggregate($games, lpChanges: ['W0' => 20, 'W1' => 23, 'L0' => -18])->grind;

        self::assertSame(1, $grind->stopAfter);
        self::assertSame([21.5, -18.0], [$grind->lpGain, $grind->lpLoss]);
        self::assertSame([['lt25', 5, 5], ['25-30', 0, 0], ['30-35', 5, 0], ['gt35', 0, 0]], array_map(static fn ($r) => [$r->key, $r->games, $r->wins], $grind->byDuration));
        self::assertSame(['LeeSin', 'Graves', 'Kayn'], $grind->mains);
        self::assertSame([['2026-10-19', 8, 7, 4], ['2026-10-26', 2, 2, 2]], array_map(static fn ($w) => [$w->week, $w->games, $w->mainGames, $w->champions], $grind->pool));
    }

    public function testLpOfApexTiersSitsAboveDiamond(): void
    {
        $stats = (new StatsAggregator())->aggregate([], [
            ['taken_at' => 1, 'tier' => 'DIAMOND', 'division' => 'II', 'league_points' => 50],
            ['taken_at' => 2, 'tier' => 'MASTER', 'division' => null, 'league_points' => 120],
        ]);

        self::assertSame([2650, 2920], array_map(static fn ($p) => $p->ladder, $stats->form->lp));
    }

    /**
     * @param list<string>         $clear
     * @param list<ObjectiveFight> $objectives
     */
    private function game(bool $win, bool $remake = false, int $startedAt = 1_793_000_000_000, ?LaneDiff $at10 = null, array $clear = [], array $objectives = [], string $matchId = 'EUW1_1', string $champion = 'LeeSin', int $duration = 1800): GameFacts
    {
        return new GameFacts(
            matchId: $matchId,
            startedAt: $startedAt,
            durationSeconds: $duration,
            remake: $remake,
            win: $win,
            championName: $champion,
            position: 'JUNGLE',
            opponent: 'XinZhao',
            kills: 5,
            deaths: 3,
            assists: 7,
            cs: 180,
            gold: 11000,
            pentaKills: 0,
            firstBlood: false,
            rating: 6.0,
            badge: null,
            goldAt15: 6000,
            at10: $at10,
            at15: null,
            clear: $clear,
            objectives: $objectives,
        );
    }
}
