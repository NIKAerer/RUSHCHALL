<?php

declare(strict_types=1);

namespace App\Riot\Exception;

final class RateLimitedException extends RiotApiException
{
    public function __construct(public readonly ?int $retryAfter = null)
    {
        parent::__construct('Riot API rate limit reached.');
    }
}
