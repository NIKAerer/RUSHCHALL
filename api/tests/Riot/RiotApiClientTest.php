<?php

declare(strict_types=1);

namespace App\Tests\Riot;

use App\Riot\Exception\InvalidApiKeyException;
use App\Riot\Exception\NotFoundException;
use App\Riot\Exception\RateLimitedException;
use App\Riot\Platform;
use App\Riot\RiotApiClient;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Cache\Adapter\ArrayAdapter;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;

final class RiotApiClientTest extends TestCase
{
    private ?string $lastUrl = null;

    public function testAccountIsFetchedOnTheRegionalHostWithAnEncodedTag(): void
    {
        $client = new RiotApiClient($this->recordingClient('{"puuid":"p","gameName":"KGB","tagLine":"Мажор"}'), new ArrayAdapter(), Platform::EUW);

        $account = $client->getAccountByRiotId('KGB', 'Мажор');

        self::assertSame('p', $account['puuid']);
        self::assertSame(
            'https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/KGB/%D0%9C%D0%B0%D0%B6%D0%BE%D1%80',
            $this->lastUrl,
        );
    }

    public function testSummonerUsesThePlatformHost(): void
    {
        $client = new RiotApiClient($this->recordingClient('{"puuid":"p","profileIconId":1,"summonerLevel":30}'), new ArrayAdapter(), Platform::KR);

        $client->getSummonerByPuuid('p');

        self::assertSame('https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/p', $this->lastUrl);
    }

    public function testMatchIdsQueryOmitsTheQueueWhenNotFiltered(): void
    {
        $client = new RiotApiClient($this->recordingClient('[]'), new ArrayAdapter(), Platform::EUW);

        $client->getMatchIds('p', 10, 5);

        self::assertSame('https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/p/ids?start=10&count=5', $this->lastUrl);
    }

    public function testResponsesAreCached(): void
    {
        $http = new MockHttpClient([new MockResponse('{"metadata":{},"info":{}}')]);
        $client = new RiotApiClient($http, new ArrayAdapter(), Platform::EUW);

        $client->getMatch('EUW1_1');
        $client->getMatch('EUW1_1');

        self::assertSame(1, $http->getRequestsCount());
    }

    public function testExpiredKeyIsReported(): void
    {
        $client = new RiotApiClient(new MockHttpClient(new MockResponse('', ['http_code' => 403])), new ArrayAdapter(), Platform::EUW);

        $this->expectException(InvalidApiKeyException::class);
        $client->getMatch('EUW1_1');
    }

    public function testUnknownPlayerIsReported(): void
    {
        $client = new RiotApiClient(new MockHttpClient(new MockResponse('', ['http_code' => 404])), new ArrayAdapter(), Platform::EUW);

        $this->expectException(NotFoundException::class);
        $client->getAccountByRiotId('Nobody', 'EUW');
    }

    public function testRateLimitCarriesRetryAfter(): void
    {
        $client = new RiotApiClient(
            new MockHttpClient(new MockResponse('', ['http_code' => 429, 'response_headers' => ['Retry-After' => '7']])),
            new ArrayAdapter(),
            Platform::EUW,
        );

        try {
            $client->getMatch('EUW1_1');
            self::fail('A RateLimitedException was expected.');
        } catch (RateLimitedException $e) {
            self::assertSame(7, $e->retryAfter);
        }
    }

    private function recordingClient(string $body): MockHttpClient
    {
        return new MockHttpClient(function (string $method, string $url) use ($body): MockResponse {
            $this->lastUrl = $url;

            return new MockResponse($body);
        });
    }
}
