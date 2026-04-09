-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Mar 26, 2026 at 01:55 AM
-- Server version: 8.0.45
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `payxpress`
--

-- --------------------------------------------------------

--
-- Table structure for table `auth_otps`
--

CREATE TABLE `auth_otps` (
  `id` bigint UNSIGNED NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purpose` enum('signup','reset') COLLATE utf8mb4_unicode_ci NOT NULL,
  `otp_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload_json` json DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auth_sessions`
--

CREATE TABLE `auth_sessions` (
  `id` bigint UNSIGNED NOT NULL,
  `user_uuid` varchar(64) NOT NULL,
  `token_hash` char(64) NOT NULL,
  `issued_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contact_enquiries`
--

CREATE TABLE `contact_enquiries` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `subject` varchar(150) DEFAULT NULL,
  `message` text NOT NULL,
  `status` enum('new','reviewed','closed') NOT NULL DEFAULT 'new',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int UNSIGNED NOT NULL,
  `slug` varchar(180) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `tag` varchar(100) NOT NULL,
  `price_label` varchar(50) NOT NULL,
  `image` varchar(255) NOT NULL,
  `overview` text NOT NULL,
  `short_note` varchar(255) NOT NULL,
  `full_description` text NOT NULL,
  `screenshots` json NOT NULL,
  `features` json NOT NULL,
  `cart_limit` int NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `cart_items_json` json DEFAULT NULL,
  `order_history` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `auth_otps`
--
ALTER TABLE `auth_otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_auth_otps_lookup` (`email`,`purpose`,`otp_hash`),
  ADD KEY `idx_auth_otps_expiry` (`expires_at`),
  ADD KEY `idx_auth_otps_used` (`used_at`);

--
-- Indexes for table `auth_sessions`
--
ALTER TABLE `auth_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ux_auth_sessions_token_hash` (`token_hash`),
  ADD KEY `idx_auth_sessions_user_uuid` (`user_uuid`),
  ADD KEY `idx_auth_sessions_expires_at` (`expires_at`);

--
-- Indexes for table `contact_enquiries`
--
ALTER TABLE `contact_enquiries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contact_email` (`email`),
  ADD KEY `idx_contact_status` (`status`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_products_slug` (`slug`);

--
-- Custom Support Add-on product seed
-- Price label is ₹0 because the actual price is computed dynamically in the cart.
-- The computed price (10% of cart subtotal) is stored only inside cart_items_json.
--
INSERT INTO `products`
  (`slug`, `title`, `description`, `tag`, `price_label`, `image`, `overview`, `short_note`, `full_description`, `screenshots`, `features`, `cart_limit`, `sort_order`, `is_active`)
VALUES
  (
    'custom-support',
    'Custom Support Add-on',
    'Get personalized support tailored to your selected products. Price is automatically calculated based on your cart.',
    'Support',
    '₹0',
    'public/uploads/custom.png',
    'Enhance your purchase with our Custom Support Add-on. Pricing is automatically calculated as 10% of your cart subtotal, ensuring you only pay for the level of support required for your selected solutions.',
    'Personalized support calculated dynamically based on your order.',
    'Whether you need setup assistance, customization, or technical guidance, our team will provide tailored support specific to your order. The price of this add-on is dynamically calculated based on the products added to your cart.\n\nDisclaimer: The price of Custom Support is dynamically calculated based on the products added to your cart. The final support cost may vary depending on the complexity, customization requirements, and scope of selected items. By adding this service, you agree that the pricing is system-generated and reflects the level of support required for your order.',
    '["public/uploads/custom.png"]',
    '["Dynamic pricing based on selected products","Personalized assistance","Faster setup & integration help","Dedicated technical guidance"]',
    1,
    9999,
    1
  );

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_uuid` (`uuid`),
  ADD UNIQUE KEY `uq_users_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `auth_otps`
--
ALTER TABLE `auth_otps`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auth_sessions`
--
ALTER TABLE `auth_sessions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `contact_enquiries`
--
ALTER TABLE `contact_enquiries`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- ============================================================
-- ADDITIVE MIGRATIONS (safe to run on live DB — no breaking changes)
-- ============================================================

-- 1. Proof-of-Delivery: delivery_logs
--    Records every payment-success and file-download event.
--    Used as POD evidence for the payment gateway.
-- ============================================================
CREATE TABLE IF NOT EXISTS `delivery_logs` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_uuid` varchar(64) NOT NULL,
  `user_email` varchar(255) NOT NULL DEFAULT '',
  `event_type` enum('payment_success','download') NOT NULL,
  `order_id` varchar(180) DEFAULT NULL,
  `invoice_id` varchar(180) DEFAULT NULL,
  `transaction_id` varchar(180) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'delivered',
  `items_json` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_delivery_logs_user` (`user_uuid`),
  KEY `idx_delivery_logs_order` (`order_id`),
  KEY `idx_delivery_logs_txn` (`transaction_id`),
  KEY `idx_delivery_logs_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Proof-of-Delivery: pod_agreements
--    Stores the checkout T&C acknowledgment (user agrees that
--    downloading the asset equals completed delivery).
-- ============================================================
CREATE TABLE IF NOT EXISTS `pod_agreements` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_uuid` varchar(64) NOT NULL,
  `user_email` varchar(255) NOT NULL DEFAULT '',
  `order_id` varchar(180) DEFAULT NULL,
  `agreed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `agreement_text` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pod_agreements_user` (`user_uuid`),
  KEY `idx_pod_agreements_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. products: add product_file column (if not present)
--    Stores the relative path to the downloadable project file.
-- ============================================================
ALTER TABLE `products`
  ADD COLUMN IF NOT EXISTS `product_file` varchar(500) DEFAULT NULL AFTER `is_active`;

-- 4. delivery_logs: add transaction_id column (if not present)
--    Links each delivery log entry to the payment gateway transaction.
-- ============================================================
ALTER TABLE `delivery_logs`
  ADD COLUMN IF NOT EXISTS `transaction_id` varchar(180) DEFAULT NULL AFTER `invoice_id`,
  ADD INDEX IF NOT EXISTS `idx_delivery_logs_txn` (`transaction_id`);

-- 5. bills: add payment_success_ip and payment_success_ua columns (if not present)
--    Stores the customer IP address and user-agent at checkout time as dedicated
--    columns so they are always reliably available (not buried in the data JSON).
-- ============================================================
ALTER TABLE `bills`
  ADD COLUMN IF NOT EXISTS `payment_success_ip` varchar(45) DEFAULT NULL AFTER `billing_address`,
  ADD COLUMN IF NOT EXISTS `payment_success_ua` varchar(500) DEFAULT NULL AFTER `payment_success_ip`;

-- 6. delivery_logs: remove product_slug column (redundant — slug data is in items_json)
-- ============================================================
ALTER TABLE `delivery_logs`
  DROP COLUMN IF EXISTS `product_slug`;
