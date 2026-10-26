<?php

declare(strict_types=1);

namespace App\Riot;

/**
 * Serveur de jeu Riot. Chaque serveur dépend d'une région de routage
 * (account-v1 et match-v5 sont servis par la région, summoner-v4 et league-v4 par le serveur).
 */
enum Platform: string
{
    case EUW = 'euw1';
    case EUNE = 'eun1';
    case TR = 'tr1';
    case RU = 'ru';
    case ME = 'me1';
    case NA = 'na1';
    case BR = 'br1';
    case LAN = 'la1';
    case LAS = 'la2';
    case KR = 'kr';
    case JP = 'jp1';
    case OCE = 'oc1';
    case SG = 'sg2';
    case TW = 'tw2';
    case VN = 'vn2';

    public function region(): string
    {
        return match ($this) {
            self::EUW, self::EUNE, self::TR, self::RU, self::ME => 'europe',
            self::NA, self::BR, self::LAN, self::LAS => 'americas',
            self::KR, self::JP => 'asia',
            self::OCE, self::SG, self::TW, self::VN => 'sea',
        };
    }

    public function platformBaseUri(): string
    {
        return \sprintf('https://%s.api.riotgames.com', $this->value);
    }

    public function regionBaseUri(): string
    {
        return \sprintf('https://%s.api.riotgames.com', $this->region());
    }
}
