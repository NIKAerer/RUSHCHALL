<?php

declare(strict_types=1);

namespace App\Storage;

/**
 * Base SQLite des games classées Solo/Duo. Une game terminée ne change jamais :
 * on garde la réponse match-v5 complète pour calculer les stats plus tard sans redemander à Riot.
 */
final class MatchStore
{
    public const QUEUE_RANKED_SOLO = 420;

    private ?\PDO $pdo = null;

    public function __construct(private readonly string $databasePath)
    {
    }

    /**
     * @param array{metadata: array<string, mixed>, info: array<string, mixed>} $match
     */
    public function save(array $match): void
    {
        $info = $match['info'];
        if (self::QUEUE_RANKED_SOLO !== $info['queueId']) {
            throw new \InvalidArgumentException(\sprintf('Only ranked Solo/Duo games are stored, %s is queue %d.', $match['metadata']['matchId'], $info['queueId']));
        }

        $pdo = $this->pdo();
        $pdo->beginTransaction();
        try {
            $pdo->prepare('INSERT OR REPLACE INTO matches (match_id, queue_id, game_start, duration, game_version, payload, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
                ->execute([
                    $match['metadata']['matchId'],
                    $info['queueId'],
                    $info['gameStartTimestamp'],
                    $info['gameDuration'],
                    $info['gameVersion'],
                    json_encode($match, \JSON_THROW_ON_ERROR | \JSON_UNESCAPED_UNICODE),
                    time(),
                ]);

            $participant = $pdo->prepare('INSERT OR REPLACE INTO match_participants (match_id, puuid, team_id, team_position, champion_name, win) VALUES (?, ?, ?, ?, ?, ?)');
            foreach ($info['participants'] as $p) {
                $participant->execute([
                    $match['metadata']['matchId'],
                    $p['puuid'],
                    $p['teamId'],
                    ($p['teamPosition'] ?? '') ?: null,
                    $p['championName'],
                    (int) $p['win'],
                ]);
            }
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();

            throw $e;
        }
    }

    /**
     * @return array{metadata: array<string, mixed>, info: array<string, mixed>}|null
     */
    public function find(string $matchId): ?array
    {
        $statement = $this->pdo()->prepare('SELECT payload FROM matches WHERE match_id = ?');
        $statement->execute([$matchId]);
        $payload = $statement->fetchColumn();

        return false === $payload ? null : json_decode($payload, true, flags: \JSON_THROW_ON_ERROR);
    }

    /**
     * Les games du joueur, de la plus récente à la plus ancienne.
     *
     * @return list<array{metadata: array<string, mixed>, info: array<string, mixed>}>
     */
    public function findPageForPlayer(string $puuid, int $offset, int $limit): array
    {
        $statement = $this->pdo()->prepare('SELECT m.payload FROM matches m JOIN match_participants p ON p.match_id = m.match_id WHERE p.puuid = ? ORDER BY m.game_start DESC LIMIT ? OFFSET ?');
        $statement->bindValue(1, $puuid);
        $statement->bindValue(2, $limit, \PDO::PARAM_INT);
        $statement->bindValue(3, $offset, \PDO::PARAM_INT);
        $statement->execute();

        return array_map(
            static fn (string $payload) => json_decode($payload, true, flags: \JSON_THROW_ON_ERROR),
            $statement->fetchAll(\PDO::FETCH_COLUMN),
        );
    }

    /**
     * @param list<string> $matchIds
     *
     * @return list<string> les identifiants déjà en base
     */
    public function existing(array $matchIds): array
    {
        if ([] === $matchIds) {
            return [];
        }

        $statement = $this->pdo()->prepare(\sprintf('SELECT match_id FROM matches WHERE match_id IN (%s)', implode(',', array_fill(0, \count($matchIds), '?'))));
        $statement->execute($matchIds);

        return $statement->fetchAll(\PDO::FETCH_COLUMN);
    }

    /**
     * Début (en millisecondes) de la game la plus récente du joueur, ou null s'il n'en a aucune en base.
     */
    public function latestGameStart(string $puuid): ?int
    {
        $statement = $this->pdo()->prepare('SELECT MAX(m.game_start) FROM matches m JOIN match_participants p ON p.match_id = m.match_id WHERE p.puuid = ?');
        $statement->execute([$puuid]);
        $value = $statement->fetchColumn();

        return null === $value || false === $value ? null : (int) $value;
    }

    public function countForPlayer(string $puuid): int
    {
        $statement = $this->pdo()->prepare('SELECT COUNT(*) FROM match_participants WHERE puuid = ?');
        $statement->execute([$puuid]);

        return (int) $statement->fetchColumn();
    }

    private function pdo(): \PDO
    {
        if (null !== $this->pdo) {
            return $this->pdo;
        }

        if (':memory:' !== $this->databasePath && !is_dir(\dirname($this->databasePath))) {
            mkdir(\dirname($this->databasePath), 0777, true);
        }

        $pdo = new \PDO('sqlite:'.$this->databasePath, options: [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]);
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec(<<<'SQL'
            CREATE TABLE IF NOT EXISTS matches (
                match_id TEXT PRIMARY KEY,
                queue_id INTEGER NOT NULL,
                game_start INTEGER NOT NULL,
                duration INTEGER NOT NULL,
                game_version TEXT NOT NULL,
                payload TEXT NOT NULL,
                fetched_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS match_participants (
                match_id TEXT NOT NULL REFERENCES matches (match_id) ON DELETE CASCADE,
                puuid TEXT NOT NULL,
                team_id INTEGER NOT NULL,
                team_position TEXT,
                champion_name TEXT NOT NULL,
                win INTEGER NOT NULL,
                PRIMARY KEY (match_id, puuid)
            );
            CREATE INDEX IF NOT EXISTS match_participants_puuid ON match_participants (puuid);
            SQL);

        return $this->pdo = $pdo;
    }
}
