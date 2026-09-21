-- ============================================================================
-- Migration 025: Correct actor attribution in donation_status_history
-- Description:
--   trg_donation_status_update hardcoded `changed_by = NEW.volunteer_id`
--   for every status change, regardless of who actually made it. Real bugs
--   this caused:
--     - A donor completing or cancelling a donation (both donor-only
--       actions) was logged — and shown in the activity timeline — as if
--       the volunteer had done it.
--     - For a team mission, the real assigned member doing
--       schedule/on-the-way/picked-up was logged as the team LEADER
--       (volunteer_id), not themselves.
--   Fix: the trigger now prefers a session variable, @status_change_actor_id,
--   which the application sets to the real actor's user ID immediately
--   before every status-changing UPDATE (donationModel.setStatusChangeActor,
--   called on the same connection/transaction). Falls back to the old
--   NEW.volunteer_id guess only for an UPDATE that didn't go through the
--   app layer (so this migration can never make an existing row's history
--   worse — it only affects rows written after this is applied).
-- This migration is idempotent — DROP TRIGGER IF EXISTS before recreating.
-- ============================================================================

USE portionbridge;

DROP TRIGGER IF EXISTS trg_donation_status_update;

DELIMITER $$

CREATE TRIGGER trg_donation_status_update
AFTER UPDATE ON donation_requests
FOR EACH ROW
BEGIN
  IF OLD.status <> NEW.status THEN

    INSERT INTO donation_status_history (donation_request_id, changed_by, old_status, new_status)
    VALUES (NEW.id, COALESCE(@status_change_actor_id, NEW.volunteer_id), OLD.status, NEW.status);
    SET @status_change_actor_id = NULL;

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

DELIMITER ;
