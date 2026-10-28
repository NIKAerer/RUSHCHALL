<?php

declare(strict_types=1);

namespace App\Controller;

use App\Player\PlayerLookup;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapQueryParameter;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Recherche d'un autre joueur : tout est lu en direct chez Riot, rien n'est enregistré.
 */
final class PlayerController extends AbstractController
{
    public function __construct(private readonly PlayerLookup $lookup)
    {
    }

    #[Route('/api/players/{gameName}/{tagLine}', name: 'api_player', methods: ['GET'])]
    public function show(string $gameName, string $tagLine): JsonResponse
    {
        return $this->json($this->lookup->profile($gameName, $tagLine));
    }

    #[Route('/api/players/{gameName}/{tagLine}/games', name: 'api_player_games', methods: ['GET'])]
    public function games(
        string $gameName,
        string $tagLine,
        #[MapQueryParameter(options: ['min_range' => 0], validationFailedStatusCode: Response::HTTP_BAD_REQUEST)] int $start = 0,
        #[MapQueryParameter(options: ['min_range' => 1, 'max_range' => PlayerLookup::MAX_PAGE], validationFailedStatusCode: Response::HTTP_BAD_REQUEST)] int $count = PlayerLookup::MAX_PAGE,
    ): JsonResponse {
        return $this->json($this->lookup->games($gameName, $tagLine, $start, $count));
    }

    #[Route('/api/matches/{matchId}', name: 'api_match', requirements: ['matchId' => '[A-Z0-9]+_\d+'], methods: ['GET'])]
    public function match(string $matchId): JsonResponse
    {
        return $this->json($this->lookup->detail($matchId));
    }
}
