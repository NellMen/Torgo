<?php

declare(strict_types=1);

final class AdminListingsController
{
    public static function index(): void
    {
        $status = (string) ($_GET['status'] ?? '');
        $pdo = Database::getInstance();
        $sql = 'SELECT l.id, l.title, l.price, l.city, l.status, l.type, l.created_at, l.category_id,
                       c.name AS category_name, u.email AS seller_email
                FROM listings l
                JOIN users u ON u.id = l.user_id
                LEFT JOIN categories c ON c.id = l.category_id
                WHERE l.type = \'fixed\'';
        $bind = [];
        if ($status !== '' && $status !== 'all') {
            $sql .= ' AND l.status = ?';
            $bind[] = $status;
        }
        $sql .= ' ORDER BY l.created_at DESC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($bind);
        Response::success(['listings' => $stmt->fetchAll()]);
    }

    public static function show(int $id): void
    {
        $listing = ListingService::findDetail($id);
        if (!$listing || $listing['type'] !== 'fixed') {
            Response::error('not_found', 'Объявление не найдено', 404);
            return;
        }
        self::attachParent($listing);
        Response::success(['listing' => $listing]);
    }

    public static function approve(int $id): void
    {
        $body = Validator::parseJsonBody();
        $note = Validator::optionalString($body['note'] ?? null, 1000);
        self::moderate($id, 'active', $note);
    }

    public static function reject(int $id): void
    {
        $body = Validator::parseJsonBody();
        $note = Validator::optionalString($body['note'] ?? null, 1000);
        if ($note === null || $note === '') {
            Response::error('validation', 'Укажите причину отклонения');
            return;
        }
        self::moderate($id, 'rejected', $note);
    }

    public static function block(int $id): void
    {
        $body = Validator::parseJsonBody();
        $note = Validator::optionalString($body['note'] ?? null, 1000) ?? 'Заблокировано модератором';
        self::moderate($id, 'archived', $note);
    }

    private static function attachParent(array &$listing): void
    {
        $stmt = Database::getInstance()->prepare(
            'SELECT p.name FROM categories c LEFT JOIN categories p ON p.id = c.parent_id WHERE c.id = ?'
        );
        $stmt->execute([(int) $listing['category_id']]);
        $listing['parent_name'] = $stmt->fetchColumn() ?: null;
    }

    private static function moderate(int $id, string $status, ?string $note): void
    {
        $pdo = Database::getInstance();
        $pdo->prepare('UPDATE listings SET status = ?, moderation_note = ?, updated_at = NOW() WHERE id = ?')
            ->execute([$status, $note, $id]);
        Response::success(null, 'Статус обновлён');
    }
}
