<?php

declare(strict_types=1);

namespace App\Stats;

use App\Stats\Dto\ChampionStats;
use App\Stats\Dto\DiffStats;
use App\Stats\Dto\FormStats;
use App\Stats\Dto\Heatmap;
use App\Stats\Dto\JungleStats;
use App\Stats\Dto\LpPoint;
use App\Stats\Dto\MatchupStats;
use App\Stats\Dto\ObjectiveStats;
use App\Stats\Dto\PlayerStats;
use App\Stats\Dto\Record;

/**
 * Additionne les games du joueur suivi. Les remakes sont ignorés.
 */
final class StatsAggregator
{
    private const TIMEZONE = 'Europe/Paris';
    private const MAP_SIZE = 15000;
    private const HEATMAP_SIZE = 30;
    private const RECENT_GAMES = 20;
    private const OBJECTIVES = ['grubs', 'herald', 'dragon', 'atakhan', 'baron'];
    private const TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND'];
    private const DIVISIONS = ['IV', 'III', 'II', 'I'];

    /**
     * @param list<GameFacts>                                                                $games       de la plus ancienne à la plus récente
     * @param list<array{taken_at: int, tier: string, division: ?string, league_points: int}> $lpSnapshots
     */
    public function aggregate(array $games, array $lpSnapshots = []): PlayerStats
    {
        $games = array_values(array_filter($games, static fn (GameFacts $g) => !$g->remake));
        $count = \count($games);

        return new PlayerStats(
            games: $count,
            wins: $this->wins($games),
            kills: $this->average($games, static fn (GameFacts $g) => $g->kills),
            deaths: $this->average($games, static fn (GameFacts $g) => $g->deaths),
            assists: $this->average($games, static fn (GameFacts $g) => $g->assists),
            rating: $this->average($games, static fn (GameFacts $g) => $g->rating),
            mvp: \count(array_filter($games, static fn (GameFacts $g) => 'MVP' === $g->badge)),
            ace: \count(array_filter($games, static fn (GameFacts $g) => 'ACE' === $g->badge)),
            champions: $this->champions($games),
            matchups: $this->matchups($games),
            diffs: array_values(array_filter([$this->diffs($games, 10), $this->diffs($games, 15)])),
            jungle: $this->jungle($games),
            objectives: $this->objectives($games),
            heatmap: $this->heatmap($games),
            form: $this->form($games, $lpSnapshots),
        );
    }

    /**
     * @param list<GameFacts> $games
     *
     * @return list<ChampionStats>
     */
    private function champions(array $games): array
    {
        $stats = [];
        foreach ($this->groupBy($games, static fn (GameFacts $g) => $g->championName) as $champion => $played) {
            $stats[] = new ChampionStats(
                championName: $champion,
                games: \count($played),
                wins: $this->wins($played),
                kills: $this->average($played, static fn (GameFacts $g) => $g->kills),
                deaths: $this->average($played, static fn (GameFacts $g) => $g->deaths),
                assists: $this->average($played, static fn (GameFacts $g) => $g->assists),
                csPerMinute: round(array_sum(array_map(static fn (GameFacts $g) => $g->cs, $played)) / max(1, array_sum(array_map(static fn (GameFacts $g) => $g->durationSeconds, $played))) * 60, 1),
                goldAt15: $this->averageInt($played, static fn (GameFacts $g) => $g->goldAt15),
                rating: $this->average($played, static fn (GameFacts $g) => $g->rating),
                matchups: $this->matchups($played),
            );
        }

        return $stats;
    }

    /**
     * @param list<GameFacts> $games
     *
     * @return list<MatchupStats>
     */
    private function matchups(array $games): array
    {
        $stats = [];
        foreach ($this->groupBy($games, static fn (GameFacts $g) => $g->opponent) as $opponent => $played) {
            $stats[] = new MatchupStats(
                opponent: $opponent,
                games: \count($played),
                wins: $this->wins($played),
                goldDiffAt15: $this->averageInt($played, static fn (GameFacts $g) => $g->at15?->gold),
            );
        }

        return $stats;
    }

    /**
     * @param list<GameFacts> $games
     */
    private function diffs(array $games, int $minute): ?DiffStats
    {
        $diffs = array_values(array_filter(array_map(static fn (GameFacts $g) => 10 === $minute ? $g->at10 : $g->at15, $games)));
        if ([] === $diffs) {
            return null;
        }
        $mean = static fn (callable $value) => array_sum(array_map($value, $diffs)) / \count($diffs);

        return new DiffStats(
            minute: $minute,
            games: \count($diffs),
            gold: (int) round($mean(static fn (LaneDiff $d) => $d->gold)),
            xp: (int) round($mean(static fn (LaneDiff $d) => $d->xp)),
            cs: round($mean(static fn (LaneDiff $d) => $d->cs), 1),
            aheadRate: round(\count(array_filter($diffs, static fn (LaneDiff $d) => $d->gold > 0)) / \count($diffs), 3),
        );
    }

    /**
     * @param list<GameFacts> $games
     */
    private function jungle(array $games): JungleStats
    {
        $jungle = array_values(array_filter($games, static fn (GameFacts $g) => [] !== $g->clear));
        $ganked = array_values(array_filter($jungle, static fn (GameFacts $g) => null !== $g->firstGankLane));

        return new JungleStats(
            games: \count($jungle),
            starts: $this->records($jungle, static fn (GameFacts $g) => $g->clear[0]),
            routes: $this->records($jungle, static fn (GameFacts $g) => implode('>', $g->clear)),
            firstGanks: $this->records($ganked, static fn (GameFacts $g) => $g->firstGankLane),
            firstGankAt: $this->averageInt($ganked, static fn (GameFacts $g) => $g->firstGankAt),
        );
    }

    /**
     * @param list<GameFacts> $games
     *
     * @return list<ObjectiveStats>
     */
    private function objectives(array $games): array
    {
        $fights = array_merge(...array_map(static fn (GameFacts $g) => $g->objectives, $games));
        $stats = [];
        foreach (self::OBJECTIVES as $type) {
            $ofType = array_filter($fights, static fn (ObjectiveFight $f) => $f->type === $type);
            $taken = array_values(array_filter($ofType, static fn (ObjectiveFight $f) => $f->taken));
            $lost = array_values(array_filter($ofType, static fn (ObjectiveFight $f) => !$f->taken));
            $goldDiff = static fn (ObjectiveFight $f) => $f->goldDiff;
            $stats[] = new ObjectiveStats($type, \count($taken), \count($lost), $this->averageInt($taken, $goldDiff), $this->averageInt($lost, $goldDiff));
        }

        return $stats;
    }

    /**
     * @param list<GameFacts> $games
     */
    private function heatmap(array $games): Heatmap
    {
        $cell = static fn (int $coordinate) => min(self::HEATMAP_SIZE - 1, max(0, intdiv($coordinate * self::HEATMAP_SIZE, self::MAP_SIZE)));
        $counts = [];
        foreach ($games as $game) {
            foreach ($game->positions as [$x, $y]) {
                $key = $cell($x).':'.$cell($y);
                $counts[$key] = ($counts[$key] ?? 0) + 1;
            }
        }

        $cells = [];
        foreach ($counts as $key => $total) {
            [$column, $row] = array_map(intval(...), explode(':', $key));
            $cells[] = [$column, $row, $total];
        }

        return new Heatmap(self::HEATMAP_SIZE, $cells, array_merge(...array_map(static fn (GameFacts $g) => $g->deathSpots, $games)));
    }

    /**
     * @param list<GameFacts>                                                                $games
     * @param list<array{taken_at: int, tier: string, division: ?string, league_points: int}> $lpSnapshots
     */
    private function form(array $games, array $lpSnapshots): FormStats
    {
        $streak = $longestWin = $longestLoss = 0;
        foreach ($games as $game) {
            $streak = $game->win ? max(0, $streak) + 1 : min(0, $streak) - 1;
            $longestWin = max($longestWin, $streak);
            $longestLoss = max($longestLoss, -$streak);
        }

        $timezone = new \DateTimeZone(self::TIMEZONE);
        $hourOf = static fn (GameFacts $g) => (int) (new \DateTimeImmutable('@'.intdiv($g->startedAt, 1000)))->setTimezone($timezone)->format('G');
        $byHour = $this->groupBy($games, $hourOf);

        return new FormStats(
            streak: $streak,
            longestWinStreak: $longestWin,
            longestLossStreak: $longestLoss,
            recent: array_map(static fn (GameFacts $g) => $g->win, \array_slice($games, -self::RECENT_GAMES)),
            byHour: array_map(fn (int $hour) => new Record((string) $hour, \count($byHour[$hour] ?? []), $this->wins($byHour[$hour] ?? [])), range(0, 23)),
            lp: array_map(fn (array $s) => new LpPoint($s['taken_at'] * 1000, $s['tier'], $s['division'], $s['league_points'], $this->ladder($s['tier'], $s['division'], $s['league_points'])), $lpSnapshots),
        );
    }

    private function ladder(string $tier, ?string $division, int $leaguePoints): int
    {
        $tierIndex = array_search($tier, self::TIERS, true);
        if (false === $tierIndex) {
            // Master et au-dessus : une seule échelle de LP, au-dessus de Diamant I.
            return \count(self::TIERS) * 400 + $leaguePoints;
        }

        return $tierIndex * 400 + (int) array_search($division, self::DIVISIONS, true) * 100 + $leaguePoints;
    }

    /**
     * @param list<GameFacts>             $games
     * @param callable(GameFacts): string $key
     *
     * @return list<Record> le plus joué d'abord
     */
    private function records(array $games, callable $key): array
    {
        $records = [];
        foreach ($this->groupBy($games, $key) as $value => $played) {
            $records[] = new Record((string) $value, \count($played), $this->wins($played));
        }

        return $records;
    }

    /**
     * Regroupe les games par clé, le groupe le plus fourni d'abord. Les games sans clé sont ignorées.
     *
     * @param list<GameFacts>                     $games
     * @param callable(GameFacts): (string|int|null) $key
     *
     * @return array<string|int, list<GameFacts>>
     */
    private function groupBy(array $games, callable $key): array
    {
        $groups = [];
        foreach ($games as $game) {
            $value = $key($game);
            if (null !== $value) {
                $groups[$value][] = $game;
            }
        }
        uasort($groups, static fn (array $a, array $b) => \count($b) <=> \count($a));

        return $groups;
    }

    /**
     * @param list<GameFacts> $games
     */
    private function wins(array $games): int
    {
        return \count(array_filter($games, static fn (GameFacts $g) => $g->win));
    }

    /**
     * @param list<object>                 $items
     * @param callable(object): (int|float) $value
     */
    private function average(array $items, callable $value): float
    {
        return [] === $items ? 0.0 : round(array_sum(array_map($value, $items)) / \count($items), 1);
    }

    /**
     * Moyenne arrondie des valeurs connues, null s'il n'y en a aucune.
     *
     * @param list<object>                $items
     * @param callable(object): (int|null) $value
     */
    private function averageInt(array $items, callable $value): ?int
    {
        $values = array_filter(array_map($value, $items), static fn (?int $v) => null !== $v);

        return [] === $values ? null : (int) round(array_sum($values) / \count($values));
    }
}
