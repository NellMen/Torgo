# Torgo — маркетплейс + аукционы

Стек: **React 18 + Vite**, **PHP (REST API)**, **MySQL**. Локальный запуск: **OpenServer**.

## Структура проекта

```
cursTorgo/
├── api/                    # PHP REST API
│   ├── index.php           # Роутер
│   ├── config.php          # MySQL, сессии, upload
│   ├── bootstrap.php
│   ├── lib/                # Database, Auth, ListingService, AuctionService…
│   ├── controllers/        # Публичные контроллеры
│   ├── middleware/AdminAuth.php
│   ├── uploads/            # Загруженные фото (+ seed/)
│   └── scripts/set_passwords.php
├── database/torgo.sql      # Схема + тестовые данные
├── public/                 # Сборка React (npm run build)
├── torgo-front/            # Исходники React
└── .htaccess               # Маршрутизация API + SPA
```

## OpenServer: установка

1. **Скопируйте** папку проекта в каталог доменов OpenServer, например:
   `C:\OpenServer\domains\cursTorgo\`

2. **Корень сайта** в настройках домена укажите на **корень проекта** `cursTorgo` (не `public`), чтобы работали правила из `.htaccess`:
   - `/api/*` → `api/index.php`
   - остальное → `public/` (собранный React)

3. **MySQL**
   - Запустите OpenServer → MySQL
   - Откройте phpMyAdmin
   - Импортируйте `database/torgo.sql`

4. **Пароли тестовых пользователей** (после импорта SQL):
   ```bash
   php api/scripts/set_passwords.php
   ```
   - `admin@torgo.ru` / `admin`
   - `seller@test.ru` / `password123`
   - `buyer@test.ru` / `password123`

5. При необходимости поправьте доступ к БД в `api/config.php` (`host`, `user`, `pass`).

6. **Сборка фронтенда** (из папки `torgo-front`):
   ```bash
   npm install
   npm run build
   ```
   Артефакты попадут в `public/`.

7. **Перезапустите** OpenServer (Apache + MySQL).

8. Откройте сайт: `http://cursTorgo/` (или ваш домен).

### Разработка фронтенда

```bash
cd torgo-front
npm run dev
```

В `vite.config.js` прокси `/api` укажите на ваш локальный домен OpenServer, например:

```js
proxy: {
  '/api': { target: 'http://cursTorgo', changeOrigin: true },
}
```

## API (кратко)

Базовый URL: `/api`. Ответы: `{ ok, data, error, message }`. Сессия: cookie `TORGOSESSID`.

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/home` | Главная: featured + категории |
| POST | `/auth/register`, `/auth/login`, `/auth/logout` | Аутентификация |
| GET | `/auth/me` | Текущий пользователь |
| GET | `/categories` | Дерево категорий |
| GET | `/listings`, `/auctions` | Каталоги с фильтрами |
| GET/POST | `/listings`, `/listings/:id` | Объявления |
| GET/POST | `/auctions/:id`, `/auctions/:id/bid` | Аукционы и ставки |
| GET/POST/DELETE | `/favorites/:id` | Избранное |
| GET/POST | `/conversations`, `/conversations/:id/messages` | Чат |
| GET | `/users/me/profile/:tab` | Профиль |
| GET/POST | `/admin/*` | Админ-панель (роль admin) |

Фильтр категорий: если выбраны родитель и ребёнок — родитель игнорируется (логика в `CategoryService::resolveCategoryFilter`).

Аукционы: ставка в последние 5 минут продлевает `ends_at` на 5 минут; завершённые аукционы финализируются при чтении каталога/лота.

## Роли

- **Гость** — просмотр каталогов и карточек
- **Пользователь** — объявления, ставки, чат, избранное, отзывы
- **Администратор** — `/admin` (дашборд, пользователи, модерация, категории, атрибуты)
