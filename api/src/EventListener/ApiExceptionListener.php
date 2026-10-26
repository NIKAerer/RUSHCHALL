<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Riot\Exception\InvalidApiKeyException;
use App\Riot\Exception\NotFoundException;
use App\Riot\Exception\RateLimitedException;
use App\Riot\Exception\RiotApiException;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

/**
 * Renvoie les erreurs de l'API sous la forme {"error": code, "message": texte lisible}.
 */
#[AsEventListener]
final class ApiExceptionListener
{
    public function __invoke(ExceptionEvent $event): void
    {
        if (!str_starts_with($event->getRequest()->getPathInfo(), '/api/')) {
            return;
        }

        $e = $event->getThrowable();
        [$status, $code, $message] = match (true) {
            $e instanceof NotFoundException => [Response::HTTP_NOT_FOUND, 'not_found', 'Joueur ou game introuvable sur ce serveur.'],
            $e instanceof InvalidApiKeyException => [Response::HTTP_BAD_GATEWAY, 'invalid_api_key', 'Clé API Riot absente, invalide ou expirée. Mets à jour RIOT_API_KEY dans api/.env.local.'],
            $e instanceof RateLimitedException => [Response::HTTP_TOO_MANY_REQUESTS, 'rate_limited', \sprintf('Limite de requêtes Riot atteinte, réessaie dans %d s.', $e->retryAfter ?? 10)],
            $e instanceof RiotApiException => [Response::HTTP_BAD_GATEWAY, 'riot_unavailable', "L'API Riot ne répond pas, réessaie dans un instant."],
            $e instanceof HttpExceptionInterface && Response::HTTP_NOT_FOUND === $e->getStatusCode() => [Response::HTTP_NOT_FOUND, 'not_found', 'Ressource inconnue.'],
            $e instanceof HttpExceptionInterface => [$e->getStatusCode(), 'bad_request', 'Requête invalide.'],
            default => [null, null, null],
        };

        if (null === $status) {
            return;
        }

        $event->setResponse(new JsonResponse(['error' => $code, 'message' => $message], $status));
    }
}
