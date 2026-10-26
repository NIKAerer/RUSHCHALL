<?php

declare(strict_types=1);

namespace App\Controller;

use App\Player\TrackedPlayer;
use App\Profile\ProfileProvider;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class ProfileController extends AbstractController
{
    #[Route('/api/profile', name: 'api_profile', methods: ['GET'])]
    public function show(TrackedPlayer $player, ProfileProvider $profiles): JsonResponse
    {
        $account = $player->account();

        return $this->json($profiles->get($account['gameName'], $account['tagLine']));
    }
}
