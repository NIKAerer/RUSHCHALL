<?php

declare(strict_types=1);

namespace App\Controller;

use App\Player\TrackedPlayer;
use App\Rank\ClimbProvider;
use App\Stats\StatsProvider;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryParameter;
use Symfony\Component\Routing\Attribute\Route;

final class StatsController extends AbstractController
{
    #[Route('/api/stats', name: 'api_stats', methods: ['GET'])]
    public function show(
        TrackedPlayer $player,
        StatsProvider $stats,
        #[MapQueryParameter(options: ['regexp' => '/^[A-Za-z]+$/'], filter: \FILTER_VALIDATE_REGEXP, validationFailedStatusCode: Response::HTTP_BAD_REQUEST)] ?string $champion = null,
        #[MapQueryParameter(options: ['min_range' => 1, 'max_range' => 365], validationFailedStatusCode: Response::HTTP_BAD_REQUEST)] ?int $days = null,
    ): JsonResponse {
        return $this->json($stats->forPlayer($player->puuid(), $champion, $days));
    }

    #[Route('/api/climb', name: 'api_climb', methods: ['GET'])]
    public function climb(TrackedPlayer $player, ClimbProvider $climb): JsonResponse
    {
        return $this->json($climb->forPlayer($player->puuid()));
    }
}
