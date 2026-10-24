-- Чат Torgo. Таблицы уже входят в database/torgo.sql.
-- Этот файл можно выполнить на существующей базе: таблицы не пересоздаются,
-- добавляются только индексы, если их ещё нет.

USE torgo;

CREATE TABLE IF NOT EXISTS conversations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    listing_id INT UNSIGNED NOT NULL,
    buyer_id INT UNSIGNED NOT NULL,
    seller_id INT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY uq_conv_listing_buyer (listing_id, buyer_id),
    KEY idx_conv_buyer (buyer_id, updated_at),
    KEY idx_conv_seller (seller_id, updated_at),
    CONSTRAINT fk_conv_listing FOREIGN KEY (listing_id) REFERENCES listings (id) ON DELETE CASCADE,
    CONSTRAINT fk_conv_buyer FOREIGN KEY (buyer_id) REFERENCES users (id),
    CONSTRAINT fk_conv_seller FOREIGN KEY (seller_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messages (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT UNSIGNED NOT NULL,
    sender_id INT UNSIGNED NOT NULL,
    body TEXT NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    KEY idx_messages_conv (conversation_id, id),
    KEY idx_messages_unread (conversation_id, sender_id, is_read),
    CONSTRAINT fk_messages_conv FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users (id)
) ENGINE=InnoDB;
