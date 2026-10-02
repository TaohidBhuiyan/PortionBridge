-- Migration 027: Update historical 'completed' status changes to be attributed to assigned volunteer
-- Ensures past completed donations reflect volunteer-driven completion in audit trails & status history.

UPDATE donation_status_history h
JOIN donation_requests d ON h.donation_request_id = d.id
SET h.changed_by = COALESCE(d.assigned_member_id, d.volunteer_id, h.changed_by)
WHERE h.new_status = 'completed' AND (d.volunteer_id IS NOT NULL OR d.assigned_member_id IS NOT NULL);
