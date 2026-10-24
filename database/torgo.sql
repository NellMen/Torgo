-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: torgo
-- ------------------------------------------------------
-- Server version	8.0.30

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auctions`
--

DROP TABLE IF EXISTS `auctions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auctions` (
  `listing_id` int unsigned NOT NULL,
  `start_price` decimal(12,2) NOT NULL,
  `current_price` decimal(12,2) NOT NULL,
  `min_step` decimal(12,2) NOT NULL,
  `ends_at` datetime NOT NULL,
  `extend_count` int NOT NULL DEFAULT '0',
  `winner_user_id` int unsigned DEFAULT NULL,
  `finalized_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`listing_id`),
  KEY `idx_auctions_ends` (`ends_at`,`finalized_at`),
  KEY `fk_auctions_winner` (`winner_user_id`),
  CONSTRAINT `fk_auctions_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_auctions_winner` FOREIGN KEY (`winner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auctions`
--

LOCK TABLES `auctions` WRITE;
/*!40000 ALTER TABLE `auctions` DISABLE KEYS */;
INSERT INTO `auctions` VALUES (5,1200000.00,1240000.00,10000.00,'2026-10-26 19:32:32',0,NULL,NULL,'2026-10-23 19:32:32'),(6,15000.00,18500.00,500.00,'2026-10-25 19:32:32',0,NULL,NULL,'2026-10-23 19:32:32'),(7,280000.00,289000.00,5000.00,'2026-10-27 19:32:32',0,NULL,NULL,'2026-10-23 19:32:32'),(8,90000.00,110000.00,2000.00,'2026-10-24 19:32:32',0,NULL,NULL,'2026-10-23 19:32:32'),(16,20000.00,28000.00,1000.00,'2026-10-28 22:58:02',0,NULL,NULL,'2026-10-23 22:58:02'),(17,180000.00,210000.00,5000.00,'2026-10-28 22:58:02',0,NULL,NULL,'2026-10-23 22:58:02');
/*!40000 ALTER TABLE `auctions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bids`
--

DROP TABLE IF EXISTS `bids`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bids` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `listing_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bids_listing` (`listing_id`,`amount`),
  KEY `fk_bids_user` (`user_id`),
  CONSTRAINT `fk_bids_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bids_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bids`
--

LOCK TABLES `bids` WRITE;
/*!40000 ALTER TABLE `bids` DISABLE KEYS */;
INSERT INTO `bids` VALUES (1,5,3,1220000.00,'2026-10-23 17:32:32'),(2,5,3,1240000.00,'2026-10-23 18:32:32'),(3,6,3,18500.00,'2026-10-23 19:02:32'),(4,8,4,98000.00,'2026-10-23 19:41:11'),(5,8,4,100000.00,'2026-10-23 19:41:13'),(6,8,4,102000.00,'2026-10-23 19:41:15'),(7,8,4,104000.00,'2026-10-23 19:41:16'),(8,8,4,106000.00,'2026-10-23 19:41:17'),(9,8,4,108000.00,'2026-10-23 19:41:20'),(10,8,4,110000.00,'2026-10-23 19:41:22');
/*!40000 ALTER TABLE `bids` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` int unsigned DEFAULT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_slug` (`slug`),
  KEY `idx_categories_parent` (`parent_id`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,NULL,'Электроника','electronics',1),(2,NULL,'Авто','auto',2),(3,NULL,'Недвижимость','realty',3),(4,NULL,'Мода','fashion',4),(5,NULL,'Дом','home',5),(6,NULL,'Хобби','hobby',6),(7,NULL,'Услуги','services',7),(9,1,'Аудио','audio',2),(10,4,'Часы','watches',1),(11,5,'Мебель','furniture',1),(12,5,'Освещение','lighting',2),(13,6,'Винил и пластинки','vinyl',1),(14,1,'Смартфоны','smartphones',3),(15,1,'Ноутбуки','laptops',4),(16,1,'Фотоаппараты','cameras',5),(17,1,'Объективы','lenses',6),(18,1,'Видеокамеры','video-cameras',7),(19,2,'Легковые','cars',1),(20,2,'Мотоциклы','moto',2),(21,2,'Запчасти','auto-parts',3),(22,3,'Квартиры','flats',1),(23,3,'Дома','houses',2),(24,3,'Коммерческая','commercial',3),(25,3,'Участки','land',4),(26,4,'Одежда','clothes',2),(27,4,'Обувь','shoes',3),(28,4,'Сумки','bags',4),(29,5,'Текстиль','textile',3),(30,6,'Книги','books',2),(31,6,'Настольные игры','board-games',3),(32,7,'Ремонт','repair',1),(33,7,'Обучение','teaching',2),(34,7,'Доставка','delivery',3),(35,9,'Микрофоны','микрофоны',0);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_attributes`
--

DROP TABLE IF EXISTS `category_attributes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category_attributes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `category_id` int unsigned NOT NULL COMMENT 'Родитель или дочерняя категория',
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('text','number','select') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `options_json` json DEFAULT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_attr_category` (`category_id`),
  CONSTRAINT `fk_attr_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=139 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_attributes`
--

LOCK TABLES `category_attributes` WRITE;
/*!40000 ALTER TABLE `category_attributes` DISABLE KEYS */;
INSERT INTO `category_attributes` VALUES (1,10,'Бренд','text',NULL,1,1),(2,10,'Год выпуска','number',NULL,0,2),(3,10,'Механизм','select','[\"Кварцевый\", \"Механический\", \"Автомат\"]',0,3),(4,16,'Бренд','text',NULL,1,1),(5,16,'Комплектация','text',NULL,0,2),(6,13,'Исполнитель','text',NULL,1,1),(7,13,'Пресс','text',NULL,0,2),(8,11,'Стиль','text',NULL,0,1),(9,12,'Страна','text',NULL,0,1),(10,1,'Бренд','text',NULL,1,1),(12,4,'Бренд','text',NULL,1,1),(13,4,'Размер','text',NULL,0,2),(15,5,'Гарантия','text',NULL,0,2),(16,6,'Бренд','text',NULL,0,1),(18,16,'Тип','select','[\"Фотоаппарат\", \"Объектив\", \"Видеокамера\"]',0,3),(19,16,'Матрица','text',NULL,0,4),(20,16,'Байонет','text',NULL,0,5),(21,9,'Тип','select','[\"Колонки\", \"Наушники\", \"Усилитель\"]',0,1),(22,9,'Мощность','text',NULL,0,2),(23,9,'Сопротивление','text',NULL,0,3),(24,9,'Интерфейс','select','[\"Проводной\", \"Bluetooth\", \"USB\"]',0,4),(25,9,'Цвет','text',NULL,0,5),(26,10,'Диаметр корпуса','text',NULL,0,4),(27,10,'Материал корпуса','text',NULL,0,5),(28,11,'Материал','text',NULL,0,2),(29,11,'Цвет','text',NULL,0,3),(30,11,'Ширина, см','number',NULL,0,4),(31,11,'Высота, см','number',NULL,0,5),(32,12,'Тип','select','[\"Настольная\", \"Торшер\", \"Люстра\", \"Бра\"]',0,2),(33,12,'Материал','text',NULL,0,3),(34,12,'Мощность','text',NULL,0,4),(35,12,'Цвет','text',NULL,0,5),(36,13,'Год','number',NULL,0,3),(37,13,'Жанр','text',NULL,0,4),(38,13,'Состояние носителя','select','[\"Mint\", \"Near Mint\", \"Very Good\", \"Good\"]',0,5),(39,14,'Объем памяти','select','[\"64 ГБ\", \"128 ГБ\", \"256 ГБ\", \"512 ГБ\"]',1,1),(40,14,'Диагональ экрана','text',NULL,0,2),(41,14,'Оперативная память','select','[\"4 ГБ\", \"6 ГБ\", \"8 ГБ\", \"12 ГБ\"]',0,3),(42,14,'Аккумулятор','text',NULL,0,4),(43,14,'Операционная система','select','[\"Android\", \"iOS\"]',0,5),(44,15,'Диагональ экрана','text',NULL,0,1),(45,15,'Оперативная память','select','[\"8 ГБ\", \"16 ГБ\", \"32 ГБ\"]',0,2),(46,15,'Накопитель','text',NULL,0,3),(47,15,'Процессор','text',NULL,0,4),(48,15,'Видеокарта','text',NULL,0,5),(49,17,'Байонет','text',NULL,1,1),(50,17,'Фокусное расстояние','text',NULL,1,2),(51,17,'Диафрагма','text',NULL,1,3),(52,17,'Тип','select','[\"Фикс\", \"Зум\"]',1,4),(53,17,'Стабилизация','select','[\"Есть\", \"Нет\"]',1,5),(54,18,'Матрица','text',NULL,1,1),(55,18,'Разрешение','text',NULL,1,2),(56,18,'Стабилизация','select','[\"Оптическая\", \"Электронная\", \"Нет\"]',1,3),(57,18,'Носитель','text',NULL,1,4),(58,18,'Комплектация','text',NULL,1,5),(59,19,'Марка','text',NULL,1,1),(60,19,'Модель','text',NULL,1,2),(61,19,'Год','number',NULL,1,3),(62,19,'Пробег, км','number',NULL,1,4),(63,19,'Коробка','select','[\"Механика\", \"Автомат\", \"Робот\"]',1,5),(64,20,'Марка','text',NULL,1,1),(65,20,'Объём двигателя','text',NULL,1,2),(66,20,'Год','number',NULL,1,3),(67,20,'Пробег, км','number',NULL,1,4),(68,20,'Тип','select','[\"Спорт\", \"Классика\", \"Туризм\"]',1,5),(69,21,'Марка авто','text',NULL,1,1),(70,21,'Деталь','text',NULL,1,2),(71,21,'Оригинал','select','[\"Да\", \"Нет\"]',1,3),(72,21,'Совместимость','text',NULL,1,4),(73,21,'Артикул','text',NULL,1,5),(74,22,'Комнат','number',NULL,1,1),(75,22,'Площадь, м²','number',NULL,1,2),(76,22,'Этаж','number',NULL,1,3),(77,22,'Этажей в доме','number',NULL,1,4),(78,22,'Ремонт','select','[\"Без ремонта\", \"Косметический\", \"Евро\"]',1,5),(79,23,'Площадь, м²','number',NULL,1,1),(80,23,'Участок, соток','number',NULL,1,2),(81,23,'Этажей','number',NULL,1,3),(82,23,'Материал стен','text',NULL,1,4),(83,23,'Коммуникации','text',NULL,1,5),(84,24,'Площадь, м²','number',NULL,1,1),(85,24,'Назначение','text',NULL,1,2),(86,24,'Этаж','text',NULL,1,3),(87,24,'Класс','text',NULL,1,4),(88,24,'Парковка','select','[\"Есть\", \"Нет\"]',1,5),(89,25,'Площадь, соток','number',NULL,1,1),(90,25,'Категория земли','text',NULL,1,2),(91,25,'Коммуникации','text',NULL,1,3),(92,25,'Подъезд','text',NULL,1,4),(93,25,'Рельеф','text',NULL,1,5),(94,26,'Размер','text',NULL,1,1),(95,26,'Бренд','text',NULL,1,2),(96,26,'Материал','text',NULL,1,3),(97,26,'Сезон','select','[\"Лето\", \"Зима\", \"Демисезон\"]',1,4),(98,26,'Цвет','text',NULL,1,5),(99,27,'Размер','text',NULL,1,1),(100,27,'Бренд','text',NULL,1,2),(101,27,'Материал','text',NULL,1,3),(102,27,'Сезон','select','[\"Лето\", \"Зима\", \"Демисезон\"]',1,4),(103,27,'Цвет','text',NULL,1,5),(104,28,'Бренд','text',NULL,1,1),(105,28,'Материал','text',NULL,1,2),(106,28,'Цвет','text',NULL,1,3),(107,28,'Размер','text',NULL,1,4),(108,28,'Фурнитура','text',NULL,1,5),(109,29,'Материал','text',NULL,1,1),(110,29,'Размер','text',NULL,1,2),(111,29,'Цвет','text',NULL,1,3),(112,29,'Состав','text',NULL,1,4),(113,29,'Страна','text',NULL,1,5),(114,30,'Автор','text',NULL,1,1),(115,30,'Год','number',NULL,1,2),(116,30,'Издательство','text',NULL,1,3),(117,30,'Переплёт','select','[\"Твёрдый\", \"Мягкий\"]',1,4),(118,30,'Язык','text',NULL,1,5),(119,31,'Издатель','text',NULL,1,1),(120,31,'Жанр','text',NULL,1,2),(121,31,'Игроков','text',NULL,1,3),(122,31,'Возраст','text',NULL,1,4),(123,31,'Язык','text',NULL,1,5),(124,32,'Вид работ','text',NULL,1,1),(125,32,'Опыт, лет','number',NULL,1,2),(126,32,'Выезд','select','[\"Да\", \"Нет\"]',1,3),(127,32,'Гарантия','text',NULL,1,4),(128,32,'Срок','text',NULL,1,5),(129,33,'Направление','text',NULL,1,1),(130,33,'Формат','select','[\"Очно\", \"Онлайн\"]',1,2),(131,33,'Длительность','text',NULL,1,3),(132,33,'Уровень','text',NULL,1,4),(133,33,'Язык','text',NULL,1,5),(134,34,'Тип груза','text',NULL,1,1),(135,34,'Откуда','text',NULL,1,2),(136,34,'Куда','text',NULL,1,3),(137,34,'Срок','text',NULL,1,4),(138,34,'Страхование','select','[\"Есть\", \"Нет\"]',1,5);
/*!40000 ALTER TABLE `category_attributes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `listing_id` int unsigned NOT NULL,
  `buyer_id` int unsigned NOT NULL,
  `seller_id` int unsigned NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_conv_listing_buyer` (`listing_id`,`buyer_id`),
  KEY `idx_conv_buyer_updated` (`buyer_id`,`updated_at`),
  KEY `idx_conv_seller_updated` (`seller_id`,`updated_at`),
  CONSTRAINT `fk_conv_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_conv_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conv_seller` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
INSERT INTO `conversations` VALUES (1,1,3,2,'2026-10-22 19:32:32','2026-10-23 19:32:32'),(2,11,5,2,'2026-10-23 22:58:02','2026-10-23 22:58:02'),(3,12,6,4,'2026-10-23 22:58:02','2026-10-23 22:58:02'),(4,16,3,4,'2026-10-23 22:58:02','2026-10-23 22:58:02'),(5,4,4,2,'2026-10-24 14:20:53','2026-10-24 14:20:53'),(6,18,2,6,'2026-10-24 16:25:28','2026-10-24 16:25:28'),(7,2,6,2,'2026-10-24 16:27:10','2026-10-24 16:27:10');
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorites` (
  `user_id` int unsigned NOT NULL,
  `listing_id` int unsigned NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`user_id`,`listing_id`),
  KEY `fk_fav_listing` (`listing_id`),
  CONSTRAINT `fk_fav_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fav_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorites`
--

LOCK TABLES `favorites` WRITE;
/*!40000 ALTER TABLE `favorites` DISABLE KEYS */;
INSERT INTO `favorites` VALUES (3,1,'2026-10-23 19:32:32'),(3,5,'2026-10-23 19:32:32'),(4,4,'2026-10-24 14:32:00');
/*!40000 ALTER TABLE `favorites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `listing_attribute_values`
--

DROP TABLE IF EXISTS `listing_attribute_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listing_attribute_values` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `listing_id` int unsigned NOT NULL,
  `attribute_id` int unsigned NOT NULL,
  `value` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_listing_attr` (`listing_id`,`attribute_id`),
  KEY `fk_lav_attr` (`attribute_id`),
  CONSTRAINT `fk_lav_attr` FOREIGN KEY (`attribute_id`) REFERENCES `category_attributes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lav_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listing_attribute_values`
--

LOCK TABLES `listing_attribute_values` WRITE;
/*!40000 ALTER TABLE `listing_attribute_values` DISABLE KEYS */;
INSERT INTO `listing_attribute_values` VALUES (1,1,1,'Omega'),(2,1,2,'1968'),(3,1,3,'Механический'),(4,2,4,'Nikon'),(5,2,5,'Объектив 50 mm'),(6,3,1,'Longines'),(7,3,2,'1958'),(8,4,9,'Дания'),(9,5,1,'Omega'),(10,5,2,'1967'),(11,6,6,'Кино'),(12,6,7,'Первый пресс'),(13,7,4,'Leica'),(14,7,5,'Полный комплект'),(15,8,8,'Bauhaus'),(16,10,4,'ыфвпфывп'),(18,10,5,'фывафыва'),(19,10,18,'Фотоаппарат'),(20,10,19,'аыфвафыва'),(21,10,20,'ыфвафыавфыва');
/*!40000 ALTER TABLE `listing_attribute_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `listing_categories`
--

DROP TABLE IF EXISTS `listing_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listing_categories` (
  `listing_id` int unsigned NOT NULL,
  `category_id` int unsigned NOT NULL,
  PRIMARY KEY (`listing_id`,`category_id`),
  KEY `idx_lc_category` (`category_id`),
  CONSTRAINT `fk_lc_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `fk_lc_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listing_categories`
--

LOCK TABLES `listing_categories` WRITE;
/*!40000 ALTER TABLE `listing_categories` DISABLE KEYS */;
INSERT INTO `listing_categories` VALUES (2,1),(7,1),(10,1),(11,1),(16,1),(12,2),(17,2),(13,3),(14,4),(15,6),(11,14),(2,16),(7,16),(10,16),(16,16),(12,19),(17,20),(13,22),(14,26),(15,30);
/*!40000 ALTER TABLE `listing_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `listing_images`
--

DROP TABLE IF EXISTS `listing_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listing_images` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `listing_id` int unsigned NOT NULL,
  `path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_images_listing` (`listing_id`),
  CONSTRAINT `fk_images_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listing_images`
--

LOCK TABLES `listing_images` WRITE;
/*!40000 ALTER TABLE `listing_images` DISABLE KEYS */;
INSERT INTO `listing_images` VALUES (1,1,'uploads/seed/seamaster.png',0),(2,2,'uploads/seed/nikon.png',0),(3,3,'uploads/seed/longines.png',0),(4,4,'uploads/seed/lamp.png',0),(5,5,'uploads/seed/speedmaster.png',0),(6,6,'uploads/seed/vinyl.png',0),(7,7,'uploads/seed/leica.png',0),(8,8,'uploads/seed/wassily.png',0),(9,10,'uploads/9001bbdef9f921d4515df811a93b1492.png',0),(10,10,'uploads/ff71a587b05ef8e96ce6de4ecf46097e.png',1),(11,10,'uploads/3cb869b266706e81daece7e24da2469e.png',2),(12,10,'uploads/e079373b362410330d3a7d64daa31e56.png',3),(13,10,'uploads/e67e32af54f1dfb83a9f9cade8063b49.png',4),(14,11,'uploads/seed/nikon.png',0),(15,12,'uploads/seed/lamp.png',0),(16,13,'uploads/seed/wassily.png',0),(17,14,'uploads/seed/longines.png',0),(18,15,'uploads/seed/vinyl.png',0),(19,16,'uploads/seed/leica.png',0),(20,17,'uploads/seed/speedmaster.png',0);
/*!40000 ALTER TABLE `listing_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `listings`
--

DROP TABLE IF EXISTS `listings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `category_id` int unsigned NOT NULL,
  `type` enum('fixed','auction') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `item_condition` enum('new','used') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','active','rejected','sold','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `moderation_note` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_listings_catalog` (`type`,`status`,`category_id`,`city`,`price`),
  KEY `idx_listings_user` (`user_id`),
  KEY `fk_listings_category` (`category_id`),
  CONSTRAINT `fk_listings_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `fk_listings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listings`
--

LOCK TABLES `listings` WRITE;
/*!40000 ALTER TABLE `listings` DISABLE KEYS */;
INSERT INTO `listings` VALUES (1,2,10,'fixed','Omega Seamaster 300, 1968','Легендарные часы Omega Seamaster 300 1968 года. Оригинальный циферблат, сервисный паспорт, коробка.',245000.00,'used','Москва','active',NULL,'2026-10-18 19:32:32','2026-10-23 19:32:32'),(2,2,16,'fixed','Nikon F3 HP, объектив 50 мм','Культовая камера Nikon F3 HP в отличном состоянии, объектив Nikkor 50mm f/1.4.',72000.00,'used','Екатеринбург','active',NULL,'2026-10-19 19:32:32','2026-10-23 19:32:32'),(3,2,10,'fixed','Longines Heritage, 1958','Longines Heritage 1958 — редкий винтажный экземпляр с сохранившимся механизмом.',112000.00,'used','Москва','active',NULL,'2026-10-20 19:32:32','2026-10-23 19:32:32'),(4,2,12,'fixed','Настольная лампа, Дания, 1960-е','Датская настольная лампа 1960-х, латунь и матовое стекло, реставрация проводки.',34900.00,'used','Москва','active',NULL,'2026-10-21 19:32:32','2026-10-23 19:32:32'),(5,2,10,'auction','Omega Speedmaster Professional, 1967','Omega Speedmaster Professional 1967 — хронограф NASA, коллекционное состояние, полный комплект.',1240000.00,'used','Москва','active',NULL,'2026-10-17 19:32:32','2026-10-23 19:32:32'),(6,2,13,'auction','Винил «Группа крови», первый пресс','Первый пресс альбома «Группа крови», оригинальная обложка, минимальные следы использования.',18500.00,'used','Москва','active',NULL,'2026-10-18 19:32:32','2026-10-23 19:32:32'),(7,2,16,'auction','Leica M6 Classic, полный комплект','Leica M6 Classic с объективом Summicron 35mm, футляр, документы, обслуживание у официала.',289000.00,'used','Санкт-Петербург','active',NULL,'2026-10-19 19:32:32','2026-10-23 19:32:32'),(8,2,11,'auction','Кресло Wassily B3, Bauhaus','Кресло Wassily B3 в духе Bauhaus, хром и кожа, подлинная patina 1970-х.',110000.00,'used','Казань','active',NULL,'2026-10-20 19:32:32','2026-10-23 19:41:22'),(9,2,10,'auction','Rolex Submariner — на модерации','Тестовый лот для панели модерации.',500000.00,'used','Москва','pending',NULL,'2026-10-23 19:32:32','2026-10-23 19:32:32'),(10,4,16,'fixed','авы','фпвпаывапывап',1998.00,'used','Казань','archived','мя','2026-10-23 21:22:38','2026-10-24 15:29:20'),(11,2,14,'fixed','iPhone 13, 128 ГБ','Смартфон в комплекте, батарея 89%.',52000.00,'used','Москва','active',NULL,'2026-10-11 22:58:02','2026-10-23 22:58:02'),(12,4,19,'fixed','Volkswagen Golf, 2016','Один владелец, сервисная книжка.',890000.00,'used','Москва','active',NULL,'2026-10-12 22:58:02','2026-10-23 22:58:02'),(13,5,22,'fixed','Двушка у метро, 54 м²','Кухня-гостиная, балкон, светлая сторона.',9800000.00,NULL,'Казань','active',NULL,'2026-10-13 22:58:02','2026-10-23 22:58:02'),(14,6,26,'fixed','Пальто шерсть, размер M','Носили один сезон.',14000.00,'used','Санкт-Петербург','active',NULL,'2026-10-14 22:58:02','2026-10-23 22:58:02'),(15,2,30,'fixed','Книга «Дизайн повседневных вещей»','Твёрдый переплёт, без пометок.',1800.00,'used','Москва','active',NULL,'2026-10-15 22:58:02','2026-10-23 22:58:02'),(16,4,16,'auction','Canon AE-1, рабочий комплект','Плёнка, светлый видоискатель, чехол.',28000.00,'used','Москва','active',NULL,'2026-10-16 22:58:02','2026-10-23 22:58:02'),(17,5,20,'auction','Honda CB, 1998','Классика, заводится с кнопки.',210000.00,'used','Казань','active',NULL,'2026-10-17 22:58:02','2026-10-23 22:58:02'),(18,6,32,'fixed','Ремонт винтажной мебели','',7000.00,NULL,'Санкт-Петербург','sold',NULL,'2026-10-18 22:58:02','2026-10-24 16:28:24');
/*!40000 ALTER TABLE `listings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `conversation_id` int unsigned NOT NULL,
  `sender_id` int unsigned NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_messages_conv` (`conversation_id`,`id`),
  KEY `fk_messages_sender` (`sender_id`),
  KEY `idx_messages_unread` (`conversation_id`,`sender_id`,`is_read`),
  CONSTRAINT `fk_messages_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,1,3,'Здравствуйте! Интересуют часы Seamaster — возможен осмотр в Москве?',1,'2026-10-22 20:32:32'),(2,1,2,'Добрый день! Да, можно встретиться на выходных.',0,'2026-10-22 21:32:32'),(3,2,5,'Телефон с коробкой?',1,'2026-10-23 17:58:02'),(4,2,2,'Коробка и кабель в комплекте.',1,'2026-10-23 18:58:02'),(5,3,6,'Можно осмотр на выходных?',1,'2026-10-23 17:58:02'),(6,3,4,'Да, напишу адрес после обеда.',1,'2026-10-23 18:58:02'),(7,4,3,'Какая минимальная ставка по Canon?',1,'2026-10-23 17:58:02'),(8,4,4,'Шаг 1000 ₽, сейчас 28 000.',1,'2026-10-23 18:58:02');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`,`is_read`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,2,'new_bid','Новая ставка','Лот #5: 1240000',0,'2026-10-23 19:32:32'),(2,3,'message','Новое сообщение','Ответ по объявлению Seamaster',0,'2026-10-23 19:32:32'),(3,2,'new_bid','Новая ставка','Лот #8: 98000',0,'2026-10-23 19:41:11'),(4,2,'new_bid','Новая ставка','Лот #8: 100000',0,'2026-10-23 19:41:13'),(5,2,'new_bid','Новая ставка','Лот #8: 102000',0,'2026-10-23 19:41:15'),(6,2,'new_bid','Новая ставка','Лот #8: 104000',0,'2026-10-23 19:41:16'),(7,2,'new_bid','Новая ставка','Лот #8: 106000',0,'2026-10-23 19:41:17'),(8,2,'new_bid','Новая ставка','Лот #8: 108000',0,'2026-10-23 19:41:20'),(9,2,'new_bid','Новая ставка','Лот #8: 110000',0,'2026-10-23 19:41:22');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `listing_id` int unsigned NOT NULL,
  `buyer_id` int unsigned NOT NULL,
  `status` enum('pending','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_orders_buyer` (`buyer_id`),
  KEY `fk_orders_listing` (`listing_id`),
  CONSTRAINT `fk_orders_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_orders_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,4,3,'completed','2026-10-03 19:32:32');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `reviewer_id` int unsigned NOT NULL,
  `reviewed_user_id` int unsigned NOT NULL,
  `listing_id` int unsigned NOT NULL,
  `rating` tinyint unsigned NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_review_once` (`reviewer_id`,`listing_id`),
  KEY `fk_reviews_reviewed` (`reviewed_user_id`),
  KEY `fk_reviews_listing` (`listing_id`),
  CONSTRAINT `fk_reviews_listing` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`),
  CONSTRAINT `fk_reviews_reviewed` FOREIGN KEY (`reviewed_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_reviews_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,3,2,1,5,'Отличный продавец, часы как в описании.','2026-10-13 19:32:32'),(2,4,2,2,5,'Камера приехала в полном комплекте.','2026-10-09 22:58:02'),(3,5,2,11,4,'Телефон как на фото, батарея честная.','2026-10-15 22:58:02'),(4,6,4,12,5,'Машина ухоженная, сделка спокойная.','2026-10-17 22:58:02'),(5,3,5,13,4,'Квартиру показали без спешки, документы на месте.','2026-10-19 22:58:02'),(6,2,6,14,5,'Пальто село как надо, упаковано аккуратно.','2026-10-20 22:58:02');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('user','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `is_blocked` tinyint(1) NOT NULL DEFAULT '0',
  `rating_avg` decimal(3,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin@torgo.ru',NULL,'$2y$10$c8A6cym9ymv4J0NQe/otweT2pNej4rfYqUygTM5SOW.Hk6epGOBAC','Администратор Торго','Москва',NULL,'admin',0,5.00,'2026-10-23 19:32:31'),(2,'seller@test.ru','+79001234567','$2y$10$pEIPkVCSZFMYtIiCFX95oeV84URKD/VfsD3ZnWo3zqbb1tU2eF8ZK','Иван Продавцов','Москва',NULL,'user',0,4.80,'2026-10-23 19:32:31'),(3,'buyer@test.ru',NULL,'$2y$10$wYD/xiGKW65ORZuuAxzDVeDK66zyfpAhEQ0pJAc5wU.GaRkCHkHUa','Мария Покупатель','Санкт-Петербург',NULL,'user',0,4.50,'2026-10-23 19:32:31'),(4,'khanker@list.ru','79372822218','$2y$10$dsdYsFU50cjpDUbPmvn8BuYPEwwfpvyIafC2n5uGeXHalihlSNfpW','Елена Крылова','Казань','uploads/cbb1ad84af608239285e3af508b5dad1.png','user',0,0.00,'2026-10-23 19:41:05'),(5,'qw@mail.ru',NULL,'$2y$10$hE2CyeGKxF2rhS13rneFdejdNkRXFYX1czO5mzTM0JTVLeofEeJbO','Дмитрий Волков','',NULL,'user',0,0.00,'2026-10-23 21:22:54'),(6,'admin@mail.ru',NULL,'$2y$10$.NqxMyfeSr5eWxWumoEodOiJJ/7zTFcwE9fadlt3WsBLPnEeO3Fz.','Анна Белова','',NULL,'admin',0,0.00,'2026-10-23 21:23:53');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'torgo'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-24 17:06:22
