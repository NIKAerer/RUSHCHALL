<?php

declare(strict_types=1);

namespace App\Match;

use App\Match\Dto\MatchDetail;
use App\Match\Dto\MatchSummary;
use App\Riot\RiotApiClient;
use App\Storage\MatchStore;

final class MatchHistoryProvider
{
    public function __construct(
        private readonly RiotApiClient $riot,
        private readonly MatchMapper $mapper,
        private readonly MatchStore $store,
    ) {
    }

    /**
     * @return list<MatchSummary>
     */
    public function history(string $puuid, int $start, int $count, ?int $queue): array
    {
        return array_map(
            fn (string $matchId) => $this->mapper->toSummary($this->match($matchId), $puuid),
            $this->riot->getMatchIds($puuid, $start, $count, $queue),
        );
    }

    public function detail(string $matchId): MatchDetail
    {
        return $this->mapper->toDetail($this->match($matchId));
    }

    /**
     * Lit la game en base si elle y est, sinon la demande à Riot.
     * Le site n'écrit jamais en base : seule la synchronisation (app:ranked:sync) y range des games.
     *
     * @return array{metadata: array<string, mixed>, info: array<string, mixed>}
     */
    private function match(string $matchId): array
    {
        return $this->store->find($matchId) ?? $this->riot->getMatch($matchId);
    }
}
