<?php

declare(strict_types=1);

final class UsersController
{
    public static function show(int $id): void
    {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare(
            'SELECT id, name, city, rating_avg, created_at FROM users WHERE id = ? AND is_blocked = 0'
        );
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        if (!$user) {
            Response::error('not_found', 'Пользователь не найден', 404);
            return;
        }
        Response::success(['user' => $user]);
    }

    public static function profile(string $tab): void
    {
        $user = Auth::requireUser();
        $uid = (int) $user['id'];
        $pdo = Database::getInstance();

        $items = match ($tab) {
            'active' => self::listingsByStatus($pdo, $uid, ['active'], 'fixed'),
            'review' => self::reviewQueue($pdo, $uid),
            'sold' => self::listingsByStatus($pdo, $uid, ['sold']),
            'purchased' => self::purchased($pdo, $uid),
            'auctions' => self::auctions($pdo, $uid),
            'reviews' => self::reviews($pdo, $uid),
            default => null,
        };

        if ($items === null) {
            Response::error('validation', 'Неизвестная вкладка профиля');
            return;
        }

        Response::success([
            'tab' => $tab,
            'items' => $items,
            'counts' => self::counts($pdo, $uid),
        ]);
    }

    public static function publicProfile(int $id): void
    {
        $section = (string) ($_GET['section'] ?? 'active');
        if (!in_array($section, ['active', 'auctions', 'sold', 'reviews'], true)) {
            $section = 'active';
        }
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare(
            'SELECT id, name, city, avatar, role, rating_avg, created_at FROM users WHERE id = ? AND is_blocked = 0'
        );
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        if (!$user) {
            Response::error('not_found', 'Пользователь не найден', 404);
            return;
        }

        $counts = self::counts($pdo, $id);
        $items = match ($section) {
            'auctions' => self::listingsByStatus($pdo, $id, ['active'], 'auction'),
            'sold' => self::listingsByStatus($pdo, $id, ['sold']),
            'reviews' => self::reviews($pdo, $id),
            default => self::listingsByStatus($pdo, $id, ['active'], 'fixed'),
        };
        $contact = $pdo->prepare("SELECT id FROM listings WHERE user_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1");
        $contact->execute([$id]);
        Response::success([
            'user' => $user,
            'section' => $section,
            'counts' => $counts,
            'items' => $items,
            'contact_listing_id' => (int) ($contact->fetchColumn() ?: 0),
        ]);
    }

    private static function listingsByStatus(PDO $pdo, int $userId, array $statuses, ?string $type = null): array
    {
        $ph = implode(',', array_fill(0, count($statuses), '?'));
        $bind = array_merge([$userId], $statuses);
        $typeSql = '';
        if ($type !== null) {
            $typeSql = ' AND type = ?';
            $bind[] = $type;
        }
        $stmt = $pdo->prepare(
            "SELECT id, title, price, city, type, status, created_at,
                    (SELECT path FROM listing_images li WHERE li.listing_id = listings.id ORDER BY li.sort_order LIMIT 1) AS thumb,
                    (SELECT current_price FROM auctions a WHERE a.listing_id = listings.id) AS current_price,
                    (SELECT ends_at FROM auctions a WHERE a.listing_id = listings.id) AS ends_at
             FROM listings
             WHERE user_id = ? AND status IN ($ph)$typeSql ORDER BY created_at DESC"
        );
        $stmt->execute($bind);
        return $stmt->fetchAll();
    }

    private static function reviewQueue(PDO $pdo, int $userId): array
    {
        $stmt = $pdo->prepare(
            "SELECT id, title, price, city, type, status, moderation_note, created_at,
                    (SELECT path FROM listing_images li WHERE li.listing_id = listings.id ORDER BY li.sort_order LIMIT 1) AS thumb,
                    (SELECT current_price FROM auctions a WHERE a.listing_id = listings.id) AS current_price,
                    (SELECT ends_at FROM auctions a WHERE a.listing_id = listings.id) AS ends_at
             FROM listings
             WHERE user_id = ? AND status IN ('pending', 'rejected')
             ORDER BY created_at DESC"
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    private static function purchased(PDO $pdo, int $userId): array
    {
        $stmt = $pdo->prepare(
            "SELECT l.id, l.title, l.price, l.city, l.type, l.status, l.created_at
             FROM listings l
             JOIN auctions a ON a.listing_id = l.id AND a.winner_user_id = ?
             WHERE l.status = 'sold'
             UNION
             SELECT l.id, l.title, l.price, l.city, l.type, l.status, l.created_at
             FROM orders o JOIN listings l ON l.id = o.listing_id
             WHERE o.buyer_id = ? AND o.status = 'completed'
             ORDER BY created_at DESC"
        );
        $stmt->execute([$userId, $userId]);
        return $stmt->fetchAll();
    }

    private static function auctions(PDO $pdo, int $userId): array
    {
        $stmt = $pdo->prepare(
            "SELECT l.id, l.title, l.price, l.city, l.type, l.status, a.ends_at, a.current_price, a.finalized_at,
                    (SELECT path FROM listing_images li WHERE li.listing_id = l.id ORDER BY li.sort_order LIMIT 1) AS thumb
             FROM listings l
             JOIN auctions a ON a.listing_id = l.id
             WHERE l.user_id = ? AND l.type = 'auction' AND l.status = 'active'
             ORDER BY l.created_at DESC"
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    private static function reviews(PDO $pdo, int $userId): array
    {
        $stmt = $pdo->prepare(
            'SELECT r.id, r.rating, r.comment, r.created_at, u.name AS reviewer_name, l.title AS listing_title
             FROM reviews r
             JOIN users u ON u.id = r.reviewer_id
             JOIN listings l ON l.id = r.listing_id
             WHERE r.reviewed_user_id = ?
             ORDER BY r.created_at DESC'
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    private static function counts(PDO $pdo, int $userId): array
    {
        $one = static function (string $sql, array $bind) use ($pdo): int {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($bind);
            return (int) $stmt->fetchColumn();
        };

        return [
            'active' => $one("SELECT COUNT(*) FROM listings WHERE user_id = ? AND status = 'active' AND type = 'fixed'", [$userId]),
            'review' => $one("SELECT COUNT(*) FROM listings WHERE user_id = ? AND status IN ('pending','rejected')", [$userId]),
            'sold' => $one("SELECT COUNT(*) FROM listings WHERE user_id = ? AND status = 'sold'", [$userId]),
            'reviews' => $one('SELECT COUNT(*) FROM reviews WHERE reviewed_user_id = ?', [$userId]),
            'purchases' => $one("SELECT COUNT(*) FROM orders WHERE buyer_id = ? AND status = 'completed'", [$userId]),
            'deals' => $one("SELECT COUNT(*) FROM listings WHERE user_id = ? AND status = 'sold'", [$userId]),
            'listings' => $one("SELECT COUNT(*) FROM listings WHERE user_id = ? AND status = 'active' AND type = 'fixed'", [$userId]),
            'auctions' => $one("SELECT COUNT(*) FROM listings WHERE user_id = ? AND status = 'active' AND type = 'auction'", [$userId]),
            'favorites' => $one('SELECT COUNT(*) FROM favorites f JOIN listings l ON l.id = f.listing_id WHERE f.user_id = ? AND l.status = \'active\'', [$userId]),
        ];
    }

    private static function publicListings(PDO $pdo, int $userId, string $type, int $limit): array
    {
        $limit = max(1, min(48, $limit));
        $stmt = $pdo->prepare(
            "SELECT l.id, l.title, l.price, l.city, l.type, l.status, l.created_at,
                    (SELECT path FROM listing_images li WHERE li.listing_id = l.id ORDER BY li.sort_order LIMIT 1) AS thumb,
                    a.current_price, a.ends_at
             FROM listings l
             LEFT JOIN auctions a ON a.listing_id = l.id
             WHERE l.user_id = ? AND l.type = ? AND l.status = 'active'
             ORDER BY l.created_at DESC
             LIMIT $limit"
        );
        $stmt->execute([$userId, $type]);
        return $stmt->fetchAll();
    }
}
