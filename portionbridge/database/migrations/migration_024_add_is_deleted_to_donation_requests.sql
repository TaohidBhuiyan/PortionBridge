-- Migration 024: Ensure is_deleted column exists on donation_requests
--
-- Some databases may not have the is_deleted column from the initial schema.
-- This migration adds it if it doesn't exist.

USE portionbridge;

SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'donation_requests'
    AND COLUMN_NAME = 'is_deleted'
);

SET @sql = IF(@col_exists = 0,
  "ALTER TABLE donation_requests ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0 AFTER status",
  'SELECT ''donation_requests.is_deleted already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure deleted_at column also exists
SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'donation_requests'
    AND COLUMN_NAME = 'deleted_at'
);

SET @sql = IF(@col_exists = 0,
  "ALTER TABLE donation_requests ADD COLUMN deleted_at DATETIME DEFAULT NULL AFTER is_deleted",
  'SELECT ''donation_requests.deleted_at already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Note: schema_migrations table not used in this project
-- Migration complete
