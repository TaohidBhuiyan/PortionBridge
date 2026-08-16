-- Migration 012: Google OAuth Enhancements
-- Adds Google OAuth support columns to users table
-- This migration can be applied if the columns don't already exist in the schema

USE portionbridge;

-- Add Google OAuth columns if they don't exist
SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns 
                      WHERE table_schema = 'portionbridge' 
                      AND table_name = 'users' 
                      AND column_name = 'provider');

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN provider VARCHAR(20) DEFAULT NULL COMMENT ''NULL for password accounts, google for OAuth-linked accounts''',
  'SELECT ''Column provider already exists'' AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns 
                      WHERE table_schema = 'portionbridge' 
                      AND table_name = 'users' 
                      AND column_name = 'google_id');

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN google_id VARCHAR(64) DEFAULT NULL COMMENT ''Google sub claim, unique per Google account''',
  'SELECT ''Column google_id already exists'' AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns 
                      WHERE table_schema = 'portionbridge' 
                      AND table_name = 'users' 
                      AND column_name = 'profile_picture');

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500) DEFAULT NULL COMMENT ''Profile picture URL from Google OAuth''',
  'SELECT ''Column profile_picture already exists'' AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add unique constraint on google_id if it doesn't exist
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                     WHERE table_schema = 'portionbridge' 
                     AND table_name = 'users' 
                     AND index_name = 'uq_users_google_id');

SET @sql = IF(@index_exists = 0, 
  'ALTER TABLE users ADD UNIQUE INDEX uq_users_google_id (google_id)',
  'SELECT ''Index uq_users_google_id already exists'' AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;