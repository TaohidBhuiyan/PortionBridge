-- ============================================================================
-- Migration 018: Notification Templates
-- ============================================================================
-- Adds reusable title/message presets for admin announcements
-- ============================================================================

USE portionbridge;

-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(150) NOT NULL,
  message     VARCHAR(500) NOT NULL,
  created_by  INT UNSIGNED NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_notification_templates_created_by (created_by),

  CONSTRAINT fk_notification_templates_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Record this migration
INSERT IGNORE INTO schema_migrations (id, applied_at)
VALUES ('018_notification_templates', NOW());
