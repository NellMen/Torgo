<?php

declare(strict_types=1);

final class NotificationsController
{
    public static function index(): void
    {
        $user = Auth::requireUser();
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare(
            'SELECT id, type, title, body, is_read, created_at FROM notifications
             WHERE user_id = ? ORDER BY created_at DESC LIMIT 100'
        );
        $stmt->execute([(int) $user['id']]);
        Response::success(['notifications' => $stmt->fetchAll()]);
    }

    public static function markRead(): void
    {
        $user = Auth::requireUser();
        $body = Validator::parseJsonBody();
        $ids = $body['ids'] ?? null;
        $pdo = Database::getInstance();
        if ($ids === null || $ids === 'all') {
            $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?')
                ->execute([(int) $user['id']]);
        } else {
            if (!is_array($ids)) {
                Response::error('validation', 'ids должен быть массивом');
                return;
            }
            $ids = array_map('intval', $ids);
            $ids = array_filter($ids, fn ($id) => $id > 0);
            if ($ids === []) {
                Response::success(null, 'Нечего отмечать');
                return;
            }
            $ph = implode(',', array_fill(0, count($ids), '?'));
            $bind = array_merge([(int) $user['id']], $ids);
            $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id IN ($ph)")
                ->execute($bind);
        }
        Response::success(null, 'Уведомления прочитаны');
    }
}
