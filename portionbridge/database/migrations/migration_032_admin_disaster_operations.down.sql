-- Rollback for migration_032. MANUAL ONLY — destroys incident history, quantity history,
-- assignment history and delivery-correction records. Back up first.
-- Merged incidents are returned to 'resolved' (their requests stay on the surviving incident).
UPDATE disaster_incidents SET status = 'resolved' WHERE status = 'merged';

DROP TABLE IF EXISTS relief_delivery_corrections;
DROP TABLE IF EXISTS relief_task_assignments;
DROP TABLE IF EXISTS relief_item_quantity_history;
DROP TABLE IF EXISTS disaster_incident_history;

ALTER TABLE relief_requests
  DROP FOREIGN KEY fk_relief_requests_reassessor,
  DROP COLUMN correction_note, DROP COLUMN correction_requested_at,
  DROP COLUMN reassessment_reason, DROP COLUMN reassessment_flagged_by, DROP COLUMN reassessment_flagged_at;

ALTER TABLE disaster_incidents
  DROP FOREIGN KEY fk_disaster_incidents_info_by,
  DROP FOREIGN KEY fk_disaster_incidents_merged_by,
  DROP FOREIGN KEY fk_disaster_incidents_merged_into,
  DROP INDEX idx_disaster_incidents_severity,
  DROP INDEX idx_disaster_incidents_merged_into,
  DROP COLUMN info_request_note, DROP COLUMN info_requested_by, DROP COLUMN info_requested_at,
  DROP COLUMN merged_by, DROP COLUMN merged_at, DROP COLUMN merged_into_id;

ALTER TABLE disaster_incidents
  MODIFY COLUMN status ENUM('reported', 'under_review', 'verified', 'active', 'resolved', 'rejected') NOT NULL DEFAULT 'reported';
