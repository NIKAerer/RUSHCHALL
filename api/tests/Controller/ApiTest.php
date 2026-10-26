<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Tests\Fixtures\FakeRiotApi;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class ApiTest extends WebTestCase
{
    public function testProfile(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/profiles/KGB/'.rawurlencode('Мажор'));

        self::assertResponseIsSuccessful();
        $profile = $this->json($client);
        self::assertSame(FakeRiotApi::PUUID, $profile['puuid']);
        self::assertSame('Мажор', $profile['tagLine']);
        self::assertSame(564, $profile['summonerLevel']);
        self::assertSame('solo', $profile['ranked'][0]['queue']);
        self::assertSame('MASTER', $profile['ranked'][0]['tier']);
        self::assertNull($profile['ranked'][0]['division']);
        self::assertSame(1290, $profile['ranked'][0]['leaguePoints']);
        self::assertSame('I', $profile['ranked'][1]['division']);
    }

    public function testUnknownPlayerAnswers404(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/profiles/Nobody/EUW');

        self::assertResponseStatusCodeSame(404);
        self::assertSame('not_found', $this->json($client)['error']);
    }

    public function testMatchHistory(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/players/'.FakeRiotApi::PUUID.'/matches?count=2');

        self::assertResponseIsSuccessful();
        $matches = $this->json($client);
        self::assertCount(2, $matches);
        self::assertSame('EUW1_7412345678', $matches[0]['matchId']);
        self::assertSame('LeeSin', $matches[0]['player']['championName']);
        self::assertCount(10, $matches[0]['lineup']);
    }

    public function testMatchHistoryRejectsTooLargePages(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/players/'.FakeRiotApi::PUUID.'/matches?count=100');

        self::assertResponseStatusCodeSame(400);
    }

    public function testMatchDetail(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/matches/EUW1_7412001122');

        self::assertResponseIsSuccessful();
        $match = $this->json($client);
        self::assertCount(2, $match['teams']);
        self::assertSame('Lillia', $match['teams'][1]['participants'][1]['championName']);
        self::assertSame(3, $match['teams'][0]['objectives']['dragons']);
    }

    private function json($client): array
    {
        return json_decode((string) $client->getResponse()->getContent(), true, flags: \JSON_THROW_ON_ERROR);
    }
}
