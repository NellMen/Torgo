<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_once __DIR__ . '/middleware/AdminAuth.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/CategoriesController.php';
require_once __DIR__ . '/controllers/ListingsController.php';
require_once __DIR__ . '/controllers/AuctionsController.php';
require_once __DIR__ . '/controllers/FavoritesController.php';
require_once __DIR__ . '/controllers/MessagesController.php';
require_once __DIR__ . '/controllers/ReviewsController.php';
require_once __DIR__ . '/controllers/UsersController.php';
require_once __DIR__ . '/controllers/HomeController.php';
require_once __DIR__ . '/controllers/NotificationsController.php';
require_once __DIR__ . '/controllers/AdminController.php';
require_once __DIR__ . '/controllers/AdminUsersController.php';
require_once __DIR__ . '/controllers/AdminListingsController.php';
require_once __DIR__ . '/controllers/AdminAuctionsController.php';
require_once __DIR__ . '/controllers/AdminCategoriesController.php';
require_once __DIR__ . '/controllers/AdminAttributesController.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

$base = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/\\');
if ($base !== '' && str_starts_with($uri, $base)) {
    $uri = substr($uri, strlen($base)) ?: '/';
}
$uri = '/' . trim($uri, '/');
if ($uri === '//') {
    $uri = '/';
}

try {
    route($method, $uri);
} catch (Throwable $e) {
    Response::error('server', 'Внутренняя ошибка сервера', 500);
}

function route(string $method, string $uri): void
{
    if ($uri === '/' || $uri === '/home') {
        if ($method === 'GET') {
            HomeController::index();
            return;
        }
    }

    if ($uri === '/auth/register' && $method === 'POST') {
        AuthController::register();
        return;
    }
    if ($uri === '/auth/login' && $method === 'POST') {
        AuthController::login();
        return;
    }
    if ($uri === '/auth/logout' && $method === 'POST') {
        AuthController::logout();
        return;
    }
    if ($uri === '/auth/me' && $method === 'GET') {
        AuthController::me();
        return;
    }
    if ($uri === '/auth/profile' && ($method === 'POST' || $method === 'PUT')) {
        AuthController::updateProfile();
        return;
    }

    if ($uri === '/categories' && $method === 'GET') {
        CategoriesController::index();
        return;
    }
    if (preg_match('#^/categories/(\d+)/attributes$#', $uri, $m) && $method === 'GET') {
        CategoriesController::attributes((int) $m[1]);
        return;
    }

    if ($uri === '/listings' && $method === 'GET') {
        ListingsController::index();
        return;
    }
    if ($uri === '/listings' && $method === 'POST') {
        ListingsController::create();
        return;
    }
    if (preg_match('#^/listings/(\d+)/resubmit$#', $uri, $m) && $method === 'POST') {
        ListingsController::resubmit((int) $m[1]);
        return;
    }
    if (preg_match('#^/listings/(\d+)/close$#', $uri, $m) && $method === 'POST') {
        ListingsController::close((int) $m[1]);
        return;
    }
    if (preg_match('#^/listings/(\d+)$#', $uri, $m)) {
        $id = (int) $m[1];
        if ($method === 'GET') {
            ListingsController::show($id);
            return;
        }
        if ($method === 'PUT' || $method === 'PATCH') {
            ListingsController::update($id);
            return;
        }
        if ($method === 'DELETE') {
            ListingsController::delete($id);
            return;
        }
    }

    if ($uri === '/auctions' && $method === 'GET') {
        AuctionsController::index();
        return;
    }
    if (preg_match('#^/auctions/(\d+)$#', $uri, $m) && $method === 'GET') {
        AuctionsController::show((int) $m[1]);
        return;
    }
    if (preg_match('#^/auctions/(\d+)/bid$#', $uri, $m) && $method === 'POST') {
        AuctionsController::bid((int) $m[1]);
        return;
    }

    if ($uri === '/favorites' && $method === 'GET') {
        FavoritesController::index();
        return;
    }
    if (preg_match('#^/favorites/(\d+)$#', $uri, $m)) {
        if ($method === 'POST') {
            FavoritesController::add((int) $m[1]);
            return;
        }
        if ($method === 'DELETE') {
            FavoritesController::remove((int) $m[1]);
            return;
        }
    }

    if (preg_match('#^/users/(\d+)/public$#', $uri, $m) && $method === 'GET') {
        UsersController::publicProfile((int) $m[1]);
        return;
    }
    if (preg_match('#^/users/(\d+)$#', $uri, $m) && $method === 'GET') {
        UsersController::show((int) $m[1]);
        return;
    }
    if (preg_match('#^/users/me/profile/(active|review|sold|purchased|auctions|reviews)$#', $uri, $m) && $method === 'GET') {
        UsersController::profile($m[1]);
        return;
    }

    if ($uri === '/conversations' && $method === 'GET') {
        MessagesController::conversations();
        return;
    }
    if ($uri === '/conversations' && $method === 'POST') {
        MessagesController::createConversation();
        return;
    }
    if (preg_match('#^/conversations/(\d+)/messages$#', $uri, $m)) {
        $id = (int) $m[1];
        if ($method === 'GET') {
            MessagesController::messages($id);
            return;
        }
        if ($method === 'POST') {
            MessagesController::sendMessage($id);
            return;
        }
    }
    if (preg_match('#^/conversations/(\d+)/read$#', $uri, $m) && ($method === 'PUT' || $method === 'POST')) {
        MessagesController::markRead((int) $m[1]);
        return;
    }

    if ($uri === '/reviews' && $method === 'POST') {
        ReviewsController::create();
        return;
    }

    if ($uri === '/notifications' && $method === 'GET') {
        NotificationsController::index();
        return;
    }
    if ($uri === '/notifications/read' && ($method === 'PUT' || $method === 'POST')) {
        NotificationsController::markRead();
        return;
    }

    if (str_starts_with($uri, '/admin')) {
        AdminAuth::handle(function () use ($method, $uri): void {
            adminRoute($method, $uri);
        });
        return;
    }

    Response::error('not_found', 'Маршрут не найден', 404);
}

function adminRoute(string $method, string $uri): void
{
    if ($uri === '/admin/dashboard' && $method === 'GET') {
        AdminController::dashboard();
        return;
    }

    if ($uri === '/admin/users' && $method === 'GET') {
        AdminUsersController::index();
        return;
    }
    if (preg_match('#^/admin/users/(\d+)/block$#', $uri, $m) && ($method === 'PUT' || $method === 'POST')) {
        AdminUsersController::block((int) $m[1]);
        return;
    }

    if ($uri === '/admin/listings' && $method === 'GET') {
        AdminListingsController::index();
        return;
    }
    if (preg_match('#^/admin/listings/(\d+)$#', $uri, $m) && $method === 'GET') {
        AdminListingsController::show((int) $m[1]);
        return;
    }
    if (preg_match('#^/admin/listings/(\d+)/approve$#', $uri, $m) && ($method === 'PUT' || $method === 'POST')) {
        AdminListingsController::approve((int) $m[1]);
        return;
    }
    if (preg_match('#^/admin/listings/(\d+)/reject$#', $uri, $m) && ($method === 'PUT' || $method === 'POST')) {
        AdminListingsController::reject((int) $m[1]);
        return;
    }
    if (preg_match('#^/admin/listings/(\d+)/block$#', $uri, $m) && ($method === 'PUT' || $method === 'POST')) {
        AdminListingsController::block((int) $m[1]);
        return;
    }

    if ($uri === '/admin/auctions' && $method === 'GET') {
        AdminAuctionsController::index();
        return;
    }
    if (preg_match('#^/admin/auctions/(\d+)$#', $uri, $m) && $method === 'GET') {
        AdminAuctionsController::show((int) $m[1]);
        return;
    }
    if (preg_match('#^/admin/auctions/(\d+)/approve$#', $uri, $m) && ($method === 'PUT' || $method === 'POST')) {
        AdminAuctionsController::approve((int) $m[1]);
        return;
    }
    if (preg_match('#^/admin/auctions/(\d+)/reject$#', $uri, $m) && ($method === 'PUT' || $method === 'POST')) {
        AdminAuctionsController::reject((int) $m[1]);
        return;
    }
    if (preg_match('#^/admin/auctions/(\d+)/block$#', $uri, $m) && ($method === 'PUT' || $method === 'POST')) {
        AdminAuctionsController::block((int) $m[1]);
        return;
    }

    if ($uri === '/admin/categories' && $method === 'GET') {
        AdminCategoriesController::index();
        return;
    }
    if ($uri === '/admin/categories' && $method === 'POST') {
        AdminCategoriesController::create();
        return;
    }
    if (preg_match('#^/admin/categories/(\d+)$#', $uri, $m)) {
        $id = (int) $m[1];
        if ($method === 'PUT' || $method === 'PATCH') {
            AdminCategoriesController::update($id);
            return;
        }
        if ($method === 'DELETE') {
            AdminCategoriesController::delete($id);
            return;
        }
    }

    if ($uri === '/admin/attributes' && $method === 'GET') {
        AdminAttributesController::listAll();
        return;
    }
    if (preg_match('#^/admin/categories/(\d+)/attributes$#', $uri, $m) && $method === 'GET') {
        AdminAttributesController::index((int) $m[1]);
        return;
    }
    if (preg_match('#^/admin/categories/(\d+)/attributes$#', $uri, $m) && $method === 'POST') {
        AdminAttributesController::create((int) $m[1]);
        return;
    }
    if (preg_match('#^/admin/attributes/(\d+)$#', $uri, $m)) {
        $id = (int) $m[1];
        if ($method === 'PUT' || $method === 'PATCH') {
            AdminAttributesController::update($id);
            return;
        }
        if ($method === 'DELETE') {
            AdminAttributesController::delete($id);
            return;
        }
    }

    Response::error('not_found', 'Админ-маршрут не найден', 404);
}
