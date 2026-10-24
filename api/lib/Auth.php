<?php

declare(strict_types=1);

final class Auth
{
    public static function userId(): ?int
    {
        return isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
    }

    public static function requireUser(): array
    {
        $user = self::user();
        if ($user === null) {
            Response::error('unauthorized', 'Требуется авторизация', 401);
            exit;
        }
        if (!empty($user['is_blocked'])) {
            Response::error('blocked', 'Аккаунт заблокирован', 403);
            exit;
        }
        return $user;
    }

    public static function requireAdmin(): array
    {
        $user = self::requireUser();
        if (($user['role'] ?? '') !== 'admin') {
            Response::error('forbidden', 'Доступ только для администратора', 403);
            exit;
        }
        return $user;
    }

    public static function user(): ?array
    {
        $id = self::userId();
        if ($id === null) {
            return null;
        }
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare(
            'SELECT id, email, phone, name, city, avatar, role, is_blocked, rating_avg, created_at FROM users WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function login(int $userId): void
    {
        session_regenerate_id(true);
        $_SESSION['user_id'] = $userId;
    }

    public static function logout(): void
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
        session_destroy();
    }
}
