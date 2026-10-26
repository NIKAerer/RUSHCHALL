<?php

declare(strict_types=1);

namespace App\Controller;

use App\Match\MatchHistoryProvider;
use App\Match\RankedMatchSync;
use App\Match\SyncWindow;
use App\Player\TrackedPlayer;
use App\Storage\MatchStore;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryParameter;
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
    public function sync(RankedMatchSync $sync, SyncWindow $window): JsonResponse
    {
        set_time_limit(120);
        $puuid = $this->player->puuid();
        $report = $sync->sync($puuid, $window->startFor($puuid), self::WEB_SYNC_LIMIT);

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
}
