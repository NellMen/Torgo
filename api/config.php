<?php

declare(strict_types=1);

return [
    'db' => [
        'host' => 'localhost',
        'name' => 'torgo',
        'user' => 'root',
        'pass' => '',
        'charset' => 'utf8mb4',
    ],
    'session' => [
        'name' => 'TORGOSESSID',
    ],
    'upload' => [
        'dir' => __DIR__ . '/uploads',
        'max_images_per_listing' => 20,
        'max_file_size' => 5 * 1024 * 1024,
        'allowed_mimes' => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    ],
    'auction' => [
        'auto_extend_minutes' => 5,
        'auto_extend_window_minutes' => 5,
    ],
];
