<?php

declare(strict_types=1);

namespace App\Match;

use App\Riot\RiotApiClient;
use App\Storage\MatchStore;

/**
 * Récupère les games classées Solo/Duo d'un joueur depuis une date et les range en base.
 * Seules les games absentes de la base coûtent une requête à Riot.
 */
final class RankedMatchSync
{
    private const PAGE_SIZE = 100;

    public function __construct(
        private readonly RiotApiClient $riot,
        private readonly MatchStore $store,
    ) {
    }

    /**
     * @param int|null                             $limit   nombre maximum de games à télécharger (les plus récentes d'abord)
     * @param callable(string $matchId): void|null $onSaved appelé après chaque game enregistrée
     *
     * @return array{found: int, alreadyStored: int, saved: int, remaining: int}
     */
    public function sync(string $puuid, \DateTimeImmutable $since, ?int $limit = null, ?callable $onSaved = null): array
    {
        $matchIds = [];
        for ($start = 0; ; $start += self::PAGE_SIZE) {
            $page = $this->riot->getMatchIds($puuid, $start, self::PAGE_SIZE, MatchStore::QUEUE_RANKED_SOLO, $since->getTimestamp());
            $matchIds = [...$matchIds, ...$page];
            if (\count($page) < self::PAGE_SIZE) {
                break;
            }
        }

        $matchIds = array_values(array_unique($matchIds));
        $missing = array_values(array_diff($matchIds, $this->store->existing($matchIds)));

        $toFetch = null === $limit ? $missing : \array_slice($missing, 0, $limit);

        $saved = 0;
        foreach ($toFetch as $matchId) {
            $match = $this->riot->getMatch($matchId);
            if (MatchStore::QUEUE_RANKED_SOLO !== $match['info']['queueId']) {
                continue;
            }
            $this->store->save($match);
            ++$saved;
            if (null !== $onSaved) {
                $onSaved($matchId);
            }
        }

        return [
            'found' => \count($matchIds),
            'alreadyStored' => \count($matchIds) - \count($missing),
            'saved' => $saved,
            'remaining' => \count($missing) - \count($toFetch),
        ];
    }
}
