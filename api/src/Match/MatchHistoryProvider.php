<?php

declare(strict_types=1);

namespace App\Match;

use App\Match\Dto\MatchDetail;
use App\Match\Dto\MatchSummary;
use App\Riot\RiotApiClient;

final class MatchHistoryProvider
{
    public function __construct(
        private readonly RiotApiClient $riot,
        private readonly MatchMapper $mapper,
    ) {
    }

    /**
     * @return list<MatchSummary>
     */
    public function history(string $puuid, int $start, int $count, ?int $queue): array
    {
        return array_map(
            fn (string $matchId) => $this->mapper->toSummary($this->riot->getMatch($matchId), $puuid),
            $this->riot->getMatchIds($puuid, $start, $count, $queue),
        );
    }

    public function detail(string $matchId): MatchDetail
    {
        return $this->mapper->toDetail($this->riot->getMatch($matchId));
    }
}
