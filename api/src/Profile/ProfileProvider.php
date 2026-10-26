<?php

declare(strict_types=1);

namespace App\Profile;

use App\Profile\Dto\Profile;
use App\Profile\Dto\RankedEntry;
use App\Riot\Platform;
use App\Riot\RiotApiClient;

final class ProfileProvider
{
    private const QUEUES = [
        'RANKED_SOLO_5x5' => 'solo',
        'RANKED_FLEX_SR' => 'flex',
    ];

    /** Au-dessus de Diamant, Riot renvoie toujours la division "I", qui n'a pas de sens. */
    private const APEX_TIERS = ['MASTER', 'GRANDMASTER', 'CHALLENGER'];

    public function __construct(
        private readonly RiotApiClient $riot,
        private readonly Platform $riotPlatform,
    ) {
    }

    public function get(string $gameName, string $tagLine): Profile
    {
        $account = $this->riot->getAccountByRiotId($gameName, $tagLine);
        $summoner = $this->riot->getSummonerByPuuid($account['puuid']);
        $entries = $this->riot->getLeagueEntriesByPuuid($account['puuid']);

        return new Profile(
            puuid: $account['puuid'],
            gameName: $account['gameName'],
            tagLine: $account['tagLine'],
            platform: $this->riotPlatform->value,
            profileIconId: $summoner['profileIconId'],
            summonerLevel: $summoner['summonerLevel'],
            ranked: $this->mapRanked($entries),
        );
    }

    /**
     * @param list<array<string, mixed>> $entries
     *
     * @return list<RankedEntry>
     */
    private function mapRanked(array $entries): array
    {
        $ranked = [];
        foreach ($entries as $entry) {
            $queue = self::QUEUES[$entry['queueType']] ?? null;
            if (null === $queue) {
                continue;
            }

            $ranked[] = new RankedEntry(
                queue: $queue,
                tier: $entry['tier'],
                division: \in_array($entry['tier'], self::APEX_TIERS, true) ? null : $entry['rank'],
                leaguePoints: $entry['leaguePoints'],
                wins: $entry['wins'],
                losses: $entry['losses'],
            );
        }

        // La Solo/Duo d'abord.
        usort($ranked, static fn (RankedEntry $a, RankedEntry $b): int => ('flex' === $a->queue) <=> ('flex' === $b->queue));

        return $ranked;
    }
}
