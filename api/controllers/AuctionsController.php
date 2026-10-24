<?php

declare(strict_types=1);

final class AuctionsController
{
    public static function index(): void
    {
        $result = AuctionService::catalog($_GET);
        Response::success($result);
    }

    public static function show(int $id): void
    {
        $listing = AuctionService::detail($id);
        if (!$listing) {
            Response::error('not_found', 'Аукцион не найден', 404);
            return;
        }
        FavoritesController::flag($listing, Auth::userId());
        Response::success(['auction' => $listing]);
    }

    public static function bid(int $id): void
    {
        $user = Auth::requireUser();
        $body = Validator::parseJsonBody();
        $amount = Validator::price($body['amount'] ?? null);
        if ($amount === null) {
            Response::error('validation', 'Укажите сумму ставки');
            return;
        }
        try {
            $result = AuctionService::placeBid($id, (int) $user['id'], $amount);
            Response::success($result, 'Ставка принята');
        } catch (InvalidArgumentException $e) {
            Response::error('validation', $e->getMessage());
        }
    }
}
