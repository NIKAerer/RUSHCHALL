<?php

declare(strict_types=1);

namespace App\Rank;

use App\Rank\Dto\Climb;
use App\Riot\Exception\RiotApiException;
use App\Riot\RiotApiClient;
use App\Storage\MatchStore;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

/**
 * Où en est le joueur suivi par rapport aux seuils Grandmaster et Challenger d'EUW, et à quel rythme il monte.
 */
final class ClimbProvider
{
    private const CUTOFF_TTL = 3600;
    private const PACE_DAYS = 7;

    public function __construct(
        #[Autowire(service: 'riot.live_client')] private readonly RiotApiClient $riot,
        private readonly MatchStore $store,
        #[Autowire(service: 'cache.ladder')] private readonly CacheInterface $cache,
    ) {
    }

    public function forPlayer(string $puuid): Climb
    {
        $snapshots = $this->store->lpSnapshots($puuid);
        $latest = [] === $snapshots ? null : $snapshots[\count($snapshots) - 1];

        return new Climb(
            tier: $latest['tier'] ?? null,
            leaguePoints: $latest['league_points'] ?? null,
            challenger: $this->cutoff('challenger'),
            grandmaster: $this->cutoff('grandmaster'),
            lpPerDay: $this->pace($snapshots),
        );
    }

    /**
     * LP du dernier joueur de la ligue. Seul ce nombre est gardé en cache, jamais la liste des joueurs.
     */
    private function cutoff(string $league): ?int
    {
        try {
            return $this->cache->get('cutoff.'.$league, function (ItemInterface $item) use ($league): ?int {
                $item->expiresAfter(self::CUTOFF_TTL);
                $points = array_column($this->riot->getApexLeague($league)['entries'] ?? [], 'leaguePoints');

                return [] === $points ? null : min($points);
            });
        } catch (RiotApiException) {
            return null;
        }
    }

    /**
     * LP par jour entre le dernier relevé et celui d'il y a une semaine (ou le plus ancien).
     *
     * @param list<array{taken_at: int, tier: string, division: ?string, league_points: int}> $snapshots du plus ancien au plus récent
     */
    private function pace(array $snapshots): ?float
    {
        $latest = [] === $snapshots ? null : $snapshots[\count($snapshots) - 1];
        if (null === $latest) {
            return null;
        }
        $base = $snapshots[0];
        foreach ($snapshots as $snapshot) {
            if ($snapshot['taken_at'] <= $latest['taken_at'] - self::PACE_DAYS * 86400) {
                $base = $snapshot;
            }
        }
        $days = ($latest['taken_at'] - $base['taken_at']) / 86400;
        if ($days < 1) {
            return null;
        }

        $score = static fn (array $s) => Ladder::score($s['tier'], $s['division'], $s['league_points']);

        return round(($score($latest) - $score($base)) / $days, 1);
    }
}
