-- ============================================================================
-- Migration 023: Team Join Request Notifications and Constraint
-- Description: 
--   1. Adds new notification types for team join requests (received/accepted/rejected)
--   2. Adds pending_flag column and unique constraint to team_join_requests table
--      to prevent multiple pending requests from the same user to the same team
-- ============================================================================

USE portionbridge;

-- 1. Add new notification types to the ENUM
-- This preserves all existing values and adds the new join request types
ALTER TABLE notifications
  MODIFY COLUMN type ENUM(
    'donation_created',
    'volunteer_assigned',
    'donation_accepted',
    'pickup_scheduled',
    'volunteer_on_the_way',
    'pickup_completed',
    'donation_cancelled',
    'assignment_changed',
    'new_message',
    'status_updated',
    'rating_received',
    'report_filed',
    'team_invitation_received',
    'team_invitation_accepted',
    'team_join_request_received',
    'team_join_request_accepted',
    'team_join_request_rejected',
    'team_member_joined',
    'team_member_left',
    'team_leadership_transferred',
    'team_member_promoted',
    'team_member_removed',
    'team_announcement',
    'team_donation_assigned',
    'team_donation_completed',
    'admin_announcement'
  ) NOT NULL;

-- 2. Add pending_flag column to team_join_requests
-- This generated column marks pending requests for the unique constraint
SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = 'portionbridge'
    AND table_name = 'team_join_requests'
    AND column_name = 'pending_flag'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE team_join_requests
    ADD COLUMN pending_flag TINYINT(1) GENERATED ALWAYS AS 
      (CASE WHEN status = ''pending'' THEN 1 ELSE 0 END) STORED',
  'SELECT ''Column pending_flag already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Defensive cleanup: cancel any older duplicate pending requests
-- This ensures the unique constraint can be applied even if duplicates exist
UPDATE team_join_requests t1
INNER JOIN (
  SELECT team_id, user_id, MIN(id) as min_id
  FROM team_join_requests
  WHERE status = 'pending'
  GROUP BY team_id, user_id
  HAVING COUNT(*) > 1
) t2 ON t1.team_id = t2.team_id AND t1.user_id = t2.user_id AND t1.id > t2.min_id
SET t1.status = 'cancelled',
    t1.responded_at = NOW();

-- 4. Add unique constraint to prevent multiple pending requests from same user to same team
-- This mirrors the uq_team_invitations_pending constraint but allows repeat history after rejection/cancellation
SET @constraint_exists = (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE table_schema = 'portionbridge'
    AND table_name = 'team_join_requests'
    AND constraint_name = 'uq_team_join_requests_one_pending'
);

SET @sql = IF(@constraint_exists = 0,
  'ALTER TABLE team_join_requests
    ADD CONSTRAINT uq_team_join_requests_one_pending 
    UNIQUE (team_id, user_id, pending_flag)',
  'SELECT ''Constraint uq_team_join_requests_one_pending already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
