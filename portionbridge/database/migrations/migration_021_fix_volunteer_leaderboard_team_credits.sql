-- ============================================================================
-- Migration 021: Fix Volunteer Leaderboard to Credit Team-Assigned Members
-- Updates top_volunteers view to group by COALESCE(assigned_member_id, volunteer_id)
-- so team-assigned members get credit for their completed pickups and ratings
-- ============================================================================
-- This migration is idempotent - can be run multiple times safely

USE portionbridge;

-- Drop and recreate top_volunteers view with team-aware grouping
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
    COALESCE(assigned_member_id, volunteer_id) AS volunteer_id,
    COUNT(*)                                              AS total_pickups,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count
  FROM donation_requests
  WHERE is_deleted = 0
    AND (volunteer_id IS NOT NULL OR assigned_member_id IS NOT NULL)
  GROUP BY COALESCE(assigned_member_id, volunteer_id)
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
VALUES ('migration_021_fix_volunteer_leaderboard_team_credits', NOW());
