<?php

declare(strict_types=1);

final class AuctionService
{
    public static function finalizeEnded(PDO $pdo): void
    {
        $stmt = $pdo->query(
            "SELECT a.listing_id, a.current_price, a.ends_at,
                    (SELECT user_id FROM bids b WHERE b.listing_id = a.listing_id ORDER BY b.amount DESC, b.id DESC LIMIT 1) AS winner_id
             FROM auctions a
             JOIN listings l ON l.id = a.listing_id
             WHERE a.finalized_at IS NULL AND a.ends_at <= NOW() AND l.status = 'active' AND l.type = 'auction'"
        );
        $rows = $stmt->fetchAll();
        foreach ($rows as $row) {
            $listingId = (int) $row['listing_id'];
            $winnerId = $row['winner_id'] !== null ? (int) $row['winner_id'] : null;
            $pdo->prepare('UPDATE auctions SET finalized_at = NOW(), winner_user_id = ? WHERE listing_id = ?')
                ->execute([$winnerId, $listingId]);
            if ($winnerId) {
                $pdo->prepare("UPDATE listings SET status = 'sold', updated_at = NOW() WHERE id = ?")
                    ->execute([$listingId]);
                self::notify($pdo, $winnerId, 'auction_won', 'Вы выиграли аукцион', 'Лот #' . $listingId);
            } else {
                $pdo->prepare("UPDATE listings SET status = 'archived', updated_at = NOW() WHERE id = ?")
                    ->execute([$listingId]);
            }
        }
    }

    public static function catalog(array $params): array
    {
        $pdo = Database::getInstance();
        self::finalizeEnded($pdo);

        $base = ListingService::catalogQuery($params, 'auction');
        $pdo = Database::getInstance();
        foreach ($base['items'] as &$item) {
            $stmt = $pdo->prepare(
                'SELECT start_price, current_price, min_step, ends_at FROM auctions WHERE listing_id = ?'
            );
            $stmt->execute([(int) $item['id']]);
            $auc = $stmt->fetch();
            $item['auction'] = $auc ?: null;
            if ($auc) {
                $item['price'] = $auc['current_price'];
            }
        }
        unset($item);

        return $base;
    }

    public static function detail(int $listingId): ?array
    {
        $pdo = Database::getInstance();
        self::finalizeEnded($pdo);

        $listing = ListingService::findDetail($listingId);
        if (!$listing || $listing['type'] !== 'auction') {
            return null;
        }

        $stmt = $pdo->prepare(
            'SELECT start_price, current_price, min_step, ends_at, finalized_at, winner_user_id
             FROM auctions WHERE listing_id = ?'
        );
        $stmt->execute([$listingId]);
        $listing['auction'] = $stmt->fetch();

        $count = $pdo->prepare('SELECT COUNT(*) FROM bids WHERE listing_id = ?');
        $count->execute([$listingId]);
        $listing['bids_count'] = (int) $count->fetchColumn();

        $bids = $pdo->prepare(
            'SELECT b.id, b.amount, b.created_at, u.id AS user_id, u.name AS user_name
             FROM bids b JOIN users u ON u.id = b.user_id
             WHERE b.listing_id = ?
             ORDER BY b.created_at DESC, b.id DESC
             LIMIT 10'
        );
        $bids->execute([$listingId]);
        $listing['bids'] = $bids->fetchAll();

        return $listing;
    }

    public static function placeBid(int $listingId, int $userId, float $amount): array
    {
        $pdo = Database::getInstance();
        self::finalizeEnded($pdo);

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                "SELECT l.id, l.user_id, l.status, a.current_price, a.min_step, a.ends_at, a.finalized_at
                 FROM listings l
                 JOIN auctions a ON a.listing_id = l.id
                 WHERE l.id = ? AND l.type = 'auction' FOR UPDATE"
            );
            $stmt->execute([$listingId]);
            $row = $stmt->fetch();
            if (!$row || $row['status'] !== 'active') {
                throw new InvalidArgumentException('Аукцион недоступен');
            }
            if ((int) $row['user_id'] === $userId) {
                throw new InvalidArgumentException('Нельзя ставить на свой лот');
            }
            if ($row['finalized_at'] !== null || strtotime($row['ends_at']) <= time()) {
                throw new InvalidArgumentException('Аукцион завершён');
            }

            $minBid = (float) $row['current_price'] + (float) $row['min_step'];
            if ($amount + 0.001 < $minBid) {
                throw new InvalidArgumentException('Ставка должна быть не ниже ' . (int) $minBid);
            }

            $pdo->prepare('INSERT INTO bids (listing_id, user_id, amount, created_at) VALUES (?, ?, ?, NOW())')
                ->execute([$listingId, $userId, $amount]);
            $pdo->prepare('UPDATE auctions SET current_price = ? WHERE listing_id = ?')
                ->execute([$amount, $listingId]);
            $pdo->prepare('UPDATE listings SET price = ?, updated_at = NOW() WHERE id = ?')
                ->execute([$amount, $listingId]);

            $config = require __DIR__ . '/../config.php';
            $window = (int) $config['auction']['auto_extend_window_minutes'];
            $extend = (int) $config['auction']['auto_extend_minutes'];
            $endsTs = strtotime($row['ends_at']);
            $newEnds = $row['ends_at'];
            if ($endsTs - time() <= $window * 60) {
                $newEnds = date('Y-m-d H:i:s', $endsTs + $extend * 60);
                $pdo->prepare('UPDATE auctions SET ends_at = ?, extend_count = extend_count + 1 WHERE listing_id = ?')
                    ->execute([$newEnds, $listingId]);
            }

            $sellerId = (int) $row['user_id'];
            self::notify($pdo, $sellerId, 'new_bid', 'Новая ставка', 'Лот #' . $listingId . ': ' . $amount);

            $pdo->commit();

            return [
                'current_price' => $amount,
                'ends_at' => $newEnds,
                'min_next_bid' => $amount + (float) $row['min_step'],
            ];
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    private static function notify(PDO $pdo, int $userId, string $type, string $title, string $body): void
    {
        $pdo->prepare(
            'INSERT INTO notifications (user_id, type, title, body, is_read, created_at) VALUES (?, ?, ?, ?, 0, NOW())'
        )->execute([$userId, $type, $title, $body]);
    }
}
