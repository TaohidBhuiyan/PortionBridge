-- triggers.sql
-- Contains all triggers for the PortionBridge database
-- Import/run this AFTER importing main_schema.sql
--
-- Usage: mysql -u root -p portionbridge < triggers.sql
-- ============================================================================

USE portionbridge;

DELIMITER $$

-- ============================================================================
-- TRIGGER: trg_donation_status_insert
-- Logs the initial status of a donation request the moment it's created.
-- ============================================================================
CREATE TRIGGER trg_donation_status_insert
AFTER INSERT ON donation_requests
FOR EACH ROW
BEGIN
  INSERT INTO donation_status_history (donation_request_id, changed_by, old_status, new_status)
  VALUES (NEW.id, NEW.donor_id, NULL, NEW.status);
END$$

-- ============================================================================
-- TRIGGER: trg_donation_status_update
-- On every status change:
--   1. Logs the transition into donation_status_history.
--   2. Auto-creates a notification for the relevant user(s)
--      when the status becomes 'accepted' or 'completed'.
-- ============================================================================
CREATE TRIGGER trg_donation_status_update
AFTER UPDATE ON donation_requests
FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status THEN

    -- 1. Log the status change into the audit trail
    INSERT INTO donation_status_history (donation_request_id, changed_by, old_status, new_status)
    VALUES (NEW.id, NEW.volunteer_id, OLD.status, NEW.status);

    -- 2. Notify the donor when a volunteer accepts their request
    IF NEW.status = 'accepted' THEN
      INSERT INTO notifications (user_id, type, title, message, related_id)
      VALUES (
        NEW.donor_id,
        'donation_accepted',
        'Your donation was accepted',
        CONCAT('A volunteer has accepted your donation request #', NEW.id, '.'),
        NEW.id
      );
    END IF;

    -- 3. Notify both donor and volunteer when the donation is completed
    IF NEW.status = 'completed' THEN
      INSERT INTO notifications (user_id, type, title, message, related_id)
      VALUES (
        NEW.donor_id,
        'status_updated',
        'Donation completed',
        CONCAT('Your donation request #', NEW.id, ' has been marked completed.'),
        NEW.id
      );

      IF NEW.volunteer_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, related_id)
        VALUES (
          NEW.volunteer_id,
          'status_updated',
          'Pickup completed',
          CONCAT('Pickup for donation request #', NEW.id, ' has been marked completed.'),
          NEW.id
        );
      END IF;
    END IF;

  END IF;
END$$

-- ============================================================================
-- TRIGGER: trg_saved_addresses_limit
-- Ensures a user cannot have more than 3 saved addresses
-- Migration 008
-- ============================================================================
CREATE TRIGGER trg_saved_addresses_limit
BEFORE INSERT ON saved_addresses
FOR EACH ROW
BEGIN
  DECLARE address_count INT;
  
  SELECT COUNT(*) INTO address_count
  FROM saved_addresses
  WHERE user_id = NEW.user_id;
  
  IF address_count >= 3 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Maximum 3 saved addresses allowed per user';
  END IF;
END$$

-- ============================================================================
-- TRIGGER: trg_saved_addresses_single_default — REMOVED (Phase 12 QA)
-- Ensures only one default address per user when setting a new default
-- Migration 008
--
-- This trigger was fundamentally broken: it fires BEFORE UPDATE and tries to
-- run its own UPDATE on saved_addresses, which MySQL/MariaDB forbids — a
-- trigger can never modify the table that is already being modified by the
-- statement that invoked it. In practice this meant ANY call to
-- setDefault()'s second statement (`UPDATE saved_addresses SET is_default=1
-- WHERE id=:id`, which sets NEW.is_default=1/OLD.is_default=0 and so always
-- satisfies this trigger's condition) failed with:
--   "Can't update table 'saved_addresses' in stored function/trigger because
--   it is already used by statement which invoked this stored function/trigger"
-- i.e. it could never successfully run in the one case it existed for.
-- The single-default invariant is already correctly enforced at the
-- application layer — see setDefault() and createAddress() in
-- server/services/savedAddress.service.js / models/savedAddress.model.js —
-- so this trigger is redundant as well as broken. Dropped rather than fixed
-- in place, consistent with the INSERT case documented just below, which
-- hits the same MySQL limitation and was already handled the same way.
-- ============================================================================

-- ============================================================================
-- TRIGGER: trg_saved_addresses_single_default_insert
-- Same invariant as trg_saved_addresses_single_default above, but for INSERT.
-- Without this, a user could end up with two is_default=1 rows: the app's
-- createAddress service only force-defaults a user's FIRST address, so a
-- request that explicitly sets isDefault=true for a 2nd/3rd address passed
-- straight through with no existing default cleared (verified live: inserting
-- such a row previously left two is_default=1 rows for the same user).
-- ============================================================================
-- NOTE: A mirrored "single default on INSERT" trigger was attempted here but
-- is not possible in MySQL/MariaDB — a trigger fired by INSERT can never
-- modify its own table (BEFORE or AFTER), unlike UPDATE triggers, which can.
-- Verified via direct testing: both BEFORE INSERT and AFTER INSERT variants
-- fail with "Can't update table 'saved_addresses' ... already used by
-- statement which invoked this stored function/trigger." This specific
-- invariant (a newly inserted default address unsets the previous default)
-- is enforced at the application layer instead — see createAddress() in
-- server/services/savedAddress.service.js.

DELIMITER ;
