<?php

declare(strict_types=1);

namespace App\Match;

use App\Match\Dto\MatchDetail;
use App\Match\Dto\MatchSummary;
use App\Rank\LpChangeResolver;
use App\Riot\Exception\NotFoundException;
use App\Storage\MatchStore;

/**
 * Historique lu uniquement dans la base : afficher une page ne coûte aucune requête à Riot.
 */
final class MatchHistoryProvider
{
    public function __construct(
        private readonly MatchMapper $mapper,
        private readonly MatchStore $store,
        private readonly LpChangeResolver $lpChanges,
    ) {
    }

    /**
     * @return list<MatchSummary>
     */
    public function history(string $puuid, int $start, int $count): array
    {
        $summaries = array_map(
            fn (array $match) => $this->mapper->toSummary($match, $puuid),
            $this->store->findPageForPlayer($puuid, $start, $count),
        );
        $lp = $this->lpChanges->resolve($this->store->lpSnapshots($puuid), $this->store->gameEndsForPlayer($puuid));
        $routine = array_flip($this->store->routineDone(array_map(static fn (MatchSummary $s) => $s->matchId, $summaries)));

        return array_map(static fn (MatchSummary $s) => $s->withTracking($lp[$s->matchId] ?? null, isset($routine[$s->matchId])), $summaries);
    }

    public function detail(string $matchId): MatchDetail
    {
        $match = $this->store->find($matchId) ?? throw new NotFoundException(\sprintf('Game %s is not stored.', $matchId));

        return $this->mapper->toDetail($match);
    }
}
