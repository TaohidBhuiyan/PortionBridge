-- ============================================================================
-- Migration 031: Disaster relief Phase 4 — nationwide alerts & smart notifications
-- Builds on migrations 029/030 and the existing `notifications` table. ADDITIVE:
--   * notifications: new type 'disaster_alert'; link columns (incident_id,
--     relief_request_id, relief_pledge_id, alert_event_id, severity); a UNIQUE
--     (user_id, alert_event_id) key so one alert event can never notify a user
--     twice; inbox indexes.
--   * disaster_alerts           — one row per alert on a verified incident
--     (scope local | regional | nationwide). Severity reuses the incident enum.
--   * disaster_alert_districts  — target districts of an alert.
--   * disaster_alert_events     — the OUTBOX: every issue/update/escalation/
--     correction/resolution/cancellation is a durable row with a unique
--     dedupe_key and a processing state, written in the same transaction as
--     the change that caused it.
--   * disaster_alert_preferences (+ _districts, _categories) — optional,
--     per-user personalisation. No row = safe defaults (everything on).
-- No existing row is changed or deleted. Run ONCE (npm run migrate records it);
-- the ALTERs are not re-runnable. Requires MySQL 8.0.16+ / MariaDB 10.2.1+.
-- No `USE <database>;` on purpose — run against the intended database.
-- Rollback: migration_031_disaster_alerts.down.sql (manual; destructive for
-- the data it added).
-- ============================================================================

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
    'admin_announcement',
    'support_ticket_created',
    'support_ticket_user_reply',
    'support_ticket_reply',
    'support_ticket_status',
    'disaster_alert'
  ) NOT NULL;

ALTER TABLE notifications
  ADD COLUMN incident_id        INT UNSIGNED DEFAULT NULL AFTER related_id,
  ADD COLUMN relief_request_id  INT UNSIGNED DEFAULT NULL AFTER incident_id,
  ADD COLUMN relief_pledge_id   INT UNSIGNED DEFAULT NULL AFTER relief_request_id,
  ADD COLUMN alert_event_id     INT UNSIGNED DEFAULT NULL AFTER relief_pledge_id,
  ADD COLUMN severity           ENUM('low', 'moderate', 'high', 'critical') DEFAULT NULL AFTER alert_event_id;

ALTER TABLE notifications
  ADD KEY idx_notifications_user_inbox (user_id, created_at, id),
  ADD KEY idx_notifications_user_unread (user_id, is_read, created_at),
  ADD KEY idx_notifications_incident (incident_id),
  ADD UNIQUE KEY uq_notifications_user_alert_event (user_id, alert_event_id),
  ADD CONSTRAINT fk_notifications_incident
    FOREIGN KEY (incident_id) REFERENCES disaster_incidents(id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE disaster_alerts (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  incident_id     INT UNSIGNED NOT NULL,
  scope           ENUM('local', 'regional', 'nationwide') NOT NULL,
  -- same low/moderate/high/critical enum as disaster_incidents.severity (no parallel severity model)
  severity        ENUM('low', 'moderate', 'high', 'critical') NOT NULL,
  status          ENUM('active', 'resolved', 'cancelled') NOT NULL DEFAULT 'active',
  radius_km       SMALLINT UNSIGNED DEFAULT NULL,
  admin_note      VARCHAR(500) DEFAULT NULL,           -- optional public wording added by the issuing admin
  version         INT UNSIGNED NOT NULL DEFAULT 1,
  auto_generated  TINYINT(1) NOT NULL DEFAULT 0,       -- 1 = created by the verification hook (always scope 'local')
  created_by      INT UNSIGNED DEFAULT NULL,
  updated_by      INT UNSIGNED DEFAULT NULL,
  resolved_at     DATETIME DEFAULT NULL,
  cancelled_at    DATETIME DEFAULT NULL,
  cancelled_by    INT UNSIGNED DEFAULT NULL,
  cancel_reason   VARCHAR(500) DEFAULT NULL,           -- internal; never shown to donors/volunteers
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- 1 while the alert is live, NULL otherwise: with the unique key below the
  -- database itself allows only ONE live alert per incident (NULLs never collide).
  open_slot       TINYINT GENERATED ALWAYS AS (CASE WHEN status = 'active' THEN 1 ELSE NULL END) STORED,

  PRIMARY KEY (id),
  UNIQUE KEY uq_disaster_alerts_one_live_per_incident (incident_id, open_slot),
  KEY idx_disaster_alerts_status (status, created_at),
  KEY idx_disaster_alerts_scope (scope),

  -- CASCADE: incidents are never deleted by the application; if an operator removes one, its alerts go with it
  CONSTRAINT fk_disaster_alerts_incident FOREIGN KEY (incident_id) REFERENCES disaster_incidents(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_disaster_alerts_creator  FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_disaster_alerts_updater  FOREIGN KEY (updated_by)  REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_disaster_alerts_canceller FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_disaster_alerts_radius CHECK (radius_km IS NULL OR radius_km BETWEEN 1 AND 500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE disaster_alert_districts (
  alert_id  INT UNSIGNED NOT NULL,
  district  VARCHAR(100) NOT NULL,
  PRIMARY KEY (alert_id, district),
  KEY idx_disaster_alert_districts_district (district),
  CONSTRAINT fk_disaster_alert_districts_alert FOREIGN KEY (alert_id) REFERENCES disaster_alerts(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE disaster_alert_events (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  alert_id         INT UNSIGNED NOT NULL,
  incident_id      INT UNSIGNED NOT NULL,
  event_type       ENUM('issued', 'updated', 'escalated', 'area_expanded', 'relief_update', 'correction', 'resolved', 'cancelled') NOT NULL,
  -- stable idempotency key, e.g. alert:12:issued | alert:12:v3 | alert:12:relief:40:approved
  dedupe_key       VARCHAR(190) NOT NULL,
  severity         ENUM('low', 'moderate', 'high', 'critical') NOT NULL,   -- snapshot at event time
  scope            ENUM('local', 'regional', 'nationwide') NOT NULL,       -- snapshot at event time
  relief_request_id INT UNSIGNED DEFAULT NULL,
  note             VARCHAR(500) DEFAULT NULL,
  title            VARCHAR(150) DEFAULT NULL,                              -- composed at processing time from live data
  message          VARCHAR(500) DEFAULT NULL,
  status           ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  attempts         TINYINT UNSIGNED NOT NULL DEFAULT 0,
  locked_at        DATETIME DEFAULT NULL,
  processed_at     DATETIME DEFAULT NULL,
  last_error       VARCHAR(500) DEFAULT NULL,
  recipient_count  INT UNSIGNED NOT NULL DEFAULT 0,
  created_by       INT UNSIGNED DEFAULT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_disaster_alert_events_dedupe (dedupe_key),
  KEY idx_disaster_alert_events_queue (status, created_at),
  KEY idx_disaster_alert_events_alert (alert_id, created_at),

  CONSTRAINT fk_disaster_alert_events_alert    FOREIGN KEY (alert_id)    REFERENCES disaster_alerts(id)    ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_disaster_alert_events_incident FOREIGN KEY (incident_id) REFERENCES disaster_incidents(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_disaster_alert_events_creator  FOREIGN KEY (created_by)  REFERENCES users(id)             ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_alert_event
    FOREIGN KEY (alert_event_id) REFERENCES disaster_alert_events(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Optional personalisation. A user WITHOUT a row gets the defaults below
-- (nearby on, nationwide on, all categories, every severity, in-app on).
-- center_* is a COARSE point (2 decimals ~ 1.1 km) the user typed or approved
-- explicitly; it is never read from the browser automatically.
CREATE TABLE disaster_alert_preferences (
  user_id             INT UNSIGNED NOT NULL,
  nearby_enabled      TINYINT(1) NOT NULL DEFAULT 1,
  nationwide_enabled  TINYINT(1) NOT NULL DEFAULT 1,
  in_app_enabled      TINYINT(1) NOT NULL DEFAULT 1,
  min_severity        ENUM('low', 'moderate', 'high', 'critical') NOT NULL DEFAULT 'low',
  radius_km           SMALLINT UNSIGNED DEFAULT NULL,
  center_latitude     DECIMAL(5,2) DEFAULT NULL,
  center_longitude    DECIMAL(5,2) DEFAULT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id),
  CONSTRAINT fk_disaster_alert_prefs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_disaster_alert_prefs_radius CHECK (radius_km IS NULL OR radius_km BETWEEN 1 AND 500),
  CONSTRAINT chk_disaster_alert_prefs_center CHECK (
    (center_latitude IS NULL AND center_longitude IS NULL)
    OR (center_latitude IS NOT NULL AND center_longitude IS NOT NULL
        AND center_latitude BETWEEN -90 AND 90 AND center_longitude BETWEEN -180 AND 180)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE disaster_alert_pref_districts (
  user_id   INT UNSIGNED NOT NULL,
  district  VARCHAR(100) NOT NULL,
  PRIMARY KEY (user_id, district),
  KEY idx_disaster_alert_pref_districts_district (district),
  CONSTRAINT fk_disaster_alert_pref_districts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- No rows = every category. Rows = only those categories (for optional alerts).
CREATE TABLE disaster_alert_pref_categories (
  user_id        INT UNSIGNED NOT NULL,
  disaster_type  ENUM('flood', 'flash_flood', 'fire', 'building_collapse', 'earthquake', 'cyclone', 'storm', 'other') NOT NULL,
  PRIMARY KEY (user_id, disaster_type),
  CONSTRAINT fk_disaster_alert_pref_categories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
