<?php

declare(strict_types=1);

namespace App\Controller;

use App\Player\TrackedPlayer;
use App\Profile\ProfileProvider;
use App\Storage\MatchStore;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class ProfileController extends AbstractController
{
    #[Route('/api/profile', name: 'api_profile', methods: ['GET'])]
    public function show(TrackedPlayer $player, ProfileProvider $profiles, MatchStore $store): JsonResponse
    {
        $account = $player->account();
        $profile = $profiles->get($account['gameName'], $account['tagLine']);

        // Chaque affichage du profil sert de relevé pour la courbe de LP.
        foreach ($profile->ranked as $entry) {
            if ('solo' === $entry->queue) {
                $store->recordLp($profile->puuid, $entry->tier, $entry->division, $entry->leaguePoints, $entry->wins, $entry->losses, time());
            }
        }

        return $this->json($profile);
    }
}
