<?php

declare(strict_types=1);

final class CategoryService
{
    public static function getTree(): array
    {
        $pdo = Database::getInstance();
        $rows = $pdo->query('SELECT id, parent_id, name, slug, sort_order FROM categories ORDER BY sort_order, id')->fetchAll();
        return self::buildTree($rows, null);
    }

    private static function buildTree(array $rows, ?int $parentId): array
    {
        $branch = [];
        foreach ($rows as $row) {
            $pid = $row['parent_id'] !== null ? (int) $row['parent_id'] : null;
            if ($pid === $parentId) {
                $node = [
                    'id' => (int) $row['id'],
                    'name' => $row['name'],
                    'slug' => $row['slug'],
                    'sort_order' => (int) $row['sort_order'],
                    'children' => self::buildTree($rows, (int) $row['id']),
                ];
                $branch[] = $node;
            }
        }
        return $branch;
    }

    public static function isLeaf(int $categoryId): bool
    {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM categories WHERE parent_id = ?');
        $stmt->execute([$categoryId]);
        return (int) $stmt->fetchColumn() === 0;
    }

    public static function resolveCategoryFilter(array $categoryIds): array
    {
        $selected = array_values(array_unique(array_filter(array_map('intval', $categoryIds), fn ($id) => $id > 0)));
        if ($selected === []) {
            return [];
        }

        $pdo = Database::getInstance();
        $rows = $pdo->query('SELECT id, parent_id FROM categories')->fetchAll();
        $childrenOf = [];
        $known = [];
        foreach ($rows as $row) {
            $id = (int) $row['id'];
            $known[$id] = true;
            $parentId = $row['parent_id'] !== null ? (int) $row['parent_id'] : 0;
            $childrenOf[$parentId][] = $id;
        }

        $selectedSet = [];
        foreach ($selected as $id) {
            if (isset($known[$id])) {
                $selectedSet[$id] = true;
            }
        }
        if ($selectedSet === []) {
            return [];
        }

        $hasSelectedDescendant = function (int $id) use (&$hasSelectedDescendant, $childrenOf, $selectedSet): bool {
            foreach ($childrenOf[$id] ?? [] as $childId) {
                if (isset($selectedSet[$childId]) || $hasSelectedDescendant($childId)) {
                    return true;
                }
            }
            return false;
        };

        $result = [];
        foreach (array_keys($selectedSet) as $id) {
            if ($hasSelectedDescendant($id)) {
                continue;
            }
            if (!empty($childrenOf[$id])) {
                $stack = [$id];
                while ($stack !== []) {
                    $current = array_pop($stack);
                    $result[] = $current;
                    foreach ($childrenOf[$current] ?? [] as $childId) {
                        $stack[] = $childId;
                    }
                }
            } else {
                $result[] = $id;
            }
        }

        return array_values(array_unique($result));
    }

    public static function getAttributesForCategory(int $categoryId, bool $includeAncestors = true): array
    {
        $chain = $includeAncestors ? self::categoryChain($categoryId) : [$categoryId];
        if ($chain === []) {
            return [];
        }

        $pdo = Database::getInstance();
        $placeholders = implode(',', array_fill(0, count($chain), '?'));
        $stmt = $pdo->prepare(
            "SELECT id, category_id, name, type, options_json, is_required, sort_order
             FROM category_attributes WHERE category_id IN ($placeholders)
             ORDER BY sort_order, id"
        );
        $stmt->execute($chain);
        $grouped = [];
        foreach ($stmt->fetchAll() as $row) {
            $grouped[(int) $row['category_id']][] = $row;
        }

        $merged = [];
        $indexByName = [];
        foreach ($chain as $id) {
            foreach ($grouped[$id] ?? [] as $row) {
                $key = mb_strtolower(trim((string) $row['name']));
                $normalized = self::normalizeAttribute($row);
                if (isset($indexByName[$key])) {
                    $merged[$indexByName[$key]] = $normalized;
                    continue;
                }
                $indexByName[$key] = count($merged);
                $merged[] = $normalized;
            }
        }

        return $merged;
    }

    public static function categoryChain(int $categoryId): array
    {
        $pdo = Database::getInstance();
        $chain = [];
        $current = $categoryId;
        $guard = 0;
        while ($current > 0 && $guard < 20) {
            $stmt = $pdo->prepare('SELECT id, parent_id FROM categories WHERE id = ?');
            $stmt->execute([$current]);
            $row = $stmt->fetch();
            if (!$row) {
                break;
            }
            array_unshift($chain, (int) $row['id']);
            $current = $row['parent_id'] !== null ? (int) $row['parent_id'] : 0;
            $guard++;
        }

        return $chain;
    }

    private static function normalizeAttribute(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'category_id' => (int) $row['category_id'],
            'name' => $row['name'],
            'type' => $row['type'],
            'is_required' => (bool) $row['is_required'],
            'sort_order' => (int) $row['sort_order'],
            'options' => $row['options_json'] ? json_decode($row['options_json'], true) : [],
        ];
    }
}
