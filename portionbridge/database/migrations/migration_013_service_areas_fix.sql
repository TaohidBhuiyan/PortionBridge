-- Migration 013: Service Areas Column Fix
-- Renames service_area to service_areas in volunteer_profiles table
-- This migration fixes the column name mismatch that was causing JSON parsing issues

USE portionbridge;

-- Check if service_area column exists and rename it to service_areas
SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns 
                      WHERE table_schema = 'portionbridge' 
                      AND table_name = 'volunteer_profiles' 
                      AND column_name = 'service_area');

SET @column_new_exists = (SELECT COUNT(*) FROM information_schema.columns 
                          WHERE table_schema = 'portionbridge' 
                          AND table_name = 'volunteer_profiles' 
                          AND column_name = 'service_areas');

SET @sql = IF(@column_exists = 1 AND @column_new_exists = 0, 
  'ALTER TABLE volunteer_profiles CHANGE COLUMN service_area service_areas VARCHAR(255) DEFAULT NULL',
  'SELECT ''Column service_areas already exists or service_area does not exist'' AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;