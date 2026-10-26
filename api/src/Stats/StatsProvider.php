<?php

declare(strict_types=1);

namespace App\Stats;

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
    private const CACHE_VERSION = 1;

    public function __construct(
        private readonly MatchStore $store,
        private readonly CacheInterface $statsCache,
        private readonly GameFactsExtractor $extractor = new GameFactsExtractor(),
        private readonly StatsAggregator $aggregator = new StatsAggregator(),
    ) {
    }

    public function forPlayer(string $puuid): PlayerStats
    {
        $withoutTimeline = array_flip($this->store->idsWithoutTimeline($puuid));
        $games = array_map(
            fn (string $matchId) => $this->facts($matchId, $puuid, !isset($withoutTimeline[$matchId])),
            $this->store->idsForPlayer($puuid),
        );

        return $this->aggregator->aggregate($games, $this->store->lpSnapshots($puuid));
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
