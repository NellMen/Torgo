<?php

declare(strict_types=1);

final class AdminUsersController
{
    public static function index(): void
    {
        $pdo = Database::getInstance();
        $q = trim((string) ($_GET['q'] ?? ''));
        if ($q !== '') {
            $stmt = $pdo->prepare(
                'SELECT id, email, name, city, role, is_blocked, rating_avg, created_at
                 FROM users WHERE email LIKE ? OR name LIKE ? OR CAST(id AS CHAR) LIKE ? ORDER BY id DESC'
            );
            $like = '%' . $q . '%';
            $stmt->execute([$like, $like, $like]);
        } else {
            $stmt = $pdo->query(
                'SELECT id, email, name, city, role, is_blocked, rating_avg, created_at FROM users ORDER BY id DESC'
            );
        }
        Response::success(['users' => $stmt->fetchAll()]);
    }

    public static function block(int $id): void
    {
        $body = Validator::parseJsonBody();
        $blocked = !empty($body['blocked']);
        $pdo = Database::getInstance();
        $pdo->prepare('UPDATE users SET is_blocked = ? WHERE id = ? AND role != ?')
            ->execute([$blocked ? 1 : 0, $id, 'admin']);
        Response::success(null, $blocked ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
    }
}
