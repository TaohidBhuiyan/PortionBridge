-- ============================================================================
-- Migration 030: Disaster relief Phase 3 — pledge logistics, delivery reports
-- Builds on migration_029 (disaster relief foundation). ADDITIVE:
--   * relief_pledges: new status 'failed'; quantity_pending_verification
--     (delivery REPORTED by a volunteer but not yet VERIFIED by an admin);
--     failed_at; constraints widened to cover both.
--   * relief_requests: delivery_instructions (drop-off guidance for volunteers).
--   * relief_pledge_reports: volunteer/admin reports (pickup, delivery, failed
--     delivery, problem, release) with a verification workflow.
-- No existing row is changed or deleted. Run ONCE (npm run migrate records it);
-- the ALTERs are not re-runnable. Requires MySQL 8.0.19+ / MariaDB 10.2.1+.
-- No `USE <database>;` on purpose — run against the intended database.
-- Rollback: migration_030_relief_pledge_logistics.down.sql (manual, destructive
-- for the data it added).
-- ============================================================================

-- active_slot is a generated column derived from `status`; drop it while the
-- enum changes, then re-create it identically (and its unique key).
ALTER TABLE relief_pledges DROP INDEX uq_relief_pledges_one_open_per_donor_item;
ALTER TABLE relief_pledges DROP COLUMN active_slot;

ALTER TABLE relief_pledges
  MODIFY COLUMN status ENUM('pledged', 'collected', 'delivered', 'partially_fulfilled', 'cancelled', 'failed') NOT NULL DEFAULT 'pledged',
  ADD COLUMN quantity_pending_verification DECIMAL(12,3) NOT NULL DEFAULT 0 AFTER quantity_delivered,
  ADD COLUMN failed_at DATETIME DEFAULT NULL AFTER cancelled_at;

ALTER TABLE relief_pledges
  ADD COLUMN active_slot TINYINT GENERATED ALWAYS AS (CASE WHEN status IN ('pledged', 'collected') THEN 1 ELSE NULL END) STORED,
  ADD UNIQUE KEY uq_relief_pledges_one_open_per_donor_item (relief_request_item_id, donor_id, active_slot);

ALTER TABLE relief_pledges DROP CONSTRAINT chk_relief_pledges_order;
ALTER TABLE relief_pledges
  ADD CONSTRAINT chk_relief_pledges_order CHECK (
    quantity_delivered >= 0 AND quantity_pending_verification >= 0
    AND quantity_delivered + quantity_pending_verification <= quantity_collected
    AND quantity_collected <= quantity_pledged
  ),
  ADD CONSTRAINT chk_relief_pledges_failed CHECK (status <> 'failed' OR quantity_delivered = 0);

ALTER TABLE relief_requests
  ADD COLUMN delivery_instructions VARCHAR(500) DEFAULT NULL AFTER address;

CREATE TABLE relief_pledge_reports (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pledge_id         INT UNSIGNED NOT NULL,
  reporter_id       INT UNSIGNED DEFAULT NULL,
  report_type       ENUM('pickup', 'delivery', 'failed_delivery', 'problem', 'release') NOT NULL,
  quantity          DECIMAL(12,3) DEFAULT NULL,           -- pickup/delivery: quantity reported
  verified_quantity DECIMAL(12,3) DEFAULT NULL,           -- delivery: quantity an admin verified
  is_final          TINYINT(1) NOT NULL DEFAULT 0,        -- delivery: the volunteer's last delivery report for the task
  -- recorded: informational (pickup/release) | pending: delivery awaiting verification
  -- verified/rejected: outcome of that verification | open/resolved: failed_delivery & problem
  status            ENUM('recorded', 'pending', 'verified', 'rejected', 'open', 'resolved') NOT NULL,
  notes             VARCHAR(1000) DEFAULT NULL,
  reviewed_by       INT UNSIGNED DEFAULT NULL,
  reviewed_at       DATETIME DEFAULT NULL,
  review_notes      VARCHAR(1000) DEFAULT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_relief_reports_pledge (pledge_id, created_at),
  KEY idx_relief_reports_queue (status, report_type),

  CONSTRAINT fk_relief_reports_pledge
    FOREIGN KEY (pledge_id) REFERENCES relief_pledges(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_relief_reports_reporter
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_relief_reports_reviewer
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_relief_reports_quantity CHECK (quantity IS NULL OR quantity > 0),
  CONSTRAINT chk_relief_reports_verified CHECK (verified_quantity IS NULL OR verified_quantity >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
