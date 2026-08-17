-- portionbridge_triggers.sql
-- Contains all triggers for the PortionBridge database
-- Import/run this AFTER importing portionbridge_schema.sql

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
-- TRIGGER: trg_saved_addresses_single_default
-- Ensures only one default address per user when setting a new default
-- Migration 008
-- ============================================================================
CREATE TRIGGER trg_saved_addresses_single_default
BEFORE UPDATE ON saved_addresses
FOR EACH ROW
BEGIN
  IF NEW.is_default = 1 AND OLD.is_default = 0 THEN
    UPDATE saved_addresses
    SET is_default = 0
    WHERE user_id = NEW.user_id AND id <> NEW.id AND is_default = 1;
  END IF;
END$$

DELIMITER ;
