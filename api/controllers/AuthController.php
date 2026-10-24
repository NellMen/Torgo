<?php

declare(strict_types=1);

final class AuthController
{
    public static function register(): void
    {
        $body = Validator::parseJsonBody();
        $email = isset($body['email']) ? strtolower(trim((string) $body['email'])) : '';
        $password = (string) ($body['password'] ?? '');
        $name = Validator::requiredString($body['name'] ?? null, 2, 120);
        $city = Validator::requiredString($body['city'] ?? null, 1, 120);
        $phone = preg_replace('/[^\d+]/', '', (string) ($body['phone'] ?? '')) ?? '';

        if ($name === null) {
            Response::error('validation', 'Укажите имя');
            return;
        }
        if (!Validator::email($email)) {
            Response::error('validation', 'Некорректный email');
            return;
        }
        if (strlen($phone) < 11) {
            Response::error('validation', 'Укажите телефон');
            return;
        }
        if ($city === null) {
            Response::error('validation', 'Укажите город');
            return;
        }
        if (strlen($password) < 6) {
            Response::error('validation', 'Пароль должен быть не короче 6 символов');
            return;
        }
        if ($password !== (string) ($body['confirm'] ?? '')) {
            Response::error('validation', 'Пароли не совпадают');
            return;
        }

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            Response::error('conflict', 'Email уже зарегистрирован', 409);
            return;
        }
        $phoneStmt = $pdo->prepare('SELECT id FROM users WHERE phone = ?');
        $phoneStmt->execute([$phone]);
        if ($phoneStmt->fetch()) {
            Response::error('conflict', 'Этот номер уже используется', 409);
            return;
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $pdo->prepare(
            'INSERT INTO users (email, phone, password_hash, name, city, role, is_blocked, rating_avg, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 0, 0, NOW())'
        )->execute([$email, $phone, $hash, $name, $city, 'user']);

        $userId = (int) $pdo->lastInsertId();
        Auth::login($userId);
        Response::success(Auth::user(), 'Регистрация успешна', 201);
    }

    public static function login(): void
    {
        $body = Validator::parseJsonBody();
        $email = isset($body['email']) ? strtolower(trim((string) $body['email'])) : '';
        $password = (string) ($body['password'] ?? '');

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare('SELECT id, password_hash, is_blocked FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($password, $user['password_hash'])) {
            Response::error('auth', 'Неверный email или пароль', 401);
            return;
        }
        if (!empty($user['is_blocked'])) {
            Response::error('blocked', 'Аккаунт заблокирован', 403);
            return;
        }

        Auth::login((int) $user['id']);
        Response::success(Auth::user(), 'Вход выполнен');
    }

    public static function logout(): void
    {
        Auth::logout();
        Response::success(null, 'Выход выполнен');
    }

    public static function me(): void
    {
        $user = Auth::user();
        if (!$user) {
            Response::error('unauthorized', 'Не авторизован', 401);
            return;
        }
        Response::success($user);
    }

    public static function updateProfile(): void
    {
        $current = Auth::requireUser();
        $isMultipart = str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'multipart');
        $body = $isMultipart ? $_POST : Validator::parseJsonBody();

        $name = Validator::requiredString($body['name'] ?? null, 2, 120);
        $city = Validator::requiredString($body['city'] ?? null, 1, 120);
        $email = isset($body['email']) ? strtolower(trim((string) $body['email'])) : '';
        $phone = preg_replace('/[^\d+]/', '', (string) ($body['phone'] ?? '')) ?? '';

        if ($name === null || $city === null) {
            Response::error('validation', 'Укажите имя и город');
            return;
        }
        if (!Validator::email($email)) {
            Response::error('validation', 'Некорректный email');
            return;
        }
        if (strlen($phone) < 11) {
            Response::error('validation', 'Укажите телефон');
            return;
        }

        $pdo = Database::getInstance();
        $emailStmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
        $emailStmt->execute([$email, $current['id']]);
        if ($emailStmt->fetch()) {
            Response::error('conflict', 'Email уже зарегистрирован', 409);
            return;
        }
        $phoneStmt = $pdo->prepare('SELECT id FROM users WHERE phone = ? AND id != ?');
        $phoneStmt->execute([$phone, $current['id']]);
        if ($phoneStmt->fetch()) {
            Response::error('conflict', 'Этот номер уже используется', 409);
            return;
        }

        $avatar = $current['avatar'] ?? null;
        $file = $_FILES['avatar'] ?? null;
        if (is_array($file) && ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
            try {
                $avatar = UploadService::saveOne($file);
            } catch (Throwable $e) {
                Response::error('validation', $e->getMessage());
                return;
            }
        }

        $pdo->prepare('UPDATE users SET email = ?, phone = ?, name = ?, city = ?, avatar = ? WHERE id = ?')
            ->execute([$email, $phone, $name, $city, $avatar, $current['id']]);

        Response::success(Auth::user(), 'Профиль обновлён');
    }
}
