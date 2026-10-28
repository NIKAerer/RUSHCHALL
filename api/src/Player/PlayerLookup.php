<?php

declare(strict_types=1);

namespace App\Player;

use App\Match\Dto\MatchDetail;
use App\Match\Dto\MatchSummary;
use App\Match\MatchMapper;
use App\Profile\Dto\Profile;
use App\Profile\ProfileProvider;
use App\Riot\Platform;
use App\Riot\RiotApiClient;
use App\Storage\MatchStore;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Profil et games Solo/Duo d'un joueur cherché, lus en direct chez Riot.
 * Rien n'est enregistré : ni en base, ni dans le cache disque, ni dans les relevés de LP.
 */
final class PlayerLookup
{
    /** Une game coûte une requête : 10 par page reste loin des 100 requêtes par 2 min de la clé. */
    public const MAX_PAGE = 10;

    private readonly ProfileProvider $profiles;

    public function __construct(
        #[Autowire(service: 'riot.live_client')] private readonly RiotApiClient $riot,
        Platform $riotPlatform,
        private readonly MatchStore $store,
        private readonly MatchMapper $mapper,
    ) {
        $this->profiles = new ProfileProvider($riot, $riotPlatform);
    }

    public function profile(string $gameName, string $tagLine): Profile
    {
        return $this->profiles->get($gameName, $tagLine);
    }

    /**
     * @return list<MatchSummary>
     */
    public function games(string $gameName, string $tagLine, int $start, int $count): array
    {
        $puuid = $this->riot->getAccountByRiotId($gameName, $tagLine)['puuid'];
        $ids = $this->riot->getMatchIds($puuid, $start, min($count, self::MAX_PAGE), MatchStore::QUEUE_RANKED_SOLO);

        return array_map(fn (string $id) => $this->mapper->toSummary($this->match($id), $puuid), $ids);
    }

    public function detail(string $matchId): MatchDetail
    {
        return $this->mapper->toDetail($this->match($matchId));
    }

    /**
     * Une game déjà en base (jouée avec le joueur suivi) ne coûte aucune requête ; la base n'est jamais modifiée.
     *
     * @return array{metadata: array<string, mixed>, info: array<string, mixed>}
     */
    private function match(string $matchId): array
    {
        return $this->store->find($matchId) ?? $this->riot->getMatch($matchId);
    }
}
