<?php

declare(strict_types=1);

namespace App\Tests\Pathing;

use App\Pathing\Dto\JunglePathing;
use App\Pathing\JunglePathingAnalyzer;
use App\Pathing\MapZone;
use App\Tests\Fixtures\FakeRiotApi;
use PHPUnit\Framework\TestCase;

final class JunglePathingAnalyzerTest extends TestCase
{
    public function testTrackedPlayersJunglerComesFirst(): void
    {
        $pathing = $this->analyze('EUW1_7412001122');

        [$ally, $enemy] = $pathing->junglers;
        self::assertSame('Lillia', $ally->championName);
        self::assertTrue($ally->isTrackedPlayer);
        self::assertSame('Viego', $enemy->championName);
        self::assertFalse($enemy->isTrackedPlayer);
    }

    public function testRouteMixesMinuteFramesAndEventPositions(): void
    {
        $lee = $this->analyze('EUW1_7412345678')->junglers[0];

        // 26 relevés (minute 0 exclue) + les positions de ses 6 moments.
        self::assertCount(26 + \count($lee->moments), $lee->points);
        self::assertSame(60, $lee->points[0]->t);
        $times = array_map(static fn ($p) => $p->t, $lee->points);
        $sorted = $times;
        sort($sorted);
        self::assertSame($sorted, $times);
    }

    public function testMomentsAreQualified(): void
    {
        $lee = $this->analyze('EUW1_7412345678')->junglers[0];
        $labels = array_map(static fn ($m) => [$m->t, $m->type, $m->label], $lee->moments);

        self::assertContains([200, 'gank', 'Gank bot : Varus'], $labels);
        self::assertContains([205, 'gank', 'Gank bot : Braum'], $labels);
        self::assertContains([410, 'death', 'Mort contre XinZhao (rivière)'], $labels);
        self::assertContains([480, 'objective', 'Larve'], $labels);
        self::assertContains([600, 'objective', 'Drake Infernal'], $labels);
        self::assertContains([700, 'kill', 'Kill sur XinZhao (rivière)'], $labels);
    }

    public function testFightsNameKillerVictimAndAssists(): void
    {
        $lee = $this->analyze('EUW1_7412345678')->junglers[0];
        $gank = $lee->moments[0];
        $champions = static fn (array $fighters) => array_map(static fn ($f) => $f->championName, $fighters);

        self::assertSame([200, 'gank'], [$gank->t, $gank->type]);
        self::assertSame('Jinx', $gank->killer?->championName);
        self::assertSame(100, $gank->killer->teamId);
        self::assertSame('Varus', $gank->victim?->championName);
        self::assertSame(['LeeSin', 'Leona'], $champions($gank->assists));

        [$grubs, $drake] = array_values(array_filter($lee->moments, static fn ($m) => 'objective' === $m->type));
        self::assertSame('LeeSin', $grubs->killer?->championName);
        self::assertNull($grubs->victim);
        self::assertSame(['grubs', 'infernal'], [$grubs->objective, $drake->objective]);
    }

    public function testStatsCompareBothJunglers(): void
    {
        [$lee, $xin] = $this->analyze('EUW1_7412345678')->junglers;

        self::assertSame('haut', $lee->stats->startSide);
        self::assertSame(2, $lee->stats->ganksBefore14);
        self::assertSame(60, $lee->stats->csAt10);
        self::assertSame(5, $lee->stats->objectives);
        self::assertSame(0, $xin->stats->ganksBefore14);
        self::assertSame(0, $xin->stats->minutesInEnemyJungle);

        $viego = $this->analyze('EUW1_7412001122')->junglers[1];
        // Un seul relevé dans la jungle rouge : les raptors de Lillia à la minute 6.
        self::assertSame(1, $viego->stats->minutesInEnemyJungle);
    }

    public function testFirstClearEndsOnTheFirstGank(): void
    {
        $early = $this->analyze('EUW1_7412345678')->junglers[0]->earlyGame;

        self::assertSame(
            [[60, 'blue', 'ally'], [120, 'wolves', 'ally'], [180, 'red', 'ally']],
            array_map(static fn ($s) => [$s->t, $s->camp, $s->side], $early->clear),
        );
        self::assertSame(200, $early->clearEnd);
        self::assertSame('gank', $early->clearEndReason);
        self::assertSame(18, $early->jungleCsAtClearEnd);
        self::assertSame('Gank bot : Varus', $early->firstGank?->label);
    }

    public function testLevelsAndFirstBackComeFromEvents(): void
    {
        $early = $this->analyze('EUW1_7412345678')->junglers[0]->earlyGame;

        self::assertSame([3 => 170, 4 => 345, 6 => 560], $early->levels);
        self::assertSame(431, $early->firstBack?->t);
        // Les items de départ et l'achat de la minute 10 ne font pas partie du back.
        self::assertSame([1036, 2003], $early->firstBack->itemIds);
        self::assertSame(100, $early->firstBack->gold);
    }

    public function testClearEndsOnAFightWhenThereIsNoBack(): void
    {
        $xin = $this->analyze('EUW1_7412345678')->junglers[1]->earlyGame;

        // Il tue Lee Sin à 6:50 dans la rivière : fin du clear.
        self::assertSame([410, 'kill'], [$xin->clearEnd, $xin->clearEndReason]);
        self::assertSame(
            ['Rouge', 'Raptors', 'Loups', 'Gromp', 'Bleu', 'Carapateur'],
            array_map(static fn ($s) => $s->label, $xin->clear),
        );
        self::assertSame('river', $xin->clear[5]->side);
        self::assertNull($xin->firstBack);
        // Sans LEVEL_UP, le relevé de minute sert de borne haute.
        self::assertSame(240, $xin->levels[3]);
    }

    public function testInvadeIsSpottedDuringTheClear(): void
    {
        $viego = $this->analyze('EUW1_7412001122')->junglers[1]->earlyGame;

        self::assertSame(360, $viego->firstInvade);
        self::assertSame(['raptors', 'enemy'], [$viego->clear[5]->camp, $viego->clear[5]->side]);
        self::assertSame(370, $viego->clearEnd);
        self::assertSame('kill', $viego->clearEndReason);
    }

    public function testObjectivesOfBothTeamsAreListed(): void
    {
        $objectives = $this->analyze('EUW1_7412001122')->objectives;

        self::assertSame([['herald', 200], ['dragon', 100]], array_map(static fn ($o) => [$o->type, $o->teamId], $objectives));
    }

    public function testZones(): void
    {
        self::assertSame(MapZone::Base, MapZone::of(600, 600, 100));
        self::assertSame(MapZone::Bot, MapZone::of(11700, 1600, 100));
        self::assertSame(MapZone::Top, MapZone::of(1500, 11000, 200));
        self::assertSame(MapZone::Mid, MapZone::of(7400, 7500, 100));
        self::assertSame(MapZone::River, MapZone::of(9850, 4400, 100));
        self::assertSame(MapZone::AllyJungle, MapZone::of(3800, 7900, 100));
        self::assertSame(MapZone::EnemyJungle, MapZone::of(3800, 7900, 200));
    }

    private function analyze(string $matchId): JunglePathing
    {
        $read = static fn (string $name) => json_decode((string) file_get_contents(__DIR__.'/../Fixtures/riot/'.$name.'.json'), true, flags: \JSON_THROW_ON_ERROR);

        return (new JunglePathingAnalyzer())->analyze($read('match_'.$matchId), $read('timeline_'.$matchId), FakeRiotApi::PUUID);
    }
}
