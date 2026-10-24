<?php

declare(strict_types=1);

$config = require __DIR__ . '/config.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name($config['session']['name']);
    session_start([
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax',
        'use_strict_mode' => true,
    ]);
}

require_once __DIR__ . '/lib/Database.php';
require_once __DIR__ . '/lib/Response.php';
require_once __DIR__ . '/lib/Auth.php';
require_once __DIR__ . '/lib/Validator.php';
require_once __DIR__ . '/lib/CategoryService.php';
require_once __DIR__ . '/lib/UploadService.php';
require_once __DIR__ . '/lib/ListingService.php';
require_once __DIR__ . '/lib/AuctionService.php';
