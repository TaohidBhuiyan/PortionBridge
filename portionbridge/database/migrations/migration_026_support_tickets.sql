-- ============================================================================
-- Migration 026: Support Ticket System
-- Description:
--   Creates support_tickets and support_messages tables.
--   Adds support ticket notification types to the notifications.type ENUM.
-- ============================================================================

USE portionbridge;

-- 1. Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  subject VARCHAR(150) NOT NULL,
  category ENUM('account', 'donation', 'pickup', 'technical', 'safety', 'feedback', 'other') NOT NULL,
  priority ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  status ENUM('open', 'in_progress', 'awaiting_user', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  donation_id INT UNSIGNED NULL,
  assigned_admin_id INT UNSIGNED NULL,
  user_unread TINYINT(1) NOT NULL DEFAULT 0,
  admin_unread TINYINT(1) NOT NULL DEFAULT 1,
  last_message_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  closed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_support_tickets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_support_tickets_donation FOREIGN KEY (donation_id) REFERENCES donation_requests(id) ON DELETE SET NULL,
  CONSTRAINT fk_support_tickets_admin FOREIGN KEY (assigned_admin_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_support_tickets_user_last_msg (user_id, last_message_at),
  INDEX idx_support_tickets_status_priority_last_msg (status, priority, last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT UNSIGNED NOT NULL,
  sender_id INT UNSIGNED NOT NULL,
  sender_role ENUM('user', 'admin') NOT NULL,
  message TEXT NOT NULL,
  is_internal TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_support_messages_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_support_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_support_messages_ticket_id (ticket_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Extend notifications.type ENUM idempotently
SET @enum_has_value = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = 'portionbridge'
    AND table_name = 'notifications'
    AND column_name = 'type'
    AND column_type LIKE '%support_ticket_created%'
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
    'admin_announcement',
    'support_ticket_created',
    'support_ticket_user_reply',
    'support_ticket_reply',
    'support_ticket_status'
  ) NOT NULL",
  'SELECT ''notifications.type already has support_ticket notification types'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
