-- ============================================================================
-- Migration 032: Disaster relief Phase 5 — admin operations & relief coordination
-- ADDITIVE. Builds on 029/030/031.
--   * disaster_incidents: new terminal status 'merged' + merge/info-request columns
--     (merged incidents are KEPT; their relief requests are re-pointed to the surviving
--     incident, so pledges, tasks, alerts and audit history stay intact).
--   * disaster_incident_history   — verification / status / correction / merge timeline.
--   * relief_requests: reassessment flag + correction-request columns.
--   * relief_item_quantity_history — every change to a requested quantity, with a reason.
--   * relief_task_assignments     — admin assign / reassign / release / cancel history.
--   * relief_delivery_corrections — admin corrections to an already verified delivery.
-- No existing row is modified or deleted. Run ONCE (npm run migrate records it); the
-- ALTERs are not re-runnable. Rollback: migration_032_admin_disaster_operations.down.sql
-- No `USE <database>;` on purpose.
-- ============================================================================

ALTER TABLE disaster_incidents
  MODIFY COLUMN status ENUM('reported', 'under_review', 'verified', 'active', 'resolved', 'rejected', 'merged') NOT NULL DEFAULT 'reported';

ALTER TABLE disaster_incidents
  ADD COLUMN merged_into_id      INT UNSIGNED DEFAULT NULL AFTER resolved_at,
  ADD COLUMN merged_at           DATETIME DEFAULT NULL AFTER merged_into_id,
  ADD COLUMN merged_by           INT UNSIGNED DEFAULT NULL AFTER merged_at,
  ADD COLUMN info_requested_at   DATETIME DEFAULT NULL AFTER merged_by,
  ADD COLUMN info_requested_by   INT UNSIGNED DEFAULT NULL AFTER info_requested_at,
  ADD COLUMN info_request_note   VARCHAR(500) DEFAULT NULL AFTER info_requested_by,
  ADD KEY idx_disaster_incidents_merged_into (merged_into_id),
  ADD KEY idx_disaster_incidents_severity (severity),
  ADD CONSTRAINT fk_disaster_incidents_merged_into FOREIGN KEY (merged_into_id) REFERENCES disaster_incidents(id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_disaster_incidents_merged_by FOREIGN KEY (merged_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_disaster_incidents_info_by FOREIGN KEY (info_requested_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE disaster_incident_history (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  incident_id   INT UNSIGNED NOT NULL,
  action        ENUM('status_change', 'verified', 'rejected', 'info_requested', 'corrected', 'merged_into', 'merged_from', 'reopened', 'resolved') NOT NULL,
  from_status   VARCHAR(20) DEFAULT NULL,
  to_status     VARCHAR(20) DEFAULT NULL,
  reason        VARCHAR(1000) DEFAULT NULL,
  details       TEXT DEFAULT NULL,                      -- JSON: changed fields (before/after), related ids
  actor_id      INT UNSIGNED DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_incident_history_incident (incident_id, created_at),
  CONSTRAINT fk_incident_history_incident FOREIGN KEY (incident_id) REFERENCES disaster_incidents(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_incident_history_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE relief_requests
  ADD COLUMN reassessment_flagged_at DATETIME DEFAULT NULL AFTER review_notes,
  ADD COLUMN reassessment_flagged_by INT UNSIGNED DEFAULT NULL AFTER reassessment_flagged_at,
  ADD COLUMN reassessment_reason     VARCHAR(500) DEFAULT NULL AFTER reassessment_flagged_by,
  ADD COLUMN correction_requested_at DATETIME DEFAULT NULL AFTER reassessment_reason,
  ADD COLUMN correction_note         VARCHAR(500) DEFAULT NULL AFTER correction_requested_at,
  ADD CONSTRAINT fk_relief_requests_reassessor FOREIGN KEY (reassessment_flagged_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE relief_item_quantity_history (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  relief_request_id INT UNSIGNED NOT NULL,
  item_id           INT UNSIGNED DEFAULT NULL,           -- NULL after the item row is hard-deleted (never had pledges)
  item_name         VARCHAR(100) NOT NULL,
  unit              ENUM('piece', 'packet', 'box', 'set', 'kg', 'liter') NOT NULL,
  change_type       ENUM('added', 'quantity_changed', 'removed') NOT NULL,
  old_quantity      DECIMAL(12,3) DEFAULT NULL,
  new_quantity      DECIMAL(12,3) DEFAULT NULL,
  request_status    VARCHAR(20) NOT NULL,                -- request status when the change was made
  reason            VARCHAR(500) DEFAULT NULL,
  changed_by        INT UNSIGNED DEFAULT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_item_qty_history_request (relief_request_id, created_at),
  CONSTRAINT fk_item_qty_history_request FOREIGN KEY (relief_request_id) REFERENCES relief_requests(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_item_qty_history_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE relief_task_assignments (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pledge_id         INT UNSIGNED NOT NULL,
  action            ENUM('assigned', 'reassigned', 'released', 'cancelled') NOT NULL,
  from_volunteer_id INT UNSIGNED DEFAULT NULL,
  to_volunteer_id   INT UNSIGNED DEFAULT NULL,
  reason            VARCHAR(500) DEFAULT NULL,
  actor_id          INT UNSIGNED DEFAULT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_task_assignments_pledge (pledge_id, created_at),
  CONSTRAINT fk_task_assignments_pledge FOREIGN KEY (pledge_id) REFERENCES relief_pledges(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_task_assignments_from FOREIGN KEY (from_volunteer_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_task_assignments_to FOREIGN KEY (to_volunteer_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_task_assignments_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE relief_delivery_corrections (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_id     INT UNSIGNED NOT NULL,
  pledge_id     INT UNSIGNED NOT NULL,
  old_verified  DECIMAL(12,3) NOT NULL,
  new_verified  DECIMAL(12,3) NOT NULL,
  reason        VARCHAR(500) NOT NULL,
  actor_id      INT UNSIGNED DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_delivery_corrections_report (report_id, created_at),
  CONSTRAINT fk_delivery_corrections_report FOREIGN KEY (report_id) REFERENCES relief_pledge_reports(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_delivery_corrections_pledge FOREIGN KEY (pledge_id) REFERENCES relief_pledges(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_delivery_corrections_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
