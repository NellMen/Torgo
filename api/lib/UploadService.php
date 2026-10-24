<?php

declare(strict_types=1);

final class UploadService
{
    public static function saveImages(array $files): array
    {
        $config = require __DIR__ . '/../config.php';
        $uploadCfg = $config['upload'];
        $dir = $uploadCfg['dir'];
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $saved = [];
        $count = is_array($files['name'] ?? null) ? count($files['name']) : 0;
        if ($count === 0) {
            return [];
        }
        if ($count > $uploadCfg['max_images_per_listing']) {
            throw new InvalidArgumentException('Максимум ' . $uploadCfg['max_images_per_listing'] . ' изображений');
        }

        for ($i = 0; $i < $count; $i++) {
            if (($files['error'][$i] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
                continue;
            }
            if (($files['error'][$i] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
                throw new RuntimeException('Ошибка загрузки файла');
            }
            if (($files['size'][$i] ?? 0) > $uploadCfg['max_file_size']) {
                throw new RuntimeException('Файл слишком большой');
            }
            $tmp = $files['tmp_name'][$i] ?? '';
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime = $finfo->file($tmp);
            if (!in_array($mime, $uploadCfg['allowed_mimes'], true)) {
                throw new RuntimeException('Недопустимый тип файла');
            }
            $ext = match ($mime) {
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
                'image/gif' => 'gif',
                default => 'bin',
            };
            $name = bin2hex(random_bytes(16)) . '.' . $ext;
            $dest = $dir . DIRECTORY_SEPARATOR . $name;
            if (!move_uploaded_file($tmp, $dest)) {
                throw new RuntimeException('Не удалось сохранить файл');
            }
            $saved[] = 'uploads/' . $name;
        }

        return $saved;
    }

    public static function saveOne(array $file): string
    {
        $paths = self::saveImages([
            'name' => [$file['name'] ?? ''],
            'type' => [$file['type'] ?? ''],
            'tmp_name' => [$file['tmp_name'] ?? ''],
            'error' => [$file['error'] ?? UPLOAD_ERR_NO_FILE],
            'size' => [$file['size'] ?? 0],
        ]);
        if ($paths === []) {
            throw new RuntimeException('Не удалось сохранить файл');
        }
        return $paths[0];
    }

    public static function attachToListing(int $listingId, array $paths): void
    {
        if ($paths === []) {
            return;
        }
        $pdo = Database::getInstance();
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM listing_images WHERE listing_id = ?');
        $stmt->execute([$listingId]);
        $existing = (int) $stmt->fetchColumn();
        $config = require __DIR__ . '/../config.php';
        $max = $config['upload']['max_images_per_listing'];
        if ($existing + count($paths) > $max) {
            throw new InvalidArgumentException('Максимум ' . $max . ' изображений на объявление');
        }
        $ins = $pdo->prepare('INSERT INTO listing_images (listing_id, path, sort_order) VALUES (?, ?, ?)');
        $order = $existing;
        foreach ($paths as $path) {
            $ins->execute([$listingId, $path, $order++]);
        }
    }
}
