-- Migration 016: Donation Cancelled Status
--
-- Cancelling a donation previously only soft-deleted the row
-- (is_deleted = 1), with no distinct status value recorded. Since donor
-- history and summary queries filter on is_deleted = 0, a cancelled
-- donation vanished from the donor's own history entirely — the
-- "Cancelled" stat card and status filter could never show anything.
--
-- This adds 'cancelled' to the status ENUM so cancelDonation() can record
-- it explicitly. donation.service.js#cancelDonation is the only caller of
-- softDelete() for donations, so this is a safe, isolated change: every
-- other is_deleted = 0 query elsewhere (volunteer browsing, admin active
-- counts, team assignments) already filters on an explicit status too,
-- so cancelled donations still won't appear there.
--
-- Idempotent: only alters what's missing.

USE portionbridge;

SET @enum_has_value = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = 'portionbridge'
    AND table_name = 'donation_requests'
    AND column_name = 'status'
    AND column_type LIKE '%cancelled%'
);

SET @sql = IF(@enum_has_value = 0,
  "ALTER TABLE donation_requests MODIFY COLUMN status ENUM('pending', 'accepted', 'scheduled', 'on_the_way', 'picked_up', 'completed', 'cancelled') NOT NULL DEFAULT 'pending'",
  'SELECT ''donation_requests.status already has cancelled'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
