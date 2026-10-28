<?php

declare(strict_types=1);

namespace App\Stats\Dto;

/** Le grind : volume de jeu, sessions, et ce que le rythme de jeu change au winrate. */
final readonly class GrindStats
{
    /**
     * @param list<Record> $bySessionGame winrate de la 1re, 2e… game d'une session (la dernière clé regroupe la suite)
     * @param list<Record> $byWeekday     du lundi (1) au dimanche (7)
     * @param list<Record>        $calendar       un par jour joué (clé AAAA-MM-JJ), du plus ancien au plus récent
     * @param list<SessionRecord> $recentSessions la plus récente d'abord
     * @param list<Record>        $byBreak        selon la pause avant la game, dans une session : short (< 5 min), medium (5–15), long (15–45)
     * @param list<Record>        $byDuration     selon la durée de la game : lt25, 25-30, 30-35, gt35 (minutes)
     * @param list<string>        $mains          les champions les plus joués de la période, 3 au plus
     * @param list<PoolWeek>      $pool           les dernières semaines jouées, de la plus ancienne à la plus récente
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
        /** Moyenne des LP gagnés sur une victoire, puis perdus sur une défaite (négatif), LP connus seulement. */
        public ?float $lpGain = null,
        public ?float $lpLoss = null,
        /** Dernière game d'une session avant que le winrate passe sous 50 % ; null s'il ne baisse pas. */
        public ?int $stopAfter = null,
        public array $byDuration = [],
        public array $mains = [],
        public array $pool = [],
    ) {
    }
}
