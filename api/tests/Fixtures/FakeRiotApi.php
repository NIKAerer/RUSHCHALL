<?php

declare(strict_types=1);

namespace App\Tests\Fixtures;

use Symfony\Component\HttpClient\Response\MockResponse;
use Symfony\Contracts\HttpClient\ResponseInterface;

/**
 * Fausse API Riot utilisée en environnement de test : sert les fichiers de tests/Fixtures/riot.
 */
final class FakeRiotApi
{
    public const PUUID = 'puuid-kgb';

    /** @var list<string> */
    public array $requestedUrls = [];

    public function __invoke(string $method, string $url, array $options = []): ResponseInterface
    {
        $this->requestedUrls[] = $url;
        $path = rawurldecode((string) parse_url($url, \PHP_URL_PATH));
        $host = (string) parse_url($url, \PHP_URL_HOST);

        $fixture = match (true) {
            'europe.api.riotgames.com' === $host && '/riot/account/v1/accounts/by-riot-id/KGB/Мажор' === $path => 'account',
            'euw1.api.riotgames.com' === $host && '/lol/summoner/v4/summoners/by-puuid/'.self::PUUID === $path => 'summoner',
            'euw1.api.riotgames.com' === $host && '/lol/league/v4/entries/by-puuid/'.self::PUUID === $path => 'league',
            'europe.api.riotgames.com' === $host && '/lol/match/v5/matches/by-puuid/'.self::PUUID.'/ids' === $path => 'match_ids',
            'europe.api.riotgames.com' === $host && 1 === preg_match('#^/lol/match/v5/matches/(EUW1_\d+)$#', $path, $m) => 'match_'.$m[1],
            'europe.api.riotgames.com' === $host && 1 === preg_match('#^/lol/match/v5/matches/(EUW1_\d+)/timeline$#', $path, $m) => 'timeline_'.$m[1],
            default => null,
        };

        $file = null !== $fixture ? __DIR__.'/riot/'.$fixture.'.json' : null;
        if (null === $file || !is_file($file)) {
            return new MockResponse('{"status":{"status_code":404}}', ['http_code' => 404]);
        }

        return new MockResponse((string) file_get_contents($file), ['http_code' => 200]);
    }
}
