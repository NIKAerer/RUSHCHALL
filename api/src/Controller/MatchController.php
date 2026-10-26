<?php

declare(strict_types=1);

namespace App\Controller;

use App\Match\MatchHistoryProvider;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryParameter;
use Symfony\Component\Routing\Attribute\Route;

final class MatchController extends AbstractController
{
    #[Route('/api/players/{puuid}/matches', name: 'api_match_history', methods: ['GET'])]
    public function history(
        string $puuid,
        MatchHistoryProvider $matches,
        #[MapQueryParameter(options: ['min_range' => 0], validationFailedStatusCode: Response::HTTP_BAD_REQUEST)] int $start = 0,
        #[MapQueryParameter(options: ['min_range' => 1, 'max_range' => 20], validationFailedStatusCode: Response::HTTP_BAD_REQUEST)] int $count = 10,
        #[MapQueryParameter(options: ['min_range' => 0], validationFailedStatusCode: Response::HTTP_BAD_REQUEST)] ?int $queue = null,
    ): JsonResponse {
        return $this->json($matches->history($puuid, $start, $count, $queue));
    }

    #[Route('/api/matches/{matchId}', name: 'api_match_detail', requirements: ['matchId' => '[A-Z0-9]+_\d+'], methods: ['GET'])]
    public function detail(string $matchId, MatchHistoryProvider $matches): JsonResponse
    {
        return $this->json($matches->detail($matchId));
    }
}
