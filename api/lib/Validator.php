<?php

declare(strict_types=1);

final class Validator
{
    public static function email(string $email): bool
    {
        return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
    }

    public static function requiredString(mixed $value, int $min = 1, int $max = 5000): ?string
    {
        if (!is_string($value)) {
            return null;
        }
        $value = trim($value);
        $len = mb_strlen($value);
        if ($len < $min || $len > $max) {
            return null;
        }
        return $value;
    }

    public static function optionalString(mixed $value, int $max = 5000): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (!is_string($value)) {
            return null;
        }
        $value = trim($value);
        if (mb_strlen($value) > $max) {
            return null;
        }
        return $value;
    }

    public static function positiveInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (!is_numeric($value)) {
            return null;
        }
        $i = (int) $value;
        return $i > 0 ? $i : null;
    }

    public static function nonNegativeInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (!is_numeric($value)) {
            return null;
        }
        $i = (int) $value;
        return $i >= 0 ? $i : null;
    }

    public static function price(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (!is_numeric($value)) {
            return null;
        }
        $f = (float) $value;
        return $f >= 0 ? $f : null;
    }

    public static function inList(mixed $value, array $allowed): bool
    {
        return in_array($value, $allowed, true);
    }

    public static function parseJsonBody(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || $raw === '') {
            return [];
        }
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }
}
