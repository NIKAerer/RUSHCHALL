<?php

declare(strict_types=1);

namespace App\Pathing;

use App\Pathing\Dto\ClearStep;
use App\Pathing\Dto\EarlyGame;
use App\Pathing\Dto\FirstBack;
use App\Pathing\Dto\Moment;

/**
 * Début de game d'un jungler : ordre des camps du premier clear, paliers de niveau,
 * premier back, premier gank et première invade.
 */
final class EarlyGameAnalyzer
{
    /** Sans back ni action avant, on considère que le premier clear est fini. */
    private const MAX_CLEAR_SECONDS = 7 * 60;
    /** Les achats avant ce délai sont les items de départ. */
    private const START_ITEMS_SECONDS = 90;
    /** Achats regroupés dans le même passage en base. */
    private const SHOPPING_SECONDS = 45;
    private const INVADE_WINDOW_SECONDS = 14 * 60;
    private const LEVELS = [3, 4, 6];
    private const CLEAR_ENDING_MOMENTS = ['gank', 'kill', 'assist', 'death'];

    /**
     * @param list<array<string, mixed>> $frames
     * @param list<array<string, mixed>> $events
     * @param list<Moment>               $moments moments du jungler, triés
     */
    public function analyze(int $participantId, int $teamId, array $frames, array $events, array $moments): EarlyGame
    {
        $mine = array_values(array_filter(
            $events,
            static fn (array $e) => ($e['participantId'] ?? null) === $participantId,
        ));

        $firstBack = $this->firstBack($mine, $frames, $participantId);
        $firstAction = array_values(array_filter($moments, static fn (Moment $m) => \in_array($m->type, self::CLEAR_ENDING_MOMENTS, true)))[0] ?? null;

        [$clearEnd, $reason] = match (true) {
            null !== $firstBack && (null === $firstAction || $firstBack->t <= $firstAction->t) => [$firstBack->t, 'back'],
            null !== $firstAction => [$firstAction->t, $firstAction->type],
            default => [null, null],
        };
        if (null !== $clearEnd && $clearEnd > self::MAX_CLEAR_SECONDS) {
            [$clearEnd, $reason] = [null, null];
        }

        $clear = $this->clear($participantId, $teamId, $frames, $clearEnd ?? self::MAX_CLEAR_SECONDS);
        $firstGank = array_values(array_filter($moments, static fn (Moment $m) => 'gank' === $m->type))[0] ?? null;

        return new EarlyGame(
            clear: $clear,
            clearEnd: $clearEnd,
            clearEndReason: $reason,
            jungleCsAtClearEnd: [] === $clear ? 0 : $clear[array_key_last($clear)]->jungleCs,
            levels: $this->levels($mine, $frames, $participantId),
            firstBack: $firstBack,
            firstGank: $firstGank,
            firstInvade: $this->firstInvade($participantId, $teamId, $frames, $moments),
        );
    }

    /**
     * @param list<array<string, mixed>> $frames
     *
     * @return list<ClearStep>
     */
    private function clear(int $participantId, int $teamId, array $frames, int $until): array
    {
        $steps = [];
        foreach ($frames as $frame) {
            $t = intdiv($frame['timestamp'], 1000);
            $state = $frame['participantFrames'][(string) $participantId] ?? null;
            if (0 === $t || $t > $until || !isset($state['position'])) {
                continue;
            }

            ['x' => $x, 'y' => $y] = $state['position'];
            $near = JungleCamp::near($x, $y);
            [$camp, $owner] = $near ?? [null, null];

            $steps[] = new ClearStep(
                t: $t,
                camp: $camp?->value,
                label: $camp?->label() ?? ucfirst(MapZone::of($x, $y, $teamId)->label()),
                side: match (true) {
                    null === $near => null,
                    null === $owner => 'river',
                    $owner === $teamId => 'ally',
                    default => 'enemy',
                },
                jungleCs: $state['jungleMinionsKilled'] ?? 0,
                x: $x,
                y: $y,
            );
        }

        return $steps;
    }

    /**
     * @param list<array<string, mixed>> $events événements du jungler
     * @param list<array<string, mixed>> $frames
     *
     * @return array<int, ?int>
     */
    private function levels(array $events, array $frames, int $participantId): array
    {
        $levels = array_fill_keys(self::LEVELS, null);

        foreach ($events as $event) {
            if ('LEVEL_UP' === $event['type'] && \array_key_exists($event['level'], $levels) && null === $levels[$event['level']]) {
                $levels[$event['level']] = intdiv($event['timestamp'], 1000);
            }
        }

        // Sans événement LEVEL_UP, le premier relevé de minute au bon niveau donne une borne haute.
        foreach ($levels as $level => $t) {
            if (null !== $t) {
                continue;
            }
            foreach ($frames as $frame) {
                if (($frame['participantFrames'][(string) $participantId]['level'] ?? 0) >= $level) {
                    $levels[$level] = intdiv($frame['timestamp'], 1000);
                    break;
                }
            }
        }

        return $levels;
    }

    /**
     * @param list<array<string, mixed>> $events événements du jungler
     * @param list<array<string, mixed>> $frames
     */
    private function firstBack(array $events, array $frames, int $participantId): ?FirstBack
    {
        $purchases = array_values(array_filter(
            $events,
            static fn (array $e) => 'ITEM_PURCHASED' === $e['type'] && $e['timestamp'] >= self::START_ITEMS_SECONDS * 1000,
        ));
        if ([] === $purchases) {
            return null;
        }

        $start = $purchases[0]['timestamp'];
        $items = array_map(
            static fn (array $e) => $e['itemId'],
            array_filter($purchases, static fn (array $e) => $e['timestamp'] - $start <= self::SHOPPING_SECONDS * 1000),
        );

        $gold = null;
        foreach ($frames as $frame) {
            if ($frame['timestamp'] > $start) {
                break;
            }
            $gold = $frame['participantFrames'][(string) $participantId]['currentGold'] ?? $gold;
        }

        return new FirstBack(intdiv($start, 1000), array_values($items), $gold);
    }

    /**
     * @param list<array<string, mixed>> $frames
     * @param list<Moment>               $moments
     */
    private function firstInvade(int $participantId, int $teamId, array $frames, array $moments): ?int
    {
        $times = [];
        foreach ($frames as $frame) {
            $position = $frame['participantFrames'][(string) $participantId]['position'] ?? null;
            if (null !== $position && MapZone::EnemyJungle === MapZone::of($position['x'], $position['y'], $teamId)) {
                $times[] = intdiv($frame['timestamp'], 1000);
            }
        }
        foreach ($moments as $moment) {
            if (MapZone::EnemyJungle->value === $moment->zone) {
                $times[] = $moment->t;
            }
        }

        $times = array_filter($times, static fn (int $t) => $t < self::INVADE_WINDOW_SECONDS);

        return [] === $times ? null : min($times);
    }
}
