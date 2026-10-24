<?php

declare(strict_types=1);

final class Response
{
    public static function escape(mixed $value): mixed
    {
        if (is_array($value)) {
            $out = [];
            foreach ($value as $k => $v) {
                $out[self::escapeKey($k)] = self::escape($v);
            }
            return $out;
        }
        if (is_string($value)) {
            return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        }
        return $value;
    }

    private static function escapeKey(string|int $key): string|int
    {
        return is_string($key)
            ? htmlspecialchars($key, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')
            : $key;
    }

    public static function json(
        bool $ok,
        mixed $data = null,
        ?string $error = null,
        ?string $message = null,
        int $status = 200
    ): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');

        $payload = [
            'ok' => $ok,
            'data' => $ok ? self::escape($data) : null,
            'error' => $error !== null ? htmlspecialchars($error, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') : null,
            'message' => $message !== null ? htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') : null,
        ];

        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    }

    public static function success(mixed $data = null, ?string $message = null, int $status = 200): void
    {
        self::json(true, $data, null, $message, $status);
    }

    public static function error(string $error, ?string $message = null, int $status = 400): void
    {
        self::json(false, null, $error, $message, $status);
    }
}
