<?php

declare(strict_types=1);

namespace App\Tests\Match;

use App\Match\RankedMatchSync;
use App\Riot\Platform;
use App\Riot\RiotApiClient;
use App\Storage\MatchStore;
use App\Tests\Fixtures\FakeRiotApi;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Cache\Adapter\NullAdapter;
use Symfony\Component\HttpClient\MockHttpClient;

final class RankedMatchSyncTest extends TestCase
{
    private FakeRiotApi $riot;
    private MatchStore $store;
    private RankedMatchSync $sync;

    protected function setUp(): void
    {
        $this->riot = new FakeRiotApi();
        $this->store = new MatchStore(':memory:');
        // Pas de cache : chaque appel à Riot est visible dans $this->riot->requestedUrls.
        $client = new RiotApiClient(new MockHttpClient($this->riot), new NullAdapter(), Platform::EUW);
        $this->sync = new RankedMatchSync($client, $this->store);
    }

    public function testRankedSoloGamesAreFetchedSinceTheGivenDate(): void
    {
        $report = $this->sync->sync(FakeRiotApi::PUUID, new \DateTimeImmutable('2026-10-04 00:00', new \DateTimeZone('Europe/Paris')));

        self::assertSame(['found' => 2, 'alreadyStored' => 0, 'saved' => 2, 'timelines' => 0, 'remaining' => 0], $report);
        self::assertStringContainsString('queue=420&startTime=1791064800', $this->riot->requestedUrls[0]);
        self::assertSame(2, $this->store->countForPlayer(FakeRiotApi::PUUID));
        self::assertSame('EUW1_7412345678', $this->store->find('EUW1_7412345678')['metadata']['matchId']);
    }

    public function testGamesAlreadyStoredCostNoRequest(): void
    {
        $since = new \DateTimeImmutable('2026-10-04');
        $this->sync->sync(FakeRiotApi::PUUID, $since);
        $this->riot->requestedUrls = [];

        $report = $this->sync->sync(FakeRiotApi::PUUID, $since);

        self::assertSame(['found' => 2, 'alreadyStored' => 2, 'saved' => 0, 'timelines' => 0, 'remaining' => 0], $report);
        self::assertCount(1, $this->riot->requestedUrls, 'Seule la liste des games doit être redemandée.');
    }

    public function testLimitKeepsTheMostRecentGames(): void
    {
        $report = $this->sync->sync(FakeRiotApi::PUUID, new \DateTimeImmutable('2026-10-04'), limit: 1);

        self::assertSame(['found' => 2, 'alreadyStored' => 0, 'saved' => 1, 'timelines' => 0, 'remaining' => 1], $report);
        self::assertNotNull($this->store->find('EUW1_7412345678'));
        self::assertNull($this->store->find('EUW1_7412001122'));
    }

    public function testTimelineIsStoredWithEachNewGame(): void
    {
        $this->sync->sync(FakeRiotApi::PUUID, new \DateTimeImmutable('2026-10-04'));

        self::assertSame([], $this->store->idsWithoutTimeline(FakeRiotApi::PUUID));
        self::assertSame(60000, $this->store->findTimeline('EUW1_7412345678')['info']['frameInterval']);
    }

    public function testGamesStoredWithoutTimelineAreCompleted(): void
    {
        $this->store->save($this->fixture('match_EUW1_7412345678'));
        $this->store->save($this->fixture('match_EUW1_7412001122'));

        $report = $this->sync->sync(FakeRiotApi::PUUID, new \DateTimeImmutable('2026-10-04'), limit: 1);

        self::assertSame(['found' => 2, 'alreadyStored' => 2, 'saved' => 0, 'timelines' => 1, 'remaining' => 1], $report);
        self::assertSame(['EUW1_7412001122'], $this->store->idsWithoutTimeline(FakeRiotApi::PUUID));
    }

    public function testLatestGameStartIsKnownAfterASync(): void
    {
        self::assertNull($this->store->latestGameStart(FakeRiotApi::PUUID));

        $this->sync->sync(FakeRiotApi::PUUID, new \DateTimeImmutable('2026-10-04'));

        self::assertSame(1792990800000, $this->store->latestGameStart(FakeRiotApi::PUUID));
    }

    public function testOtherQueuesAreRefused(): void
    {
        $match = $this->fixture('match_EUW1_7412345678');
        $match['info']['queueId'] = 440;

        $this->expectException(\InvalidArgumentException::class);
        $this->store->save($match);
    }

    private function fixture(string $name): array
    {
        return json_decode((string) file_get_contents(__DIR__.'/../Fixtures/riot/'.$name.'.json'), true, flags: \JSON_THROW_ON_ERROR);
    }
}
