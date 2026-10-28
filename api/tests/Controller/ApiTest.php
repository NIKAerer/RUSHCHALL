<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Storage\MatchStore;
use App\Tests\Fixtures\FakeRiotApi;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class ApiTest extends WebTestCase
{
    private KernelBrowser $client;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        // La base de test est en mémoire : on garde le même kernel entre les requêtes.
        $this->client->disableReboot();
    }

    public function testProfileOfTheTrackedPlayer(): void
    {
        $this->client->request('GET', '/api/profile');

        self::assertResponseIsSuccessful();
        $profile = $this->json();
        self::assertSame(FakeRiotApi::PUUID, $profile['puuid']);
        self::assertSame('Мажор', $profile['tagLine']);
        self::assertSame(564, $profile['summonerLevel']);
        self::assertSame('solo', $profile['ranked'][0]['queue']);
        self::assertNull($profile['ranked'][0]['division']);
        self::assertSame(1290, $profile['ranked'][0]['leaguePoints']);
        self::assertSame('I', $profile['ranked'][1]['division']);
    }

    public function testRoutineCanBeTickedOnAGame(): void
    {
        $this->client->request('POST', '/api/games/sync');
        $this->client->request('GET', '/api/games');
        self::assertFalse($this->json()[0]['routine']);
        self::assertNull($this->json()[0]['lpChange']);

        $this->client->request('PUT', '/api/games/EUW1_7412345678/routine', content: '{"routine": true}');
        self::assertResponseIsSuccessful();

        $this->client->request('GET', '/api/games');
        self::assertTrue($this->json()[0]['routine']);
        self::assertFalse($this->json()[1]['routine']);

        $this->client->request('PUT', '/api/games/EUW1_7412345678/routine', content: '{"routine": "oui"}');
        self::assertResponseStatusCodeSame(400);

        $this->client->request('PUT', '/api/games/EUW1_1/routine', content: '{"routine": true}');
        self::assertResponseStatusCodeSame(404);
    }

    public function testHistoryIsEmptyUntilTheFirstSync(): void
    {
        $this->client->request('GET', '/api/games');

        self::assertResponseIsSuccessful();
        self::assertSame([], $this->json());
    }

    public function testSyncThenHistory(): void
    {
        $this->client->request('POST', '/api/games/sync');
        self::assertResponseIsSuccessful();
        self::assertSame(['saved' => 2, 'remaining' => 0, 'total' => 2], $this->json());

        $this->client->request('GET', '/api/games?count=10');
        self::assertResponseIsSuccessful();
        $games = $this->json();
        self::assertCount(2, $games);
        self::assertSame('EUW1_7412345678', $games[0]['matchId']);
        self::assertSame('LeeSin', $games[0]['player']['championName']);
        self::assertCount(10, $games[0]['lineup']);

        $this->client->request('GET', '/api/games/EUW1_7412001122');
        self::assertResponseIsSuccessful();
        $game = $this->json();
        self::assertSame('Lillia', $game['teams'][1]['participants'][1]['championName']);
        self::assertSame(3, $game['teams'][0]['objectives']['dragons']);
    }

    public function testSecondSyncFetchesNothing(): void
    {
        $this->client->request('POST', '/api/games/sync');
        $this->client->request('POST', '/api/games/sync');

        self::assertSame(['saved' => 0, 'remaining' => 0, 'total' => 2], $this->json());
    }

    public function testPathingOfAStoredGame(): void
    {
        $this->client->request('POST', '/api/games/sync');
        $this->client->request('GET', '/api/games/EUW1_7412345678/pathing');

        self::assertResponseIsSuccessful();
        $pathing = $this->json();
        self::assertSame(['LeeSin', 'XinZhao'], array_column($pathing['junglers'], 'championName'));
        self::assertSame('gank', $pathing['junglers'][0]['moments'][0]['type']);
        self::assertSame('dragon', $pathing['objectives'][1]['type']);
    }

    public function testStatsOverAllStoredGames(): void
    {
        $this->client->request('GET', '/api/profile');
        $this->client->request('POST', '/api/games/sync');
        $this->client->request('GET', '/api/stats');

        self::assertResponseIsSuccessful();
        $stats = $this->json();
        self::assertSame(2, $stats['games']);
        self::assertEqualsCanonicalizing(['LeeSin', 'Lillia'], array_column($stats['champions'], 'championName'));
        self::assertEqualsCanonicalizing(['XinZhao', 'Viego'], array_column($stats['matchups'], 'opponent'));
        self::assertSame([10, 15], array_column($stats['diffs'], 'minute'));
        self::assertSame(['grubs', 'herald', 'dragon', 'atakhan', 'baron'], array_column($stats['objectives'], 'type'));
        self::assertNotEmpty($stats['heatmap']['cells']);
        self::assertCount(24, $stats['form']['byHour']);
        self::assertCount($stats['games'], $stats['progress']);
        self::assertLessThan($stats['progress'][1]['t'], $stats['progress'][0]['t']);
        self::assertSame(2800 + 1290, $stats['form']['lp'][0]['ladder']);
    }

    public function testStatsCanBeFilteredByChampion(): void
    {
        $this->client->request('POST', '/api/games/sync');
        $this->client->request('GET', '/api/stats?champion=LeeSin');

        self::assertResponseIsSuccessful();
        self::assertSame(1, $this->json()['games']);
        self::assertSame(['LeeSin'], array_column($this->json()['champions'], 'championName'));

        $this->client->request('GET', '/api/stats?champion=Lee%20Sin');
        self::assertResponseStatusCodeSame(400);
    }

    public function testLpIsRecordedOnlyWhenItChanges(): void
    {
        $this->client->request('GET', '/api/profile');
        $this->client->request('GET', '/api/profile');
        $this->client->request('GET', '/api/stats');

        self::assertCount(1, $this->json()['form']['lp']);
    }

    public function testUnknownGameAnswers404(): void
    {
        $this->client->request('GET', '/api/games/EUW1_1');

        self::assertResponseStatusCodeSame(404);
        self::assertSame('not_found', $this->json()['error']);
    }

    public function testTooLargePagesAreRejected(): void
    {
        $this->client->request('GET', '/api/games?count=100');

        self::assertResponseStatusCodeSame(400);
    }

    public function testClimbComparesTheLastSnapshotWithTheApexCutoffs(): void
    {
        $this->client->request('GET', '/api/profile');
        $this->client->request('GET', '/api/climb');

        self::assertResponseIsSuccessful();
        self::assertSame(['tier' => 'MASTER', 'leaguePoints' => 1290, 'challenger' => 1388, 'grandmaster' => 801, 'lpPerDay' => null], $this->json());

        // Rythme : depuis le relevé d'il y a 7 jours et demi (le plus récent d'au moins une semaine).
        $store = static::getContainer()->get(MatchStore::class);
        $now = $store->lpSnapshots(FakeRiotApi::PUUID)[0]['taken_at'];
        $store->recordLp(FakeRiotApi::PUUID, 'MASTER', null, 1100, 700, 690, $now - 10 * 86400);
        $store->recordLp(FakeRiotApi::PUUID, 'MASTER', null, 1140, 710, 695, $now - 15 * 43200);
        $this->client->request('GET', '/api/climb');
        self::assertEquals(20.0, $this->json()['lpPerDay']);
    }

    public function testAnotherPlayerIsReadLiveAndNeverStored(): void
    {
        $this->client->request('GET', '/api/players/Nyxar/EUW');
        self::assertResponseIsSuccessful();
        self::assertSame(FakeRiotApi::OTHER_PUUID, $this->json()['puuid']);
        self::assertSame(47, $this->json()['ranked'][0]['leaguePoints']);

        $this->client->request('GET', '/api/players/Nyxar/EUW/games');
        self::assertResponseIsSuccessful();
        self::assertCount(1, $this->json());
        self::assertSame('Nyxar', $this->json()[0]['player']['gameName']);
        self::assertNull($this->json()[0]['lpChange']);

        $this->client->request('GET', '/api/matches/EUW1_7412345678');
        self::assertResponseIsSuccessful();
        self::assertCount(2, $this->json()['teams']);

        $store = static::getContainer()->get(MatchStore::class);
        self::assertNull($store->find('EUW1_7412345678'));
        self::assertSame(0, $store->countForPlayer(FakeRiotApi::OTHER_PUUID));
        self::assertSame([], $store->lpSnapshots(FakeRiotApi::OTHER_PUUID));
    }

    public function testSearchedPlayerPagesAreSmallAndUnknownPlayersAnswer404(): void
    {
        $this->client->request('GET', '/api/players/Nyxar/EUW/games?count=11');
        self::assertResponseStatusCodeSame(400);

        $this->client->request('GET', '/api/players/Personne/EUW');
        self::assertResponseStatusCodeSame(404);
        self::assertSame('not_found', $this->json()['error']);
    }

    private function json(): array
    {
        return json_decode((string) $this->client->getResponse()->getContent(), true, flags: \JSON_THROW_ON_ERROR);
    }
}
