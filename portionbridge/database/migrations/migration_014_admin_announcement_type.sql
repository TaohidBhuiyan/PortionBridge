-- Migration 014: Admin Announcement Notification Type
--
-- Phase 8 (Reports, Moderation and Admin Notifications) needs a
-- notification type for a generic admin-to-user broadcast message
-- (system-wide announcements, "notify volunteers", "notify donors").
-- None of the existing 22 notification types fit — they're all tied to a
-- specific donation/team/rating event, not a free-form admin message —
-- so this is a genuinely required schema change, not a workaround.
--
-- notifications.type is a strict MySQL ENUM (not a lookup table), so
-- adding a value means ALTER TABLE ... MODIFY COLUMN, listing every
-- existing value plus the new one. Idempotent: only runs if
-- 'admin_announcement' isn't already present.

USE portionbridge;

SET @enum_has_value = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = 'portionbridge'
    AND table_name = 'notifications'
    AND column_name = 'type'
    AND column_type LIKE '%admin_announcement%'
);

SET @sql = IF(@enum_has_value = 0,
  "ALTER TABLE notifications MODIFY COLUMN type ENUM(
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
    'team_member_joined',
    'team_member_left',
    'team_leadership_transferred',
    'team_member_promoted',
    'team_member_removed',
    'team_announcement',
    'team_donation_assigned',
    'team_donation_completed',
    'admin_announcement'
  ) NOT NULL",
  'SELECT ''notifications.type already has admin_announcement'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
