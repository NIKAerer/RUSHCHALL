<?php

declare(strict_types=1);

namespace App\Tests\Riot;

use App\Riot\RateLimiter;
use PHPUnit\Framework\TestCase;

final class RateLimiterTest extends TestCase
{
    public function testRequestsUnderTheLimitAreNotDelayed(): void
    {
        $limiter = new FakeClockRateLimiter('3:1');

        $limiter->wait();
        $limiter->wait();
        $limiter->wait();

        self::assertSame(0.0, $limiter->slept);
    }

    public function testTheLongestWindowIsRespected(): void
    {
        // 100 requêtes toutes les 2 minutes : la 101e attend que la 1re sorte de la fenêtre.
        $limiter = new FakeClockRateLimiter('20:1,100:120');

        for ($i = 0; $i < 101; ++$i) {
            $limiter->wait();
        }

        self::assertEqualsWithDelta(120.0, $limiter->clock, 0.001);
        self::assertGreaterThanOrEqual(120.0 - 5.0, $limiter->slept);
    }
}

final class FakeClockRateLimiter extends RateLimiter
{
    public float $clock = 0.0;
    public float $slept = 0.0;

    protected function now(): float
    {
        return $this->clock;
    }

    protected function sleep(float $seconds): void
    {
        if ($seconds > 0) {
            $this->clock += $seconds;
            $this->slept += $seconds;
        }
    }
}
