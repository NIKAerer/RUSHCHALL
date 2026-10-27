<?php

declare(strict_types=1);

namespace App\Rank;

use App\Profile\Dto\Profile;
use App\Storage\MatchStore;

/**
 * Enregistre le rang Solo/Duo du profil : chaque relevé sert à la courbe de LP et aux LP par game.
 */
final class LpRecorder
{
    public function __construct(private readonly MatchStore $store)
    {
    }

    public function record(Profile $profile): void
    {
        foreach ($profile->ranked as $entry) {
            if ('solo' === $entry->queue) {
                $this->store->recordLp($profile->puuid, $entry->tier, $entry->division, $entry->leaguePoints, $entry->wins, $entry->losses, time());
            }
        }
    }
}
