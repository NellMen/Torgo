<?php

declare(strict_types=1);

final class HomeController
{
    public static function index(): void
    {
        AuctionService::finalizeEnded(Database::getInstance());

        $auctions = ListingService::catalogQuery(['per_page' => 4, 'page' => 1, 'sort' => 'newest'], 'auction');
        $listings = ListingService::catalogQuery(['per_page' => 4, 'page' => 1, 'sort' => 'newest'], 'fixed');

        $pdo = Database::getInstance();
        foreach ($auctions['items'] as &$item) {
            $stmt = $pdo->prepare('SELECT current_price, ends_at FROM auctions WHERE listing_id = ?');
            $stmt->execute([(int) $item['id']]);
            $a = $stmt->fetch();
            if ($a) {
                $item['price'] = $a['current_price'];
                $item['ends_at'] = $a['ends_at'];
            }
        }
        unset($item);

        Response::success([
            'featured_auctions' => $auctions['items'],
            'featured_listings' => $listings['items'],
            'categories' => CategoryService::getTree(),
        ]);
    }
}
