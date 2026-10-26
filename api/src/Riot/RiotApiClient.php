<?php

declare(strict_types=1);

namespace App\Riot;

use App\Riot\Exception\InvalidApiKeyException;
use App\Riot\Exception\NotFoundException;
use App\Riot\Exception\RateLimitedException;
use App\Riot\Exception\RiotApiException;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Accès en lecture à l'API Riot, avec un cache adapté à chaque ressource.
 */
final class RiotApiClient
{
    private const TTL_ACCOUNT = 3600;
    private const TTL_LIVE = 120;
    private const TTL_MATCH_IDS = 60;
    private const TTL_MATCH = 30 * 86400;

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly CacheInterface $cache,
        private readonly Platform $riotPlatform,
        private readonly ?RateLimiter $rateLimiter = null,
    ) {
    }

    /**
     * @return array{puuid: string, gameName: string, tagLine: string}
     */
    public function getAccountByRiotId(string $gameName, string $tagLine): array
    {
        return $this->get(
            \sprintf('%s/riot/account/v1/accounts/by-riot-id/%s/%s', $this->riotPlatform->regionBaseUri(), rawurlencode($gameName), rawurlencode($tagLine)),
            self::TTL_ACCOUNT,
        );
    }

    /**
     * @return array{puuid: string, profileIconId: int, summonerLevel: int}
     */
    public function getSummonerByPuuid(string $puuid): array
    {
        return $this->get(
            \sprintf('%s/lol/summoner/v4/summoners/by-puuid/%s', $this->riotPlatform->platformBaseUri(), rawurlencode($puuid)),
            self::TTL_LIVE,
        );
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function getLeagueEntriesByPuuid(string $puuid): array
    {
        return $this->get(
            \sprintf('%s/lol/league/v4/entries/by-puuid/%s', $this->riotPlatform->platformBaseUri(), rawurlencode($puuid)),
            self::TTL_LIVE,
        );
    }

    /**
     * @param int|null $startTime ne garde que les games commencées après ce timestamp (en secondes)
     *
     * @return list<string>
     */
    public function getMatchIds(string $puuid, int $start, int $count, ?int $queue = null, ?int $startTime = null): array
    {
        $query = http_build_query(array_filter(['start' => $start, 'count' => $count, 'queue' => $queue, 'startTime' => $startTime], static fn ($v) => null !== $v));

        return $this->get(
            \sprintf('%s/lol/match/v5/matches/by-puuid/%s/ids?%s', $this->riotPlatform->regionBaseUri(), rawurlencode($puuid), $query),
            self::TTL_MATCH_IDS,
        );
    }

    /**
     * @return array{metadata: array<string, mixed>, info: array<string, mixed>}
     */
    public function getMatch(string $matchId): array
    {
        return $this->get(
            \sprintf('%s/lol/match/v5/matches/%s', $this->riotPlatform->regionBaseUri(), rawurlencode($matchId)),
            self::TTL_MATCH,
        );
    }

    /**
     * Positions des joueurs minute par minute et événements de la game (kills, objectifs…).
     *
     * @return array{metadata: array<string, mixed>, info: array<string, mixed>}
     */
    public function getTimeline(string $matchId): array
    {
        return $this->request(\sprintf('%s/lol/match/v5/matches/%s/timeline', $this->riotPlatform->regionBaseUri(), rawurlencode($matchId)));
    }

    private function get(string $url, int $ttl): array
    {
        return $this->cache->get('riot.'.sha1($url), function (ItemInterface $item) use ($url, $ttl): array {
            $item->expiresAfter($ttl);

            return $this->request($url);
        });
    }

    private function request(string $url): array
    {
        $this->rateLimiter?->wait();

        try {
            $response = $this->httpClient->request('GET', $url);
            $status = $response->getStatusCode();

            return match (true) {
                200 === $status => $response->toArray(),
                404 === $status => throw new NotFoundException(\sprintf('Riot resource not found: %s', $url)),
                401 === $status, 403 === $status => throw new InvalidApiKeyException('Riot API key is missing, invalid or expired.'),
                429 === $status => throw new RateLimitedException($this->retryAfter($response->getHeaders(false))),
                default => throw new RiotApiException(\sprintf('Riot API answered %d for %s', $status, $url)),
            };
        } catch (TransportExceptionInterface $e) {
            throw new RiotApiException('Riot API is unreachable.', previous: $e);
        }
    }

    /**
     * @param array<string, list<string>> $headers
     */
    private function retryAfter(array $headers): ?int
    {
        $value = $headers['retry-after'][0] ?? null;

        return is_numeric($value) ? (int) $value : null;
    }
}
