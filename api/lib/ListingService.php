<?php

declare(strict_types=1);

final class ListingService
{
    public static function catalogQuery(array $params, string $type): array
    {
        $pdo = Database::getInstance();
        $where = ['l.type = ?', "l.status = 'active'"];
        $bind = [$type];
        $viewerId = Auth::userId();
        if ($viewerId) {
            $where[] = 'l.user_id <> ?';
            $bind[] = $viewerId;
        }

        $categoryIds = [];
        if (!empty($params['categories'])) {
            $raw = is_array($params['categories']) ? $params['categories'] : explode(',', (string) $params['categories']);
            $categoryIds = CategoryService::resolveCategoryFilter(array_map('intval', $raw));
        }
        if ($categoryIds !== []) {
            $ph = implode(',', array_fill(0, count($categoryIds), '?'));
            $where[] = "(l.category_id IN ($ph) OR EXISTS (SELECT 1 FROM listing_categories lc WHERE lc.listing_id = l.id AND lc.category_id IN ($ph)))";
            foreach ($categoryIds as $cid) {
                $bind[] = $cid;
            }
            foreach ($categoryIds as $cid) {
                $bind[] = $cid;
            }
        }

        if (!empty($params['city'])) {
            $where[] = 'l.city = ?';
            $bind[] = trim((string) $params['city']);
        }
        if (isset($params['price_min']) && $params['price_min'] !== '') {
            $where[] = 'l.price >= ?';
            $bind[] = (float) $params['price_min'];
        }
        if (isset($params['price_max']) && $params['price_max'] !== '') {
            $where[] = 'l.price <= ?';
            $bind[] = (float) $params['price_max'];
        }
        if (!empty($params['condition'])) {
            $where[] = 'l.item_condition = ?';
            $bind[] = (string) $params['condition'];
        }
        if (isset($params['min_seller_rating']) && $params['min_seller_rating'] !== '') {
            $where[] = 'u.rating_avg >= ?';
            $bind[] = (float) $params['min_seller_rating'];
        }
        if (!empty($params['q'])) {
            $where[] = 'l.description LIKE ?';
            $bind[] = '%' . str_replace(['%', '_'], ['\\%', '\\_'], trim((string) $params['q'])) . '%';
        }
        if (!empty($params['exclude'])) {
            $words = preg_split('/\s+/', trim((string) $params['exclude'])) ?: [];
            foreach ($words as $word) {
                if ($word === '') {
                    continue;
                }
                $where[] = 'l.description NOT LIKE ?';
                $bind[] = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $word) . '%';
            }
        }
        if (!empty($params['only_with_photo'])) {
            $where[] = 'EXISTS (SELECT 1 FROM listing_images li WHERE li.listing_id = l.id)';
        }

        $sort = (string) ($params['sort'] ?? 'newest');
        $orderBy = match ($sort) {
            'price_asc' => 'l.price ASC',
            'price_desc' => 'l.price DESC',
            'oldest' => 'l.created_at ASC',
            default => 'l.created_at DESC',
        };

        $page = max(1, (int) ($params['page'] ?? 1));
        $perPage = min(50, max(1, (int) ($params['per_page'] ?? 12)));
        $offset = ($page - 1) * $perPage;

        $whereSql = implode(' AND ', $where);
        $countSql = "SELECT COUNT(*) FROM listings l JOIN users u ON u.id = l.user_id WHERE $whereSql";
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($bind);
        $total = (int) $stmt->fetchColumn();

        $sql = "SELECT l.id, l.title, l.price, l.city, l.item_condition, l.created_at, l.type,
                       u.id AS seller_id, u.name AS seller_name, u.rating_avg AS seller_rating,
                       (SELECT path FROM listing_images li WHERE li.listing_id = l.id ORDER BY li.sort_order LIMIT 1) AS thumb
                FROM listings l
                JOIN users u ON u.id = l.user_id
                WHERE $whereSql
                ORDER BY $orderBy
                LIMIT $perPage OFFSET $offset";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($bind);
        $items = $stmt->fetchAll();

        return [
            'items' => $items,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'pages' => (int) ceil($total / $perPage),
            ],
        ];
    }

    public static function findDetail(int $id): ?array
    {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare(
            'SELECT l.*, u.id AS seller_id, u.name AS seller_name, u.city AS seller_city,
                    u.rating_avg AS seller_rating, c.name AS category_name,
                    (SELECT COUNT(*) FROM reviews r WHERE r.reviewed_user_id = u.id) AS seller_reviews
             FROM listings l
             JOIN users u ON u.id = l.user_id
             JOIN categories c ON c.id = l.category_id
             WHERE l.id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $listing = $stmt->fetch();
        if (!$listing) {
            return null;
        }

        $img = $pdo->prepare('SELECT id, path, sort_order FROM listing_images WHERE listing_id = ? ORDER BY sort_order');
        $img->execute([$id]);
        $listing['images'] = $img->fetchAll();

        $attr = $pdo->prepare(
            'SELECT lav.attribute_id, ca.name, lav.value
             FROM listing_attribute_values lav
             JOIN category_attributes ca ON ca.id = lav.attribute_id
             WHERE lav.listing_id = ?'
        );
        $attr->execute([$id]);
        $listing['attributes'] = $attr->fetchAll();

        return $listing;
    }

    public static function create(int $userId, array $data, array $imagePaths): int
    {
        $pdo = Database::getInstance();
        if (!CategoryService::isLeaf((int) $data['category_id'])) {
            throw new InvalidArgumentException('Выберите конечную категорию');
        }
        $type = $data['type'];
        if (!in_array($type, ['fixed', 'auction'], true)) {
            throw new InvalidArgumentException('Неверный тип объявления');
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO listings (user_id, category_id, type, title, description, price, item_condition, city, status, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())'
            );
            $status = 'pending';
            $stmt->execute([
                $userId,
                (int) $data['category_id'],
                $type,
                $data['title'],
                $data['description'],
                (float) $data['price'],
                $data['item_condition'],
                $data['city'],
                $status,
            ]);
            $listingId = (int) $pdo->lastInsertId();
            $link = $pdo->prepare('INSERT INTO listing_categories (listing_id, category_id) VALUES (?, ?)');
            foreach (CategoryService::categoryChain((int) $data['category_id']) as $categoryId) {
                $link->execute([$listingId, $categoryId]);
            }

            self::saveAttributes($listingId, (int) $data['category_id'], $data['attributes'] ?? []);
            UploadService::attachToListing($listingId, $imagePaths);

            if ($type === 'auction') {
                $endsAt = (string) ($data['ends_at'] ?? '');
                $startPrice = $data['start_price'];
                $minStep = $data['min_step'];
                if ($endsAt === '' || $startPrice === null || $minStep === null) {
                    throw new InvalidArgumentException('Укажите стартовую цену, шаг и дату завершения');
                }
                $auc = $pdo->prepare(
                    'INSERT INTO auctions (listing_id, start_price, current_price, min_step, ends_at, created_at)
                     VALUES (?, ?, ?, ?, ?, NOW())'
                );
                $auc->execute([$listingId, $startPrice, $startPrice, $minStep, $endsAt]);
            }

            $pdo->commit();
            return $listingId;
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function update(int $listingId, int $userId, array $data, bool $isAdmin = false): void
    {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare('SELECT user_id, category_id FROM listings WHERE id = ?');
        $stmt->execute([$listingId]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new InvalidArgumentException('Объявление не найдено');
        }
        if (!$isAdmin && (int) $row['user_id'] !== $userId) {
            throw new InvalidArgumentException('Нет доступа');
        }

        $fields = [];
        $bind = [];
        foreach (['title', 'description', 'price', 'item_condition', 'city'] as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "$f = ?";
                $bind[] = $data[$f];
            }
        }
        if (isset($data['category_id'])) {
            if (!CategoryService::isLeaf((int) $data['category_id'])) {
                throw new InvalidArgumentException('Выберите конечную категорию');
            }
            $fields[] = 'category_id = ?';
            $bind[] = (int) $data['category_id'];
        }
        $fields[] = "status = 'pending'";
        $fields[] = 'moderation_note = NULL';
        if ($fields === ['status = \'pending\'', 'moderation_note = NULL']) {
            $fields[] = 'updated_at = NOW()';
        }
        if (!in_array('updated_at = NOW()', $fields, true)) {
            $fields[] = 'updated_at = NOW()';
        }
        $bind[] = $listingId;
        $pdo->prepare('UPDATE listings SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($bind);

        if (isset($data['attributes'])) {
            $catId = isset($data['category_id']) ? (int) $data['category_id'] : (int) $row['category_id'];
            $pdo->prepare('DELETE FROM listing_attribute_values WHERE listing_id = ?')->execute([$listingId]);
            self::saveAttributes($listingId, $catId, $data['attributes']);
        }
        if (isset($data['start_price'], $data['min_step'], $data['ends_at'])) {
            $pdo->prepare('UPDATE auctions SET start_price = ?, current_price = ?, min_step = ?, ends_at = ? WHERE listing_id = ?')
                ->execute([$data['start_price'], $data['start_price'], $data['min_step'], $data['ends_at'], $listingId]);
        }
    }

    public static function close(int $listingId, int $userId, string $reason): void
    {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare('SELECT user_id, status FROM listings WHERE id = ?');
        $stmt->execute([$listingId]);
        $row = $stmt->fetch();
        if (!$row || (int) $row['user_id'] !== $userId) {
            throw new InvalidArgumentException('Нет доступа');
        }
        if (!in_array($reason, ['sold', 'withdraw'], true)) {
            throw new InvalidArgumentException('Укажите причину');
        }
        if ($row['status'] !== 'active') {
            throw new InvalidArgumentException('Закрыть можно только активное объявление');
        }
        $status = $reason === 'sold' ? 'sold' : 'archived';
        $pdo->prepare('DELETE FROM favorites WHERE listing_id = ?')->execute([$listingId]);
        $pdo->prepare('DELETE FROM listing_attribute_values WHERE listing_id = ?')->execute([$listingId]);
        $pdo->prepare('DELETE FROM listing_categories WHERE listing_id = ?')->execute([$listingId]);
        $pdo->prepare('DELETE FROM listing_images WHERE listing_id = ?')->execute([$listingId]);
        $pdo->prepare(
            "UPDATE listings SET status = ?, description = '', item_condition = NULL, moderation_note = NULL, updated_at = NOW() WHERE id = ?"
        )->execute([$status, $listingId]);
    }

    private static function saveAttributes(int $listingId, int $categoryId, array $attributes): void
    {
        $defs = CategoryService::getAttributesForCategory($categoryId);
        $pdo = Database::getInstance();
        $ins = $pdo->prepare('INSERT INTO listing_attribute_values (listing_id, attribute_id, value) VALUES (?, ?, ?)');
        foreach ($defs as $def) {
            $val = $attributes[$def['id']] ?? $attributes[(string) $def['id']] ?? null;
            if ($val === null || $val === '') {
                throw new InvalidArgumentException('Заполните атрибут: ' . $def['name']);
            }
            if ($val !== null && $val !== '') {
                $ins->execute([$listingId, $def['id'], (string) $val]);
            }
        }
    }

    public static function delete(int $listingId, int $userId, bool $isAdmin = false): void
    {
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare('SELECT user_id FROM listings WHERE id = ?');
        $stmt->execute([$listingId]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new InvalidArgumentException('Объявление не найдено');
        }
        if (!$isAdmin && (int) $row['user_id'] !== $userId) {
            throw new InvalidArgumentException('Нет доступа');
        }
        $pdo->prepare("UPDATE listings SET status = 'archived', updated_at = NOW() WHERE id = ?")->execute([$listingId]);
    }
}
