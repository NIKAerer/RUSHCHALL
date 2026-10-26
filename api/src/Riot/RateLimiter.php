<?php

declare(strict_types=1);

namespace App\Riot;

/**
 * Fait patienter avant chaque appel réel à Riot pour rester sous les limites de la clé.
 * Clé de développement : 20 requêtes par seconde et 100 toutes les 2 minutes.
 *
 * Les fenêtres sont comptées dans le processus courant : c'est fait pour les synchronisations
 * en ligne de commande, qui enchaînent des centaines d'appels.
 */
class RateLimiter
{
    /** @var array<int, int> requêtes autorisées par fenêtre (en secondes) */
    private readonly array $limits;

    /** @var list<float> */
    private array $sentAt = [];

    /**
     * @param string $limits par exemple "20:1,100:120" (requêtes:secondes)
     */
    public function __construct(string $limits = '20:1,100:120')
    {
        $parsed = [];
        foreach (array_filter(array_map('trim', explode(',', $limits))) as $limit) {
            [$requests, $seconds] = array_map('intval', explode(':', $limit)) + [1 => 0];
            if ($requests > 0 && $seconds > 0) {
                $parsed[$seconds] = $requests;
            }
        }
        $this->limits = $parsed;
    }

    public function wait(): void
    {
        $longestWindow = [] === $this->limits ? 0 : max(array_keys($this->limits));
        foreach ($this->limits as $seconds => $requests) {
            $now = $this->now();
            $this->sentAt = array_values(array_filter($this->sentAt, static fn (float $t) => $t > $now - $longestWindow));
            $inWindow = array_values(array_filter($this->sentAt, static fn (float $t) => $t > $now - $seconds));

            if (\count($inWindow) >= $requests) {
                // La plus ancienne requête de la fenêtre doit en sortir avant d'en envoyer une nouvelle.
                $this->sleep($inWindow[\count($inWindow) - $requests] + $seconds - $now);
            }
        }

        $this->sentAt[] = $this->now();
    }

    protected function now(): float
    {
        return microtime(true);
    }

    protected function sleep(float $seconds): void
    {
        if ($seconds > 0) {
            usleep((int) ceil($seconds * 1_000_000));
        }
    }
}
