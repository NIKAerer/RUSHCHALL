<?php

declare(strict_types=1);

namespace App\Match;

use App\Riot\RiotApiClient;
use App\Storage\MatchStore;

/**
 * Récupère les games classées Solo/Duo d'un joueur depuis une date et les range en base, avec leur timeline.
 * Seules les games absentes de la base coûtent des requêtes à Riot (2 par game : la game et sa timeline).
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
     * @param int|null                             $limit   nombre maximum de games à traiter (les plus récentes d'abord)
     * @param callable(string $matchId): void|null $onSaved appelé après chaque game ou timeline enregistrée
     *
     * @return array{found: int, alreadyStored: int, saved: int, timelines: int, remaining: int}
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
            $this->store->saveTimeline($this->riot->getTimeline($matchId));
            ++$saved;
            if (null !== $onSaved) {
                $onSaved($matchId);
            }
        }

        // Games stockées avant l'ajout des timelines : on les complète avec ce qu'il reste de la limite.
        $withoutTimeline = $this->store->idsWithoutTimeline($puuid);
        $timelinesToFetch = null === $limit ? $withoutTimeline : \array_slice($withoutTimeline, 0, max(0, $limit - \count($toFetch)));
        foreach ($timelinesToFetch as $matchId) {
            $this->store->saveTimeline($this->riot->getTimeline($matchId));
            if (null !== $onSaved) {
                $onSaved($matchId.' (timeline)');
            }
        }

        return [
            'found' => \count($matchIds),
            'alreadyStored' => \count($matchIds) - \count($missing),
            'saved' => $saved,
            'timelines' => \count($timelinesToFetch),
            'remaining' => \count($missing) - \count($toFetch) + \count($withoutTimeline) - \count($timelinesToFetch),
        ];
    }
}
