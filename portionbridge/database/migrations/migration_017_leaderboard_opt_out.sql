-- ============================================================================
-- Migration 017: Leaderboard Privacy Opt-Out
-- Adds show_on_leaderboard column to users table and updates views
-- ============================================================================
-- This migration is idempotent - can be run multiple times safely

USE portionbridge;

-- Add show_on_leaderboard column if it doesn't exist
SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'portionbridge'
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'show_on_leaderboard'
);

SET @sql = IF(@column_exists = 0,
  'ALTER TABLE users ADD COLUMN show_on_leaderboard TINYINT(1) NOT NULL DEFAULT 1 AFTER profile_picture',
  'SELECT ''Column show_on_leaderboard already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop and recreate top_donors view with privacy filter
DROP VIEW IF EXISTS top_donors;

CREATE VIEW top_donors AS
SELECT
  u.id                              AS user_id,
  u.name                            AS donor_name,
  u.profile_photo                   AS profile_photo,
  dstats.total_donations            AS total_donations,
  dstats.completed_count            AS completed_count,
  dstats.total_quantity_donated     AS total_quantity_donated,
  rstats.average_rating             AS average_rating
FROM users u
JOIN (
  SELECT
    donor_id,
    COUNT(*)                                                    AS total_donations,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)       AS completed_count,
    SUM(CASE WHEN status = 'completed' THEN quantity ELSE 0 END) AS total_quantity_donated
  FROM donation_requests
  WHERE is_deleted = 0
  GROUP BY donor_id
) dstats ON dstats.donor_id = u.id
LEFT JOIN (
  SELECT rated_user, ROUND(AVG(stars), 2) AS average_rating
  FROM ratings
  GROUP BY rated_user
) rstats ON rstats.rated_user = u.id
WHERE u.role = 'donor' AND u.is_deleted = 0 AND u.is_banned = 0 AND u.show_on_leaderboard = 1
ORDER BY completed_count DESC, total_quantity_donated DESC;

-- Drop and recreate top_volunteers view with privacy filter
DROP VIEW IF EXISTS top_volunteers;

CREATE VIEW top_volunteers AS
SELECT
  u.id                    AS user_id,
  u.name                  AS volunteer_name,
  u.profile_photo         AS profile_photo,
  dstats.total_pickups    AS total_pickups,
  dstats.completed_count  AS completed_count,
  rstats.average_rating   AS average_rating
FROM users u
JOIN (
  SELECT
    volunteer_id,
    COUNT(*)                                              AS total_pickups,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count
  FROM donation_requests
  WHERE is_deleted = 0 AND volunteer_id IS NOT NULL
  GROUP BY volunteer_id
) dstats ON dstats.volunteer_id = u.id
LEFT JOIN (
  SELECT rated_user, ROUND(AVG(stars), 2) AS average_rating
  FROM ratings
  GROUP BY rated_user
) rstats ON rstats.rated_user = u.id
WHERE u.role = 'volunteer' AND u.is_deleted = 0 AND u.is_banned = 0 AND u.show_on_leaderboard = 1
ORDER BY completed_count DESC, average_rating DESC;

-- Record migration
INSERT IGNORE INTO schema_migrations (id, applied_at)
VALUES ('migration_017_leaderboard_opt_out', NOW());
