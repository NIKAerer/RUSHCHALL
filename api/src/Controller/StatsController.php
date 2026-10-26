<?php

declare(strict_types=1);

namespace App\Controller;

use App\Player\TrackedPlayer;
use App\Stats\StatsProvider;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class StatsController extends AbstractController
{
    #[Route('/api/stats', name: 'api_stats', methods: ['GET'])]
    public function show(TrackedPlayer $player, StatsProvider $stats): JsonResponse
    {
        return $this->json($stats->forPlayer($player->puuid()));
    }
}
