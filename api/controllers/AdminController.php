<?php

declare(strict_types=1);

final class AdminController
{
    public static function dashboard(): void
    {
        $pdo = Database::getInstance();
        $stats = [
            'users' => (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn(),
            'listings_active' => (int) $pdo->query("SELECT COUNT(*) FROM listings WHERE status = 'active'")->fetchColumn(),
            'listings_pending' => (int) $pdo->query("SELECT COUNT(*) FROM listings WHERE status = 'pending'")->fetchColumn(),
            'auctions_active' => (int) $pdo->query(
                "SELECT COUNT(*) FROM listings l JOIN auctions a ON a.listing_id = l.id
                 WHERE l.type = 'auction' AND l.status = 'active' AND a.finalized_at IS NULL AND a.ends_at > NOW()"
            )->fetchColumn(),
            'auctions_pending' => (int) $pdo->query(
                "SELECT COUNT(*) FROM listings WHERE type = 'auction' AND status = 'pending'"
            )->fetchColumn(),
            'messages_today' => (int) $pdo->query(
                'SELECT COUNT(*) FROM messages WHERE DATE(created_at) = CURDATE()'
            )->fetchColumn(),
        ];
        Response::success(['stats' => $stats]);
    }
}
