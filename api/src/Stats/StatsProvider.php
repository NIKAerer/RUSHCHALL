<?php

declare(strict_types=1);

namespace App\Stats;

use App\Rank\LpChangeResolver;
use App\Stats\Dto\PlayerStats;
use App\Storage\MatchStore;
use Symfony\Contracts\Cache\CacheInterface;

/**
 * Stats du joueur suivi sur toutes ses games en base. Les faits de chaque game sont mis en cache :
 * seule une game nouvellement synchronisée (ou dont la timeline vient d'arriver) est analysée.
 */
final class StatsProvider
{
    /** À incrémenter quand GameFacts ou son calcul change. */
    private const CACHE_VERSION = 2;

    public function __construct(
        private readonly MatchStore $store,
        private readonly CacheInterface $statsCache,
        private readonly GameFactsExtractor $extractor = new GameFactsExtractor(),
        private readonly StatsAggregator $aggregator = new StatsAggregator(),
        private readonly LpChangeResolver $lpChanges = new LpChangeResolver(),
    ) {
    }

    /**
     * @param string|null $champion seulement les games sur ce champion
     * @param int|null    $days     seulement les games des N derniers jours
     */
    public function forPlayer(string $puuid, ?string $champion = null, ?int $days = null): PlayerStats
    {
        $withoutTimeline = array_flip($this->store->idsWithoutTimeline($puuid));
        $games = array_map(
            fn (string $matchId) => $this->facts($matchId, $puuid, !isset($withoutTimeline[$matchId])),
            $this->store->idsForPlayer($puuid),
        );

        $since = null === $days ? null : (time() - $days * 86400) * 1000;
        $games = array_values(array_filter($games, static fn (GameFacts $g) => (null === $champion || $g->championName === $champion) && (null === $since || $g->startedAt >= $since)));
        $snapshots = $this->store->lpSnapshots($puuid);
        $lp = array_values(array_filter($snapshots, static fn (array $s) => null === $since || $s['taken_at'] * 1000 >= $since));

        return $this->aggregator->aggregate(
            $games,
            $lp,
            $this->lpChanges->resolve($snapshots, $this->store->gameEndsForPlayer($puuid)),
            $this->store->routineDone(array_map(static fn (GameFacts $g) => $g->matchId, $games)),
        );
    }

    private function facts(string $matchId, string $puuid, bool $hasTimeline): GameFacts
    {
        $key = \sprintf('facts.v%d.%s.%s.%s', self::CACHE_VERSION, $matchId, $hasTimeline ? 'full' : 'bare', hash('xxh3', $puuid));

        return $this->statsCache->get($key, fn () => $this->extractor->extract(
            $this->store->find($matchId) ?? throw new \LogicException(\sprintf('Game %s vanished from the database.', $matchId)),
            $hasTimeline ? $this->store->findTimeline($matchId) : null,
            $puuid,
        ));
    }
}
