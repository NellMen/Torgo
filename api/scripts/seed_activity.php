<?php

declare(strict_types=1);

require dirname(__DIR__) . '/bootstrap.php';

$pdo = Database::getInstance();
$hash = password_hash('password123', PASSWORD_DEFAULT);

$users = [
    [4, 'elena@test.ru', 'Елена Крылова', 'Москва'],
    [5, 'dmitry@test.ru', 'Дмитрий Волков', 'Казань'],
    [6, 'anna@test.ru', 'Анна Белова', 'Санкт-Петербург'],
];
$insUser = $pdo->prepare(
    'INSERT INTO users (id, email, password_hash, name, city, role, is_blocked, rating_avg, created_at)
     VALUES (?, ?, ?, ?, ?, \'user\', 0, 4.70, DATE_SUB(NOW(), INTERVAL 400 DAY))
     ON DUPLICATE KEY UPDATE name = VALUES(name)'
);
foreach ($users as $user) {
    $insUser->execute([$user[0], $user[1], $hash, $user[2], $user[3]]);
}

$listings = [
    [11, 2, 14, 'fixed', 'iPhone 13, 128 ГБ', 'Смартфон в комплекте, батарея 89%.', 52000, 'used', 'Москва', 'uploads/seed/nikon.png'],
    [12, 4, 19, 'fixed', 'Volkswagen Golf, 2016', 'Один владелец, сервисная книжка.', 890000, 'used', 'Москва', 'uploads/seed/lamp.png'],
    [13, 5, 22, 'fixed', 'Двушка у метро, 54 м²', 'Кухня-гостиная, балкон, светлая сторона.', 9800000, null, 'Казань', 'uploads/seed/wassily.png'],
    [14, 6, 26, 'fixed', 'Пальто шерсть, размер M', 'Носили один сезон.', 14000, 'used', 'Санкт-Петербург', 'uploads/seed/longines.png'],
    [15, 2, 30, 'fixed', 'Книга «Дизайн повседневных вещей»', 'Твёрдый переплёт, без пометок.', 1800, 'used', 'Москва', 'uploads/seed/vinyl.png'],
    [16, 4, 16, 'auction', 'Canon AE-1, рабочий комплект', 'Плёнка, светлый видоискатель, чехол.', 28000, 'used', 'Москва', 'uploads/seed/leica.png'],
    [17, 5, 20, 'auction', 'Honda CB, 1998', 'Классика, заводится с кнопки.', 210000, 'used', 'Казань', 'uploads/seed/speedmaster.png'],
    [18, 6, 32, 'fixed', 'Ремонт винтажной мебели', 'Выезд по городу, реставрация шпона и лака.', 7000, null, 'Санкт-Петербург', 'uploads/seed/wassily.png'],
];

$insListing = $pdo->prepare(
    'INSERT INTO listings (id, user_id, category_id, type, title, description, price, item_condition, city, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, \'active\', DATE_SUB(NOW(), INTERVAL ? DAY), NOW())
     ON DUPLICATE KEY UPDATE title = VALUES(title), category_id = VALUES(category_id), status = \'active\''
);
$insImage = $pdo->prepare('INSERT IGNORE INTO listing_images (listing_id, path, sort_order) VALUES (?, ?, 0)');
$link = $pdo->prepare('INSERT IGNORE INTO listing_categories (listing_id, category_id) VALUES (?, ?)');
$day = 12;
foreach ($listings as $row) {
    $insListing->execute([$row[0], $row[1], $row[2], $row[3], $row[4], $row[5], $row[6], $row[7], $row[8], $day]);
    $insImage->execute([$row[0], $row[9]]);
    foreach (CategoryService::categoryChain((int) $row[2]) as $categoryId) {
        $link->execute([$row[0], $categoryId]);
    }
    $day -= 1;
}

foreach ([2, 7, 10] as $movedId) {
    foreach (CategoryService::categoryChain(16) as $categoryId) {
        $link->execute([$movedId, $categoryId]);
    }
}

$insAuction = $pdo->prepare(
    'INSERT INTO auctions (listing_id, start_price, current_price, min_step, ends_at, created_at)
     VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 DAY), NOW())
     ON DUPLICATE KEY UPDATE current_price = VALUES(current_price)'
);
$insAuction->execute([16, 20000, 28000, 1000]);
$insAuction->execute([17, 180000, 210000, 5000]);

$insReview = $pdo->prepare(
    'INSERT INTO reviews (reviewer_id, reviewed_user_id, listing_id, rating, comment, created_at)
     SELECT ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY)
     WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE reviewer_id = ? AND listing_id = ?)'
);
$reviews = [
    [3, 2, 1, 5, 'Часы соответствуют описанию, продавец на связи.', 20],
    [4, 2, 2, 5, 'Камера приехала в полном комплекте.', 14],
    [5, 2, 11, 4, 'Телефон как на фото, батарея честная.', 8],
    [6, 4, 12, 5, 'Машина ухоженная, сделка спокойная.', 6],
    [3, 5, 13, 4, 'Квартиру показали без спешки, документы на месте.', 4],
    [2, 6, 14, 5, 'Пальто село как надо, упаковано аккуратно.', 3],
];
foreach ($reviews as $review) {
    $insReview->execute([$review[0], $review[1], $review[2], $review[3], $review[4], $review[5], $review[0], $review[2]]);
}

$dialogs = [
    [1, 3, 2, 'Здравствуйте! Seamaster ещё свободен?', 'Да, можем встретиться в субботу.'],
    [11, 5, 2, 'Телефон с коробкой?', 'Коробка и кабель в комплекте.'],
    [12, 6, 4, 'Можно осмотр на выходных?', 'Да, напишу адрес после обеда.'],
    [16, 3, 4, 'Какая минимальная ставка по Canon?', 'Шаг 1000 ₽, сейчас 28 000.'],
];
$find = $pdo->prepare('SELECT id FROM conversations WHERE listing_id = ? AND buyer_id = ?');
$make = $pdo->prepare('INSERT INTO conversations (listing_id, buyer_id, seller_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())');
$msg = $pdo->prepare('INSERT INTO messages (conversation_id, sender_id, body, is_read, created_at) VALUES (?, ?, ?, 1, DATE_SUB(NOW(), INTERVAL ? HOUR))');
foreach ($dialogs as $dialog) {
    $find->execute([$dialog[0], $dialog[1]]);
    $existing = $find->fetch();
    if ($existing) {
        $conversationId = (int) $existing['id'];
    } else {
        $make->execute([$dialog[0], $dialog[1], $dialog[2]]);
        $conversationId = (int) $pdo->lastInsertId();
    }
    $count = $pdo->prepare('SELECT COUNT(*) FROM messages WHERE conversation_id = ?');
    $count->execute([$conversationId]);
    if ((int) $count->fetchColumn() === 0) {
        $msg->execute([$conversationId, $dialog[1], $dialog[3], 5]);
        $msg->execute([$conversationId, $dialog[2], $dialog[4], 4]);
    }
}

echo "seeded\n";
