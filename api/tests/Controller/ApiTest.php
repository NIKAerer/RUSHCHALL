<?php

declare(strict_types=1);

namespace App\Tests\Controller;

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

    private function json(): array
    {
        return json_decode((string) $this->client->getResponse()->getContent(), true, flags: \JSON_THROW_ON_ERROR);
    }
}
