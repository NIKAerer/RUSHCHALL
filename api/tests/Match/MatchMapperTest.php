<?php

declare(strict_types=1);

namespace App\Tests\Match;

use App\Match\MatchMapper;
use App\Tests\Fixtures\FakeRiotApi;
use PHPUnit\Framework\TestCase;

final class MatchMapperTest extends TestCase
{
    private MatchMapper $mapper;

    protected function setUp(): void
    {
        $this->mapper = new MatchMapper();
    }

    public function testSummaryDescribesThePlayersGame(): void
    {
        $summary = $this->mapper->toSummary($this->fixture('EUW1_7412345678'), FakeRiotApi::PUUID);

        self::assertSame('EUW1_7412345678', $summary->matchId);
        self::assertSame(420, $summary->queueId);
        self::assertSame(1578, $summary->durationSeconds);
        self::assertFalse($summary->remake);

        $player = $summary->player;
        self::assertSame('LeeSin', $player->championName);
        self::assertTrue($player->win);
        self::assertSame([9, 2, 11], [$player->kills, $player->deaths, $player->assists]);
        self::assertSame(156, $player->cs);
        self::assertSame(5.9, $player->csPerMinute);
        // (9 + 11) / 26 kills d'équipe
        self::assertSame(0.769, $player->killParticipation);
        self::assertSame([6692, 6610, 3071, 3047, 3026, 0], $player->items);
        self::assertSame([4, 11], $player->summonerSpells);
        self::assertSame(8010, $player->keystone);
        self::assertSame(8300, $player->secondaryRuneStyle);
    }

    public function testLineupIsSortedByTeamThenRole(): void
    {
        $summary = $this->mapper->toSummary($this->fixture('EUW1_7412001122'), FakeRiotApi::PUUID);

        self::assertSame(
            ['KSante', 'Viego', 'Sylas', 'Ezreal', 'Nautilus', 'Ornn', 'Lillia', 'Ahri', 'Kaisa', 'Rell'],
            array_map(static fn ($p) => $p->championName, $summary->lineup),
        );
        self::assertFalse($summary->player->win);
    }

    public function testDetailGroupsPlayersAndObjectivesByTeam(): void
    {
        $detail = $this->mapper->toDetail($this->fixture('EUW1_7412345678'));

        [$blue, $red] = $detail->teams;
        self::assertSame(100, $blue->teamId);
        self::assertTrue($blue->win);
        self::assertSame(26, $blue->kills);
        self::assertSame(3, $blue->objectives->dragons);
        self::assertSame(6, $blue->objectives->voidGrubs);
        self::assertSame(1, $blue->objectives->atakhans);
        self::assertSame(1, $red->objectives->riftHeralds);
        self::assertCount(5, $red->participants);
        self::assertSame('JUNGLE', $red->participants[1]->position);
        self::assertSame(58100, $blue->gold);
    }

    public function testUnknownPlayerIsRejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->mapper->toSummary($this->fixture('EUW1_7412345678'), 'someone-else');
    }

    private function fixture(string $matchId): array
    {
        return json_decode((string) file_get_contents(__DIR__.'/../Fixtures/riot/match_'.$matchId.'.json'), true, flags: \JSON_THROW_ON_ERROR);
    }
}
