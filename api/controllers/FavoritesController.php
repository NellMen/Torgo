<?php

declare(strict_types=1);

final class FavoritesController
{
    public static function index(): void
    {
        $user = Auth::requireUser();
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare(
            'SELECT l.id, l.title, l.price, l.city, l.type, l.created_at,
                    (SELECT path FROM listing_images li WHERE li.listing_id = l.id ORDER BY li.sort_order LIMIT 1) AS thumb,
                    (SELECT a.current_price FROM auctions a WHERE a.listing_id = l.id) AS current_price,
                    (SELECT a.ends_at FROM auctions a WHERE a.listing_id = l.id) AS ends_at
             FROM favorites f
             JOIN listings l ON l.id = f.listing_id
             WHERE f.user_id = ? AND l.status = ?
             ORDER BY f.created_at DESC'
        );
        $stmt->execute([(int) $user['id'], 'active']);
        Response::success(['items' => $stmt->fetchAll()]);
    }

    public static function add(int $listingId): void
    {
        $user = Auth::requireUser();
        $pdo = Database::getInstance();
        $check = $pdo->prepare('SELECT id FROM listings WHERE id = ? AND status = ?');
        $check->execute([$listingId, 'active']);
        if (!$check->fetch()) {
            Response::error('not_found', 'Объявление не найдено', 404);
            return;
        }
        $pdo->prepare('INSERT IGNORE INTO favorites (user_id, listing_id, created_at) VALUES (?, ?, NOW())')
            ->execute([(int) $user['id'], $listingId]);
        Response::success(null, 'Добавлено в избранное', 201);
    }

    public static function remove(int $listingId): void
    {
        $user = Auth::requireUser();
        $pdo = Database::getInstance();
        $pdo->prepare('DELETE FROM favorites WHERE user_id = ? AND listing_id = ?')
            ->execute([(int) $user['id'], $listingId]);
        Response::success(null, 'Удалено из избранного');
    }

    public static function flag(array &$listing, ?int $userId): void
    {
        $listing['is_favorite'] = false;
        if (!$userId) {
            return;
        }
        $stmt = Database::getInstance()->prepare('SELECT 1 FROM favorites WHERE user_id = ? AND listing_id = ?');
        $stmt->execute([$userId, (int) $listing['id']]);
        $listing['is_favorite'] = (bool) $stmt->fetchColumn();
    }
}
