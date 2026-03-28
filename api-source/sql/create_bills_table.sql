CREATE TABLE IF NOT EXISTS bills (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  orderid VARCHAR(80) NOT NULL,
  txnid VARCHAR(120) DEFAULT NULL,
  uid CHAR(36) NOT NULL,
  carts JSON NOT NULL,
  billing_address JSON DEFAULT NULL,
  data JSON DEFAULT NULL,
  status ENUM('pending', 'success', 'failed', 'unknown') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bills_orderid (orderid),
  KEY idx_bills_uid (uid),
  KEY idx_bills_status (status),
  KEY idx_bills_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
