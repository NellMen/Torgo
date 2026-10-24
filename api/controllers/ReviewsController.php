<?php

declare(strict_types=1);

final class ReviewsController
{
    public static function create(): void
    {
        $user = Auth::requireUser();
        $body = Validator::parseJsonBody();
        $reviewedUserId = Validator::positiveInt($body['user_id'] ?? null);
        $listingId = Validator::positiveInt($body['listing_id'] ?? null);
        $rating = Validator::positiveInt($body['rating'] ?? null);
        $comment = Validator::optionalString($body['comment'] ?? null, 2000) ?? '';

        if ($reviewedUserId === null || $listingId === null || $rating === null || $rating < 1 || $rating > 5) {
            Response::error('validation', 'Некорректные данные отзыва');
            return;
        }
        if ((int) $user['id'] === $reviewedUserId) {
            Response::error('validation', 'Нельзя оставить отзыв самому себе');
            return;
        }

        $pdo = Database::getInstance();
        $lst = $pdo->prepare('SELECT user_id, status FROM listings WHERE id = ?');
        $lst->execute([$listingId]);
        $listing = $lst->fetch();
        if (!$listing || (int) $listing['user_id'] !== $reviewedUserId) {
            Response::error('validation', 'Объявление не принадлежит пользователю');
            return;
        }

        try {
            $pdo->prepare(
                'INSERT INTO reviews (reviewer_id, reviewed_user_id, listing_id, rating, comment, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW())'
            )->execute([(int) $user['id'], $reviewedUserId, $listingId, $rating, $comment]);

            $avg = $pdo->prepare('SELECT AVG(rating) FROM reviews WHERE reviewed_user_id = ?');
            $avg->execute([$reviewedUserId]);
            $pdo->prepare('UPDATE users SET rating_avg = ? WHERE id = ?')
                ->execute([(float) $avg->fetchColumn(), $reviewedUserId]);

            Response::success(null, 'Отзыв добавлен', 201);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                Response::error('conflict', 'Отзыв уже оставлен', 409);
                return;
            }
            throw $e;
        }
    }
}
