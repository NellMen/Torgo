<?php

declare(strict_types=1);

final class AdminAuth
{
    public static function handle(callable $next): void
    {
        Auth::requireAdmin();
        $next();
    }
}
