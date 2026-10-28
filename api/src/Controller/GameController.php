<?php

declare(strict_types=1);

namespace App\Controller;

use App\Match\MatchHistoryProvider;
use App\Match\RankedMatchSync;
use App\Match\SyncWindow;
use App\Pathing\JunglePathingAnalyzer;
use App\Pathing\TimelineNotStoredException;
use App\Riot\Exception\NotFoundException;
use App\Player\TrackedPlayer;
use App\Profile\ProfileProvider;
use App\Rank\LpRecorder;
use App\Storage\MatchStore;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryParameter;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Games Solo/Duo du joueur suivi, lues dans la base locale.
 */
#[Route('/api/games')]
final class GameController extends AbstractController
{
    /** Depuis le site, on ne télécharge que les games récentes ; le rattrapage complet passe par `npm run sync`. */
    private const WEB_SYNC_LIMIT = 10;

    public function __construct(
        private readonly TrackedPlayer $player,
        private readonly MatchStore $store,
    ) {
    }

    #[Route('', name: 'api_games', methods: ['GET'])]
    public function index(
        MatchHistoryProvider $matches,
        #[MapQueryParameter(options: ['min_range' => 0], validationFailedStatusCode: Response::HTTP_BAD_REQUEST)] int $start = 0,
        #[MapQueryParameter(options: ['min_range' => 1, 'max_range' => 50], validationFailedStatusCode: Response::HTTP_BAD_REQUEST)] int $count = 10,
    ): JsonResponse {
        return $this->json($matches->history($this->player->puuid(), $start, $count));
    }

    #[Route('/sync', name: 'api_games_sync', methods: ['POST'])]
    public function sync(RankedMatchSync $sync, SyncWindow $window, ProfileProvider $profiles, LpRecorder $lp): JsonResponse
    {
        set_time_limit(120);
        $puuid = $this->player->puuid();
        $report = $sync->sync($puuid, $window->startFor($puuid), self::WEB_SYNC_LIMIT);
        // Relevé juste après la synchro : la game qu'on vient de finir reçoit ses LP.
        $account = $this->player->account();
        $lp->record($profiles->get($account['gameName'], $account['tagLine']));

        return $this->json([
            'saved' => $report['saved'],
            'remaining' => $report['remaining'],
            'total' => $this->store->countForPlayer($puuid),
        ]);
    }

    #[Route('/{matchId}', name: 'api_game', requirements: ['matchId' => '[A-Z0-9]+_\d+'], methods: ['GET'])]
    public function show(string $matchId, MatchHistoryProvider $matches): JsonResponse
    {
        return $this->json($matches->detail($matchId));
    }

    #[Route('/{matchId}/routine', name: 'api_game_routine', requirements: ['matchId' => '[A-Z0-9]+_\d+'], methods: ['PUT'])]
    public function routine(string $matchId, Request $request): JsonResponse
    {
        $this->store->find($matchId) ?? throw new NotFoundException(\sprintf('Game %s is not stored.', $matchId));
        $done = $request->toArray()['routine'] ?? null;
        if (!\is_bool($done)) {
            throw new BadRequestHttpException('Field "routine" must be a boolean.');
        }
        $this->store->setRoutine($matchId, $done);

        return $this->json(['matchId' => $matchId, 'routine' => $done]);
    }

    #[Route('/{matchId}/pathing', name: 'api_game_pathing', requirements: ['matchId' => '[A-Z0-9]+_\d+'], methods: ['GET'])]
    public function pathing(string $matchId, JunglePathingAnalyzer $analyzer): JsonResponse
    {
        $match = $this->store->find($matchId) ?? throw new NotFoundException(\sprintf('Game %s is not stored.', $matchId));
        $timeline = $this->store->findTimeline($matchId)
            ?? throw new TimelineNotStoredException(\sprintf('Timeline of %s is not stored yet.', $matchId));

        return $this->json($analyzer->analyze($match, $timeline, $this->player->puuid()));
    }
}
