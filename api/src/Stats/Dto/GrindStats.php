<?php

declare(strict_types=1);

namespace App\Stats\Dto;

/** Le grind : volume de jeu, sessions, et ce que le rythme de jeu change au winrate. */
final readonly class GrindStats
{
    /**
     * @param list<Record> $bySessionGame winrate de la 1re, 2e… game d'une session (la dernière clé regroupe la suite)
     * @param list<Record> $byWeekday     du lundi (1) au dimanche (7)
     * @param array{kills: int, deaths: int, assists: int, cs: int, gold: int, pentaKills: int, firstBloods: int} $totals
     * @param list<Record>        $calendar       un par jour joué (clé AAAA-MM-JJ), du plus ancien au plus récent
     * @param list<SessionRecord> $recentSessions la plus récente d'abord
     * @param list<Record>        $byBreak        selon la pause avant la game, dans une session : short (< 5 min), medium (5–15), long (15–45)
     */
    public function __construct(
        public float $hours,
        public int $activeDays,
        public int $sessions,
        public ?SessionRecord $longestSession,
        /** Jour avec le plus de games. */
        public ?Record $busiestDay,
        public array $bySessionGame,
        /** Game suivante dans la même session, après une victoire puis après une défaite. */
        public Record $afterWin,
        public Record $afterLoss,
        public Record $afterTwoLosses,
        public array $byWeekday,
        /** Games lancées entre minuit et 6 h. */
        public Record $night,
        public array $totals,
        public ?GameRecord $longestGame,
        public ?GameRecord $shortestGame,
        /** Durée moyenne d'une victoire puis d'une défaite, en secondes. */
        public ?int $winDuration,
        public ?int $lossDuration,
        public array $calendar = [],
        public array $recentSessions = [],
        public array $byBreak = [],
        /** Games où la routine a été cochée, puis les autres. */
        public Record $routine = new Record('routine', 0, 0),
        public Record $noRoutine = new Record('noRoutine', 0, 0),
        /** LP nets des games jouées après 2 défaites d'affilée (LP connus seulement) : ce qu'aurait changé un stop-loss. */
        public ?int $afterTwoLossesLp = null,
    ) {
    }
}
