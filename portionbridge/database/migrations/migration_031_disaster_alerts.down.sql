-- Rollback for migration_031_disaster_alerts.sql. MANUAL ONLY — destroys alert
-- history, delivery state and alert preferences. Alert notifications already
-- in users' inboxes are deleted so the notification type can be removed.
DELETE FROM notifications WHERE type = 'disaster_alert';

ALTER TABLE notifications DROP FOREIGN KEY fk_notifications_alert_event;
ALTER TABLE notifications DROP FOREIGN KEY fk_notifications_incident;

DROP TABLE IF EXISTS disaster_alert_pref_categories;
DROP TABLE IF EXISTS disaster_alert_pref_districts;
DROP TABLE IF EXISTS disaster_alert_preferences;
DROP TABLE IF EXISTS disaster_alert_events;
DROP TABLE IF EXISTS disaster_alert_districts;
DROP TABLE IF EXISTS disaster_alerts;

ALTER TABLE notifications
  DROP INDEX uq_notifications_user_alert_event,
  DROP INDEX idx_notifications_incident,
  DROP INDEX idx_notifications_user_unread,
  DROP INDEX idx_notifications_user_inbox,
  DROP COLUMN severity,
  DROP COLUMN alert_event_id,
  DROP COLUMN relief_pledge_id,
  DROP COLUMN relief_request_id,
  DROP COLUMN incident_id;

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
    'support_ticket_status'
  ) NOT NULL;
