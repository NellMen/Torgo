<?php

declare(strict_types=1);

final class AdminAuctionsController
{
    public static function index(): void
    {
        $status = (string) ($_GET['status'] ?? '');
        $pdo = Database::getInstance();
        $sql = "SELECT l.id, l.title, l.city, l.status, l.created_at,
                       a.ends_at, a.current_price, a.start_price, a.finalized_at,
                       (SELECT COUNT(*) FROM bids b WHERE b.listing_id = l.id) AS bid_count,
                       u.email AS seller_email
                FROM listings l
                JOIN auctions a ON a.listing_id = l.id
                JOIN users u ON u.id = l.user_id
                WHERE l.type = 'auction'";
        $bind = [];
        if ($status !== '' && $status !== 'all') {
            $sql .= ' AND l.status = ?';
            $bind[] = $status;
        }
        $sql .= ' ORDER BY a.ends_at ASC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($bind);
        Response::success(['auctions' => $stmt->fetchAll()]);
    }

    public static function show(int $id): void
    {
        $listing = AuctionService::detail($id);
        if (!$listing) {
            Response::error('not_found', 'Аукцион не найден', 404);
            return;
        }
        $stmt = Database::getInstance()->prepare(
            'SELECT p.name FROM categories c LEFT JOIN categories p ON p.id = c.parent_id WHERE c.id = ?'
        );
        $stmt->execute([(int) $listing['category_id']]);
        $listing['parent_name'] = $stmt->fetchColumn() ?: null;
        Response::success(['auction' => $listing]);
    }

    public static function approve(int $id): void
    {
        $body = Validator::parseJsonBody();
        $note = Validator::optionalString($body['note'] ?? null, 1000);
        self::setStatus($id, 'active', $note);
        Response::success(null, 'Аукцион одобрен');
    }

    public static function reject(int $id): void
    {
        $body = Validator::parseJsonBody();
        $note = Validator::optionalString($body['note'] ?? null, 1000);
        if ($note === null || $note === '') {
            Response::error('validation', 'Укажите причину отклонения');
            return;
        }
        self::setStatus($id, 'rejected', $note);
        Response::success(null, 'Аукцион отклонён');
    }

    public static function block(int $id): void
    {
        $body = Validator::parseJsonBody();
        $note = Validator::optionalString($body['note'] ?? null, 1000) ?? 'Заблокировано модератором';
        self::setStatus($id, 'archived', $note);
        Response::success(null, 'Аукцион заблокирован');
    }

    private static function setStatus(int $id, string $status, ?string $note): void
    {
        Database::getInstance()
            ->prepare("UPDATE listings SET status = ?, moderation_note = ?, updated_at = NOW() WHERE id = ? AND type = 'auction'")
            ->execute([$status, $note, $id]);
    }
}
