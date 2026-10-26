<?php

declare(strict_types=1);

namespace App\Controller;

use App\Profile\ProfileProvider;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class ProfileController extends AbstractController
{
    #[Route('/api/profiles/{gameName}/{tagLine}', name: 'api_profile', methods: ['GET'])]
    public function show(string $gameName, string $tagLine, ProfileProvider $profiles): JsonResponse
    {
        return $this->json($profiles->get($gameName, $tagLine));
    }
}
