-- ============================================================================
-- Rollback for Migration 030. MANUAL USE ONLY — not run by scripts/migrate.js.
-- DESTRUCTIVE: deletes all relief_pledge_reports rows, the delivery_instructions
-- text, pending-verification quantities and the 'failed' status. Pledges that are
-- currently 'failed' are converted to 'cancelled' first so no row is lost.
-- Back up first (npm run backup). Run against the intended database explicitly.
-- ============================================================================
DROP TABLE IF EXISTS relief_pledge_reports;
ALTER TABLE relief_requests DROP COLUMN delivery_instructions;

UPDATE relief_pledges SET status = 'cancelled', cancelled_at = COALESCE(cancelled_at, failed_at, NOW()) WHERE status = 'failed';

ALTER TABLE relief_pledges DROP CONSTRAINT chk_relief_pledges_failed;
ALTER TABLE relief_pledges DROP CONSTRAINT chk_relief_pledges_order;
ALTER TABLE relief_pledges DROP INDEX uq_relief_pledges_one_open_per_donor_item;
ALTER TABLE relief_pledges DROP COLUMN active_slot;
ALTER TABLE relief_pledges
  DROP COLUMN quantity_pending_verification,
  DROP COLUMN failed_at,
  MODIFY COLUMN status ENUM('pledged', 'collected', 'delivered', 'partially_fulfilled', 'cancelled') NOT NULL DEFAULT 'pledged';
ALTER TABLE relief_pledges
  ADD COLUMN active_slot TINYINT GENERATED ALWAYS AS (CASE WHEN status IN ('pledged', 'collected') THEN 1 ELSE NULL END) STORED,
  ADD UNIQUE KEY uq_relief_pledges_one_open_per_donor_item (relief_request_item_id, donor_id, active_slot),
  ADD CONSTRAINT chk_relief_pledges_order CHECK (
    quantity_delivered >= 0 AND quantity_delivered <= quantity_collected AND quantity_collected <= quantity_pledged
  );
DELETE FROM schema_migrations WHERE id = 'migration_030_relief_pledge_logistics';
