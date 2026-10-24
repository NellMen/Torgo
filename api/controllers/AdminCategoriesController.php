<?php

declare(strict_types=1);

final class AdminCategoriesController
{
    public static function index(): void
    {
        $pdo = Database::getInstance();
        $counts = [];
        foreach ($pdo->query("SELECT category_id, COUNT(*) AS cnt FROM listings WHERE status = 'active' GROUP BY category_id") as $row) {
            $counts[(int) $row['category_id']] = (int) $row['cnt'];
        }
        $active = (int) $pdo->query("SELECT COUNT(*) FROM listings WHERE status = 'active' AND type = 'fixed'")->fetchColumn();
        Response::success([
            'tree' => CategoryService::getTree(),
            'counts' => $counts,
            'active_listings' => $active,
        ]);
    }

    public static function create(): void
    {
        $body = Validator::parseJsonBody();
        $name = Validator::requiredString($body['name'] ?? null, 2, 120);
        $slug = Validator::requiredString($body['slug'] ?? null, 2, 120);
        $parentId = Validator::positiveInt($body['parent_id'] ?? null);
        $sort = Validator::nonNegativeInt($body['sort_order'] ?? 0) ?? 0;
        if ($name === null || $slug === null) {
            Response::error('validation', 'name и slug обязательны');
            return;
        }
        $pdo = Database::getInstance();
        $pdo->prepare(
            'INSERT INTO categories (parent_id, name, slug, sort_order) VALUES (?, ?, ?, ?)'
        )->execute([$parentId, $name, $slug, $sort]);
        Response::success(['id' => (int) $pdo->lastInsertId()], 'Категория создана', 201);
    }

    public static function update(int $id): void
    {
        $body = Validator::parseJsonBody();
        $fields = [];
        $bind = [];
        if (isset($body['name'])) {
            $fields[] = 'name = ?';
            $bind[] = (string) $body['name'];
        }
        if (isset($body['slug'])) {
            $fields[] = 'slug = ?';
            $bind[] = (string) $body['slug'];
        }
        if (array_key_exists('parent_id', $body)) {
            $fields[] = 'parent_id = ?';
            $bind[] = Validator::positiveInt($body['parent_id']);
        }
        if (isset($body['sort_order'])) {
            $fields[] = 'sort_order = ?';
            $bind[] = (int) $body['sort_order'];
        }
        if ($fields === []) {
            Response::error('validation', 'Нет полей для обновления');
            return;
        }
        $bind[] = $id;
        $pdo = Database::getInstance();
        $pdo->prepare('UPDATE categories SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($bind);
        Response::success(null, 'Категория обновлена');
    }

    public static function delete(int $id): void
    {
        $pdo = Database::getInstance();
        $child = $pdo->prepare('SELECT COUNT(*) FROM categories WHERE parent_id = ?');
        $child->execute([$id]);
        if ((int) $child->fetchColumn() > 0) {
            Response::error('validation', 'Удалите дочерние категории');
            return;
        }
        $used = $pdo->prepare('SELECT COUNT(*) FROM listings WHERE category_id = ?');
        $used->execute([$id]);
        if ((int) $used->fetchColumn() > 0) {
            Response::error('validation', 'Категория используется в объявлениях');
            return;
        }
        $pdo->prepare('DELETE FROM category_attributes WHERE category_id = ?')->execute([$id]);
        $pdo->prepare('DELETE FROM categories WHERE id = ?')->execute([$id]);
        Response::success(null, 'Категория удалена');
    }
}
