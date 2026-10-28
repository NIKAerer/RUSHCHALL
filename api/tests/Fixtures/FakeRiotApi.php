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

    /** Un autre joueur, que l'on peut chercher : ses fichiers finissent par « _nyxar ». */
    public const OTHER_PUUID = 'puuid-nyxar';

    /** @var list<string> */
    public array $requestedUrls = [];

    public function __invoke(string $method, string $url, array $options = []): ResponseInterface
    {
        $this->requestedUrls[] = $url;
        $path = rawurldecode((string) parse_url($url, \PHP_URL_PATH));
        $host = (string) parse_url($url, \PHP_URL_HOST);

        $suffix = str_contains($path, self::OTHER_PUUID) || str_ends_with($path, '/Nyxar/EUW') ? '_nyxar' : '';
        $puuid = '' === $suffix ? self::PUUID : self::OTHER_PUUID;
        $fixture = match (true) {
            'europe.api.riotgames.com' === $host && \in_array($path, ['/riot/account/v1/accounts/by-riot-id/KGB/Мажор', '/riot/account/v1/accounts/by-riot-id/Nyxar/EUW'], true) => 'account'.$suffix,
            'euw1.api.riotgames.com' === $host && '/lol/summoner/v4/summoners/by-puuid/'.$puuid === $path => 'summoner'.$suffix,
            'euw1.api.riotgames.com' === $host && '/lol/league/v4/entries/by-puuid/'.$puuid === $path => 'league'.$suffix,
            'europe.api.riotgames.com' === $host && '/lol/match/v5/matches/by-puuid/'.$puuid.'/ids' === $path => 'match_ids'.$suffix,
            'euw1.api.riotgames.com' === $host && 1 === preg_match('#^/lol/league/v4/(challenger|grandmaster)leagues/by-queue/RANKED_SOLO_5x5$#', $path, $m) => 'league_'.$m[1],
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
