<?php

declare(strict_types=1);

/**
 * Run once on OpenServer after importing database/torgo.sql:
 * php api/scripts/set_passwords.php
 */

require dirname(__DIR__) . '/bootstrap.php';

$pdo = Database::getInstance();

$users = [
    'admin@torgo.ru' => 'admin',
    'seller@test.ru' => 'password123',
    'buyer@test.ru' => 'password123',
];

foreach ($users as $email => $plain) {
    $hash = password_hash($plain, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('UPDATE users SET password_hash = ? WHERE email = ?');
    $stmt->execute([$hash, $email]);
    echo "Updated: $email\n";
}

echo "Done.\n";
