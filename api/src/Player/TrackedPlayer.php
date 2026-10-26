<?php

declare(strict_types=1);

namespace App\Player;

use App\Riot\RiotApiClient;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Le seul joueur suivi par l'application (TRACKED_RIOT_ID). Aucune donnée d'un autre joueur n'est demandée à Riot.
 */
final class TrackedPlayer
{
    public function __construct(
        private readonly RiotApiClient $riot,
        #[Autowire('%env(TRACKED_RIOT_ID)%')] private readonly string $riotId,
    ) {
    }

    /**
     * @return array{puuid: string, gameName: string, tagLine: string}
     */
    public function account(): array
    {
        [$gameName, $tagLine] = explode('#', $this->riotId, 2) + [1 => ''];

        return $this->riot->getAccountByRiotId(trim($gameName), trim($tagLine));
    }

    public function puuid(): string
    {
        return $this->account()['puuid'];
    }
}
