<?php

declare(strict_types=1);

final class ListingsController
{
    public static function index(): void
    {
        $result = ListingService::catalogQuery($_GET, 'fixed');
        Response::success($result);
    }

    public static function show(int $id): void
    {
        $listing = ListingService::findDetail($id);
        if (!$listing || $listing['type'] !== 'fixed') {
            Response::error('not_found', 'Объявление не найдено', 404);
            return;
        }
        $viewerId = Auth::userId();
        $viewer = Auth::user();
        $isOwner = $viewerId === (int) $listing['user_id'];
        $isAdmin = ($viewer['role'] ?? '') === 'admin';
        $closed = in_array($listing['status'], ['sold', 'archived'], true);
        if ($listing['status'] !== 'active' && !$closed && !$isOwner && !$isAdmin) {
            Response::error('not_found', 'Объявление не найдено', 404);
            return;
        }
        FavoritesController::flag($listing, $viewerId);
        Response::success(['listing' => $listing]);
    }

    public static function create(): void
    {
        $user = Auth::requireUser();
        try {
            $data = self::parseListingInput();
            $files = $_FILES['images'] ?? [];
            $paths = UploadService::saveImages($files);
            if (count($paths) < 3) {
                throw new InvalidArgumentException('Добавьте минимум 3 фотографии');
            }
            $id = ListingService::create((int) $user['id'], $data, $paths);
            Response::success(['id' => $id], 'Объявление отправлено на модерацию', 201);
        } catch (InvalidArgumentException $e) {
            Response::error('validation', $e->getMessage());
        } catch (Throwable $e) {
            Response::error('server', $e->getMessage(), 500);
        }
    }

    public static function update(int $id): void
    {
        $user = Auth::requireUser();
        try {
            $body = Validator::parseJsonBody();
            $data = [];
            foreach (['title', 'description', 'price', 'item_condition', 'city', 'category_id'] as $f) {
                if (array_key_exists($f, $body)) {
                    $data[$f] = $body[$f];
                }
            }
            if (isset($body['attributes']) && is_array($body['attributes'])) {
                $data['attributes'] = $body['attributes'];
            }
            ListingService::update($id, (int) $user['id'], $data);
            Response::success(null, 'Объявление обновлено');
        } catch (InvalidArgumentException $e) {
            Response::error('validation', $e->getMessage());
        }
    }

    public static function resubmit(int $id): void
    {
        $user = Auth::requireUser();
        try {
            $data = self::parseListingInput();
            $pdo = Database::getInstance();
            $files = $_FILES['images'] ?? [];
            $hasFiles = !empty($files['name']) && count(array_filter((array) $files['name'])) > 0;
            $paths = $hasFiles ? UploadService::saveImages($files) : [];
            if (isset($_POST['keep_photos'])) {
                $keep = array_values(array_filter(array_map('intval', (array) ($_POST['keep_ids'] ?? []))));
                $keptCount = 0;
                if ($keep !== []) {
                    $ph = implode(',', array_fill(0, count($keep), '?'));
                    $keptStmt = $pdo->prepare("SELECT COUNT(*) FROM listing_images WHERE listing_id = ? AND id IN ($ph)");
                    $keptStmt->execute(array_merge([$id], $keep));
                    $keptCount = (int) $keptStmt->fetchColumn();
                }
                if ($keptCount + count($paths) < 3) {
                    throw new InvalidArgumentException('Добавьте минимум 3 фотографии');
                }
                if ($keep === []) {
                    $pdo->prepare('DELETE FROM listing_images WHERE listing_id = ?')->execute([$id]);
                } else {
                    $ph = implode(',', array_fill(0, count($keep), '?'));
                    $pdo->prepare("DELETE FROM listing_images WHERE listing_id = ? AND id NOT IN ($ph)")
                        ->execute(array_merge([$id], $keep));
                }
                UploadService::attachToListing($id, $paths);
            } else {
                if ($paths !== []) {
                    if (count($paths) < 3) {
                        throw new InvalidArgumentException('Добавьте минимум 3 фотографии');
                    }
                    $pdo->prepare('DELETE FROM listing_images WHERE listing_id = ?')->execute([$id]);
                    UploadService::attachToListing($id, $paths);
                }
                $count = $pdo->prepare('SELECT COUNT(*) FROM listing_images WHERE listing_id = ?');
                $count->execute([$id]);
                if ((int) $count->fetchColumn() < 3) {
                    throw new InvalidArgumentException('Добавьте минимум 3 фотографии');
                }
            }
            ListingService::update($id, (int) $user['id'], $data);
            Response::success(null, 'Отправлено на проверку');
        } catch (InvalidArgumentException $e) {
            Response::error('validation', $e->getMessage());
        }
    }

    public static function close(int $id): void
    {
        $user = Auth::requireUser();
        $body = Validator::parseJsonBody();
        $reason = (string) ($body['reason'] ?? '');
        try {
            ListingService::close($id, (int) $user['id'], $reason);
            Response::success(null, $reason === 'sold' ? 'Отмечено как проданное' : 'Снято с продажи');
        } catch (InvalidArgumentException $e) {
            Response::error('validation', $e->getMessage());
        }
    }

    public static function delete(int $id): void
    {
        $user = Auth::requireUser();
        try {
            ListingService::delete($id, (int) $user['id']);
            Response::success(null, 'Объявление удалено');
        } catch (InvalidArgumentException $e) {
            Response::error('validation', $e->getMessage());
        }
    }

    private static function parseListingInput(): array
    {
        $isMultipart = str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'multipart');
        $body = $isMultipart ? $_POST : Validator::parseJsonBody();

        $title = Validator::requiredString($body['title'] ?? null, 3, 70);
        $description = Validator::requiredString($body['description'] ?? null, 10, 10000);
        $categoryId = Validator::positiveInt($body['category_id'] ?? null);
        $type = (string) ($body['type'] ?? 'fixed');
        $price = Validator::price($body['price'] ?? null);
        $city = Validator::requiredString($body['city'] ?? null, 1, 120);

        if ($title === null || $description === null || $categoryId === null || $price === null || $city === null) {
            throw new InvalidArgumentException('Заполните обязательные поля');
        }
        $rootId = CategoryService::categoryChain($categoryId)[0] ?? 0;
        $skipCondition = in_array($rootId, [3, 7], true);
        $condition = $skipCondition ? null : (string) ($body['item_condition'] ?? '');
        if (!$skipCondition && !in_array($condition, ['new', 'used'], true)) {
            throw new InvalidArgumentException('Укажите состояние: новое или б/у');
        }

        $attributes = [];
        if (!empty($body['attributes'])) {
            $attributes = is_string($body['attributes']) ? json_decode($body['attributes'], true) : $body['attributes'];
            if (!is_array($attributes)) {
                $attributes = [];
            }
        }

        return [
            'title' => $title,
            'description' => $description,
            'category_id' => $categoryId,
            'type' => $type,
            'price' => $price,
            'item_condition' => $condition,
            'city' => $city,
            'attributes' => $attributes,
            'start_price' => Validator::price($body['start_price'] ?? null),
            'min_step' => Validator::price($body['min_step'] ?? null),
            'ends_at' => Validator::optionalString($body['ends_at'] ?? null, 32),
        ];
    }
}
