<?php

declare(strict_types=1);

final class CategoriesController
{
    public static function index(): void
    {
        Response::success([
            'tree' => CategoryService::getTree(),
        ]);
    }

    public static function attributes(int $categoryId): void
    {
        Response::success([
            'attributes' => CategoryService::getAttributesForCategory($categoryId),
        ]);
    }
}
