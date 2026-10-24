<?php

declare(strict_types=1);

final class AdminAttributesController
{
    public static function listAll(): void
    {
        $pdo = Database::getInstance();
        $rows = $pdo->query(
            'SELECT a.id, a.name, a.type, a.category_id, a.sort_order, a.options_json, c.name AS category_name
             FROM category_attributes a
             JOIN categories c ON c.id = a.category_id
             ORDER BY a.name, a.id'
        )->fetchAll();
        Response::success(['attributes' => $rows]);
    }

    public static function index(int $categoryId): void
    {
        Response::success(['attributes' => CategoryService::getAttributesForCategory($categoryId, false)]);
    }

    public static function create(int $categoryId): void
    {
        $body = Validator::parseJsonBody();
        $name = Validator::requiredString($body['name'] ?? null, 1, 120);
        $type = (string) ($body['type'] ?? 'text');
        if ($name === null || !Validator::inList($type, ['text', 'number', 'select'])) {
            Response::error('validation', 'Некорректные данные атрибута');
            return;
        }
        $options = $body['options'] ?? [];
        $required = !empty($body['is_required']);
        $sort = Validator::nonNegativeInt($body['sort_order'] ?? 0) ?? 0;
        $pdo = Database::getInstance();
        $pdo->prepare(
            'INSERT INTO category_attributes (category_id, name, type, options_json, is_required, sort_order)
             VALUES (?, ?, ?, ?, ?, ?)'
        )->execute([
            $categoryId,
            $name,
            $type,
            $options ? json_encode($options, JSON_UNESCAPED_UNICODE) : null,
            $required ? 1 : 0,
            $sort,
        ]);
        Response::success(['id' => (int) $pdo->lastInsertId()], 'Атрибут создан', 201);
    }

    public static function update(int $id): void
    {
        $body = Validator::parseJsonBody();
        $fields = [];
        $bind = [];
        foreach (['name', 'type'] as $f) {
            if (isset($body[$f])) {
                $fields[] = "$f = ?";
                $bind[] = (string) $body[$f];
            }
        }
        if (array_key_exists('options', $body)) {
            $fields[] = 'options_json = ?';
            $bind[] = json_encode($body['options'], JSON_UNESCAPED_UNICODE);
        }
        if (array_key_exists('is_required', $body)) {
            $fields[] = 'is_required = ?';
            $bind[] = !empty($body['is_required']) ? 1 : 0;
        }
        if (isset($body['sort_order'])) {
            $fields[] = 'sort_order = ?';
            $bind[] = (int) $body['sort_order'];
        }
        if (isset($body['category_id'])) {
            $fields[] = 'category_id = ?';
            $bind[] = (int) $body['category_id'];
        }
        if ($fields === []) {
            Response::error('validation', 'Нет полей');
            return;
        }
        $bind[] = $id;
        Database::getInstance()->prepare('UPDATE category_attributes SET ' . implode(', ', $fields) . ' WHERE id = ?')
            ->execute($bind);
        Response::success(null, 'Атрибут обновлён');
    }

    public static function delete(int $id): void
    {
        $pdo = Database::getInstance();
        $pdo->prepare('DELETE FROM listing_attribute_values WHERE attribute_id = ?')->execute([$id]);
        $pdo->prepare('DELETE FROM category_attributes WHERE id = ?')->execute([$id]);
        Response::success(null, 'Атрибут удалён');
    }
}
