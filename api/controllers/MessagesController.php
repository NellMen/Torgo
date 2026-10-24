<?php

declare(strict_types=1);

final class MessagesController
{
    public static function conversations(): void
    {
        $user = Auth::requireUser();
        $uid = (int) $user['id'];
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare(
            'SELECT c.id, c.listing_id, c.buyer_id, c.seller_id, c.updated_at,
                    l.title AS listing_title, l.type AS listing_type,
                    bu.name AS buyer_name, su.name AS seller_name,
                    (SELECT path FROM listing_images li WHERE li.listing_id = l.id ORDER BY li.sort_order LIMIT 1) AS thumb,
                    (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message,
                    (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message_at,
                    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.is_read = 0 AND m.sender_id != ?) AS unread_count
             FROM conversations c
             JOIN listings l ON l.id = c.listing_id
             JOIN users bu ON bu.id = c.buyer_id
             JOIN users su ON su.id = c.seller_id
             WHERE c.buyer_id = ? OR c.seller_id = ?
             ORDER BY c.updated_at DESC'
        );
        $stmt->execute([$uid, $uid, $uid]);
        Response::success(['conversations' => $stmt->fetchAll()]);
    }

    public static function createConversation(): void
    {
        $user = Auth::requireUser();
        $body = Validator::parseJsonBody();
        $listingId = Validator::positiveInt($body['listing_id'] ?? null);
        $message = Validator::optionalString($body['message'] ?? null, 5000);
        if ($listingId === null) {
            Response::error('validation', 'Укажите listing_id');
            return;
        }

        $pdo = Database::getInstance();
        $lst = $pdo->prepare('SELECT id, user_id FROM listings WHERE id = ?');
        $lst->execute([$listingId]);
        $listing = $lst->fetch();
        if (!$listing) {
            Response::error('not_found', 'Объявление не найдено', 404);
            return;
        }
        $sellerId = (int) $listing['user_id'];
        $buyerId = (int) $user['id'];
        if ($sellerId === $buyerId) {
            Response::error('validation', 'Нельзя написать самому себе');
            return;
        }

        $find = $pdo->prepare('SELECT id FROM conversations WHERE listing_id = ? AND buyer_id = ? LIMIT 1');
        $find->execute([$listingId, $buyerId]);
        $conv = $find->fetch();
        if ($conv) {
            $convId = (int) $conv['id'];
        } else {
            $pdo->prepare(
                'INSERT INTO conversations (listing_id, buyer_id, seller_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())'
            )->execute([$listingId, $buyerId, $sellerId]);
            $convId = (int) $pdo->lastInsertId();
        }

        if ($message !== null && $message !== '') {
            $pdo->prepare(
                'INSERT INTO messages (conversation_id, sender_id, body, is_read, created_at) VALUES (?, ?, ?, 0, NOW())'
            )->execute([$convId, $buyerId, $message]);
            $pdo->prepare('UPDATE conversations SET updated_at = NOW() WHERE id = ?')->execute([$convId]);
        }

        Response::success(['conversation_id' => $convId, 'id' => $convId], 'Диалог открыт', 201);
    }

    public static function messages(int $conversationId): void
    {
        $user = Auth::requireUser();
        if (!self::canAccess($conversationId, (int) $user['id'])) {
            Response::error('forbidden', 'Нет доступа', 403);
            return;
        }
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare(
            'SELECT m.id, m.sender_id, m.body, m.is_read, m.created_at, u.name AS sender_name
             FROM messages m JOIN users u ON u.id = m.sender_id
             WHERE m.conversation_id = ?
             ORDER BY m.id ASC'
        );
        $stmt->execute([$conversationId]);
        Response::success(['messages' => $stmt->fetchAll()]);
    }

    public static function sendMessage(int $conversationId): void
    {
        $user = Auth::requireUser();
        $uid = (int) $user['id'];
        if (!self::canAccess($conversationId, $uid)) {
            Response::error('forbidden', 'Нет доступа', 403);
            return;
        }
        $body = Validator::parseJsonBody();
        $message = Validator::requiredString($body['message'] ?? null, 1, 5000);
        if ($message === null) {
            Response::error('validation', 'Пустое сообщение');
            return;
        }
        $pdo = Database::getInstance();
        $pdo->prepare(
            'INSERT INTO messages (conversation_id, sender_id, body, is_read, created_at) VALUES (?, ?, ?, 0, NOW())'
        )->execute([$conversationId, $uid, $message]);
        $pdo->prepare('UPDATE conversations SET updated_at = NOW() WHERE id = ?')->execute([$conversationId]);
        Response::success(null, 'Сообщение отправлено', 201);
    }

    public static function markRead(int $conversationId): void
    {
        $user = Auth::requireUser();
        $uid = (int) $user['id'];
        if (!self::canAccess($conversationId, $uid)) {
            Response::error('forbidden', 'Нет доступа', 403);
            return;
        }
        $pdo = Database::getInstance();
        $pdo->prepare(
            'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?'
        )->execute([$conversationId, $uid]);
        Response::success(null, 'Прочитано');
    }

    private static function canAccess(int $conversationId, int $userId): bool
    {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare('SELECT buyer_id, seller_id FROM conversations WHERE id = ?');
        $stmt->execute([$conversationId]);
        $row = $stmt->fetch();
        if (!$row) {
            return false;
        }
        return $userId === (int) $row['buyer_id'] || $userId === (int) $row['seller_id'];
    }
}
