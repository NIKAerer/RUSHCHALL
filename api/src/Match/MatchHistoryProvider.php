<?php

declare(strict_types=1);

namespace App\Match;

use App\Match\Dto\MatchDetail;
use App\Match\Dto\MatchSummary;
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
    ) {
    }

    /**
     * @return list<MatchSummary>
     */
    public function history(string $puuid, int $start, int $count): array
    {
        return array_map(
            fn (array $match) => $this->mapper->toSummary($match, $puuid),
            $this->store->findPageForPlayer($puuid, $start, $count),
        );
    }

    public function detail(string $matchId): MatchDetail
    {
        $match = $this->store->find($matchId) ?? throw new NotFoundException(\sprintf('Game %s is not stored.', $matchId));

        return $this->mapper->toDetail($match);
    }
}
