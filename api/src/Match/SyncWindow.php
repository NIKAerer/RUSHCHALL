<?php

declare(strict_types=1);

namespace App\Match;

use App\Storage\MatchStore;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Point de départ d'une synchro : la dernière game en base, ou SYNC_SINCE si la base est vide.
 */
final class SyncWindow
{
    private const TIMEZONE = 'Europe/Paris';

    public function __construct(
        private readonly MatchStore $store,
        #[Autowire('%env(SYNC_SINCE)%')] private readonly string $defaultSince,
    ) {
    }

    public function startFor(string $puuid): \DateTimeImmutable
    {
        $latest = $this->store->latestGameStart($puuid);
        if (null !== $latest) {
            // Une seconde après le début de la dernière game connue.
            return (new \DateTimeImmutable('@'.(intdiv($latest, 1000) + 1)))->setTimezone(new \DateTimeZone(self::TIMEZONE));
        }

        return self::parseDate($this->defaultSince);
    }

    public static function parseDate(string $date): \DateTimeImmutable
    {
        return \DateTimeImmutable::createFromFormat('!Y-m-d', $date, new \DateTimeZone(self::TIMEZONE))
            ?: throw new \InvalidArgumentException(\sprintf('Date invalide « %s », format attendu : AAAA-MM-JJ.', $date));
    }
}
