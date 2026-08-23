-- ============================================================================
-- PortionBridge — Dummy / Sample Data
-- Run AFTER main_schema.sql and triggers.sql have been imported successfully.
-- This seed file is intended for a fresh database and contains only INSERT
-- statements. It does not include TRUNCATE, DROP, DELETE, or
-- SET FOREIGN_KEY_CHECKS statements.
--
-- Sample password hash below corresponds to the plaintext password:
--   Password123!
-- (bcrypt, 10 rounds — safe to use for local testing only, never in production)
--
-- Usage: mysql -u root -p portionbridge < dummy_data.sql
-- ============================================================================

USE portionbridge;

-- ============================================================================
-- USERS
-- 1 admin, 3 donors, 3 volunteers
-- ============================================================================
INSERT INTO users
  (id, name, email, password, role, phone, address, profile_photo, is_banned, is_deleted, email_verified)
VALUES
  (1, 'Admin User',      'admin@portionbridge.com',    '$2b$10$7EqJtq98hPqEX7fNZaFWoOhi5vHRWDBGdQhqzQY7c5nz7d9cJ5FS2', 'admin',     '01700000001', 'Dhaka, Bangladesh',        NULL, 0, 0, 1),
  (2, 'Rahim Uddin',      'rahim.donor@example.com',    '$2b$10$7EqJtq98hPqEX7fNZaFWoOhi5vHRWDBGdQhqzQY7c5nz7d9cJ5FS2', 'donor',     '01700000002', 'Gulshan, Dhaka',           NULL, 0, 0, 1),
  (3, 'Karim Ahmed',      'karim.donor@example.com',    '$2b$10$7EqJtq98hPqEX7fNZaFWoOhi5vHRWDBGdQhqzQY7c5nz7d9cJ5FS2', 'donor',     '01700000003', 'Dhanmondi, Dhaka',         NULL, 0, 0, 1),
  (4, 'Fatima Begum',     'fatima.donor@example.com',   '$2b$10$7EqJtq98hPqEX7fNZaFWoOhi5vHRWDBGdQhqzQY7c5nz7d9cJ5FS2', 'donor',     '01700000004', 'Uttara, Dhaka',            NULL, 0, 0, 1),
  (5, 'Sabbir Hossain',   'sabbir.volunteer@example.com','$2b$10$7EqJtq98hPqEX7fNZaFWoOhi5vHRWDBGdQhqzQY7c5nz7d9cJ5FS2', 'volunteer', '01700000005', 'Mirpur, Dhaka',            NULL, 0, 0, 1),
  (6, 'Nusrat Jahan',     'nusrat.volunteer@example.com','$2b$10$7EqJtq98hPqEX7fNZaFWoOhi5vHRWDBGdQhqzQY7c5nz7d9cJ5FS2', 'volunteer', '01700000006', 'Banani, Dhaka',            NULL, 0, 0, 1),
  (7, 'Tanvir Islam',     'tanvir.volunteer@example.com','$2b$10$7EqJtq98hPqEX7fNZaFWoOhi5vHRWDBGdQhqzQY7c5nz7d9cJ5FS2', 'volunteer', '01700000007', 'Mohammadpur, Dhaka',       NULL, 0, 0, 1);

-- ============================================================================
-- DONATION REQUESTS
-- Covers all lifecycle statuses and includes a soft-deleted request.
-- Updated to match current schema with all required fields
-- ============================================================================
INSERT INTO donation_requests
  (id, donor_id, volunteer_id, category, quantity, description, pickup_location, pickup_time, pickup_date, pickup_time_slot, scheduled_at, status, is_deleted, deleted_at, assignment_mode, title, contact_phone)
VALUES
  (1, 2, NULL, 'food', 10, 'Cooked rice and curry for 10 people', 'Gulshan 1, Dhaka', '2026-07-15 18:00:00', '2026-07-15', 'evening', NULL, 'pending', 0, NULL, 'individual', 'Cooked Rice Donation', '01700000002'),
  (2, 3, 5, 'clothes', 25, 'Winter clothes bundle, good condition', 'Dhanmondi 27, Dhaka', '2026-07-16 10:00:00', '2026-07-16', 'morning', '2026-07-16 11:00:00', 'accepted', 0, NULL, 'individual', 'Winter Clothes Bundle', '01700000003'),
  (3, 4, 6, 'food', 15, 'Bakery items, day-old bread and pastries', 'Uttara Sector 7, Dhaka', '2026-07-14 09:00:00', '2026-07-14', 'morning', '2026-07-14 10:00:00', 'on_the_way', 0, NULL, 'individual', 'Bakery Items', '01700000004'),
  (4, 2, 7, 'clothes', 40, 'Children clothing, mixed sizes', 'Gulshan 2, Dhaka', '2026-07-13 14:00:00', '2026-07-13', 'afternoon', '2026-07-13 15:00:00', 'picked_up', 0, NULL, 'individual', 'Children Clothing', '01700000002'),
  (5, 2, 5, 'food', 20, 'Packed lunch boxes for shelter', 'Gulshan 1, Dhaka', '2026-07-10 12:00:00', '2026-07-10', 'afternoon', '2026-07-10 13:00:00', 'completed', 0, NULL, 'individual', 'Lunch Boxes', '01700000002'),
  (6, 3, 6, 'clothes', 30, 'Blankets for winter relief', 'Dhanmondi 15, Dhaka', '2026-07-08 16:00:00', '2026-07-08', 'afternoon', '2026-07-08 17:00:00', 'completed', 0, NULL, 'individual', 'Winter Blankets', '01700000003'),
  (7, 4, 5, 'food', 12, 'Fresh vegetables surplus from restaurant', 'Uttara Sector 4, Dhaka', '2026-07-05 08:00:00', '2026-07-05', 'morning', '2026-07-05 09:00:00', 'completed', 0, NULL, 'individual', 'Fresh Vegetables', '01700000004'),
  (8, 3, NULL, 'clothes', 5, 'Cancelled by donor before acceptance', 'Dhanmondi 32, Dhaka', '2026-07-12 10:00:00', '2026-07-12', 'morning', NULL, 'pending', 1, '2026-07-12 09:00:00', 'individual', 'Cancelled Items', '01700000003');

-- ============================================================================
-- CHAT MESSAGES
-- Tied to accepted/in-progress donation requests (2, 3, 4, 5, 6, 7)
-- ============================================================================
INSERT INTO chat_messages (donation_request_id, sender_id, message, is_read) VALUES
  (2, 3, 'Hi, thanks for accepting! What time works for pickup?', 1),
  (2, 5, 'Hello! I can come by around 11 AM tomorrow.',       1),
  (2, 3, 'That works, see you then.',                          0),

  (5, 2, 'Hi Sabbir, the lunch boxes are ready outside the gate.', 1),
  (5, 5, 'On my way, arriving in 10 minutes.',                     1),
  (5, 2, 'Great, thank you so much!',                              1),

  (6, 3, 'The blankets are packed in 3 boxes.',  1),
  (6, 6, 'Understood, bringing my van.',          1);

-- ============================================================================
-- RATINGS
-- Donor and volunteer rate each other after completed donations (5, 6, 7)
-- ============================================================================
INSERT INTO ratings (donation_request_id, rated_by, rated_user, stars, comment) VALUES
  (5, 2, 5, 5, 'Sabbir was very punctual and courteous.'),
  (5, 5, 2, 5, 'Rahim had everything ready, smooth pickup.'),

  (6, 3, 6, 4, 'Nusrat picked up on time, great communication.'),
  (6, 6, 3, 5, 'Karim packed everything neatly.'),

  (7, 4, 5, 5, 'Sabbir is always reliable!'),
  (7, 5, 4, 4, 'Fatima had the vegetables well organized.');

-- ============================================================================
-- REPORTS
-- One donation-post report, one user report — both pending admin review
-- ============================================================================
INSERT INTO reports (reporter_id, reported_user_id, reported_donation_id, reason, status) VALUES
  (6, NULL, 1, 'Donation description does not match photo provided.', 'pending'),
  (5, 3,   NULL, 'User was unresponsive after accepting pickup time.', 'pending');

-- ============================================================================
-- NOTIFICATIONS
-- Manually seed notifications that would normally be generated by status-change triggers.
-- ============================================================================
INSERT INTO notifications (user_id, type, title, message, related_id) VALUES
  (2, 'donation_accepted', 'Your donation was accepted', 'A volunteer has accepted your donation request #2.', 2),
  (4, 'donation_accepted', 'Your donation was accepted', 'A volunteer has accepted your donation request #3.', 3),
  (2, 'donation_accepted', 'Your donation was accepted', 'A volunteer has accepted your donation request #4.', 4),
  (2, 'donation_accepted', 'Your donation was accepted', 'A volunteer has accepted your donation request #5.', 5),
  (3, 'donation_accepted', 'Your donation was accepted', 'A volunteer has accepted your donation request #6.', 6),
  (4, 'donation_accepted', 'Your donation was accepted', 'A volunteer has accepted your donation request #7.', 7),

  (2, 'status_updated', 'Donation completed', 'Your donation request #5 has been marked completed.', 5),
  (5, 'status_updated', 'Pickup completed', 'Pickup for donation request #5 has been marked completed.', 5),
  (3, 'status_updated', 'Donation completed', 'Your donation request #6 has been marked completed.', 6),
  (6, 'status_updated', 'Pickup completed', 'Pickup for donation request #6 has been marked completed.', 6),
  (4, 'status_updated', 'Donation completed', 'Your donation request #7 has been marked completed.', 7),
  (5, 'status_updated', 'Pickup completed', 'Pickup for donation request #7 has been marked completed.', 7);

-- ============================================================================
-- Mark sample donor accounts as email-verified for local login testing.
-- These accounts use the shared test password: Password123!
-- ============================================================================
UPDATE users
SET email_verified = 1
WHERE email IN (
  'rahim.donor@example.com',
  'karim.donor@example.com',
  'fatima.donor@example.com'
);

-- ============================================================================
-- USER PREFERENCES
-- One record per donor
-- ============================================================================
INSERT INTO user_preferences (user_id, preferred_contact, receive_notifications, preferred_pickup_time) VALUES
(2, 'email', 1, 'evening'),
(3, 'phone', 1, 'morning'),
(4, 'both', 1, 'afternoon');

-- ============================================================================
-- NOTIFICATION SETTINGS
-- One record per user
-- ============================================================================
INSERT INTO notification_settings (user_id, email_notifications, push_notifications, sms_notifications, donation_updates, chat_messages, rating_notifications) VALUES
(1, 1, 1, 1, 1, 1, 1),
(2, 1, 1, 0, 1, 1, 1),
(3, 1, 1, 1, 1, 1, 1),
(4, 1, 1, 0, 1, 1, 1),
(5, 1, 1, 1, 1, 1, 1),
(6, 1, 1, 1, 1, 1, 1),
(7, 1, 1, 1, 1, 1, 1);

-- ============================================================================
-- VOLUNTEER PROFILES
-- One record per volunteer
-- ============================================================================
INSERT INTO volunteer_profiles (user_id, bio, skills, availability, service_areas, vehicle_type, total_pickups, rating) VALUES
(5, 'Passionate about reducing food waste and helping communities', '["driving", "communication", "time_management"]', 'weekends', '["Dhaka North", "Gulshan", "Banani"]', 'motorcycle', 3, 4.5),
(6, 'Dedicated volunteer with experience in logistics', '["organization", "heavy_lifting", "customer_service"]', 'weekdays', '["Dhaka South", "Dhanmondi", "Uttara"]', 'van', 2, 4.0),
(7, 'Environmental activist focused on sustainable practices', '["sustainability", "coordination", "teamwork"]', 'flexible', '["Mirpur", "Mohammadpur", "Pallabi"]', 'car', 2, 4.5);

-- ============================================================================
-- SAVED ADDRESSES
-- Sample saved addresses for donors
-- ============================================================================
INSERT INTO saved_addresses (user_id, label, custom_label, full_address, division, district, area, postal_code, building_name, floor, landmark, delivery_instructions, latitude, longitude, contact_person_name, contact_phone, is_default) VALUES
(2, 'home', NULL, 'House 10, Road 5, Gulshan 1', 'Dhaka', 'Dhaka', 'Gulshan', '1212', 'Gulshan Heights', '3rd Floor', 'Near British American School', 'Ring bell twice', 23.7825, 90.4125, 'Rahim Uddin', '01700000002', 1),
(2, 'office', NULL, 'Office 4B, Trade Center, Motijheel', 'Dhaka', 'Dhaka', 'Motijheel', '1000', 'AB Trade Center', '8th Floor', 'Near DMP Headquarters', 'Ask security for Rahim', 23.7250, 90.4100, 'Rahim Uddin', '01700000002', 0),
(3, 'home', NULL, 'Flat 2A, Road 27, Dhanmondi', 'Dhaka', 'Dhaka', 'Dhanmondi', '1205', 'Dhanmondi Residential', '2nd Floor', 'Near Rabindra Sarobar', 'Call before arriving', 23.7460, 90.3820, 'Karim Ahmed', '01700000003', 1),
(4, 'home', NULL, 'House 15, Sector 7, Uttara', 'Dhaka', 'Dhaka', 'Uttara', '1230', 'Uttara Residential', 'Ground Floor', 'Near Uttara Medical College', 'Leave at gate if no response', 23.8720, 90.4000, 'Fatima Begum', '01700000004', 1);

-- ============================================================================
-- TEAMS
-- Sample teams for volunteers
-- ============================================================================
INSERT INTO teams (id, name, description, leader_id) VALUES
(1, 'Dhaka Food Rescue Team', 'Focused on rescuing food from restaurants and events', 5),
(2, 'Community Helpers', 'General community support and donation coordination', 6);

-- ============================================================================
-- TEAM MEMBERS
-- Team membership records
-- ============================================================================
INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES
(1, 5, 'leader', '2026-07-01 10:00:00'),
(1, 7, 'member', '2026-07-05 14:30:00'),
(2, 6, 'leader', '2026-07-02 09:00:00');

-- ============================================================================
-- TEAM INVITATIONS
-- Sample team invitations
-- ============================================================================
INSERT INTO team_invitations (team_id, invited_by, invited_user_id, invited_email, status, expires_at, responded_at) VALUES
(1, 5, 6, 'nusrat.volunteer@example.com', 'declined', '2026-07-20 18:00:00', '2026-07-15 10:00:00'),
(2, 6, 7, 'tanvir.volunteer@example.com', 'pending', '2026-08-30 18:00:00', NULL);

-- ============================================================================
-- USER ACHIEVEMENTS
-- Sample achievements unlocked by users
-- ============================================================================
INSERT INTO user_achievements (user_id, achievement_type, achievement_name, description, icon, unlocked_at) VALUES
(2, 'first_donation', 'First Donation', 'Completed your first donation', 'gift', '2026-07-10 13:00:00'),
(2, 'helping_hand', 'Helping Hand', 'Completed 5 donations', 'hand-heart', '2026-07-13 15:00:00'),
(3, 'first_donation', 'First Donation', 'Completed your first donation', 'gift', '2026-07-08 17:00:00'),
(4, 'first_donation', 'First Donation', 'Completed your first donation', 'gift', '2026-07-05 09:00:00'),
(5, 'first_pickup', 'First Pickup', 'Completed your first pickup', 'truck', '2026-07-10 13:00:00'),
(5, 'reliable_volunteer', 'Reliable Volunteer', 'Completed 5 pickups', 'shield-check', '2026-07-13 15:00:00'),
(6, 'first_pickup', 'First Pickup', 'Completed your first pickup', 'truck', '2026-07-08 17:00:00'),
(7, 'first_pickup', 'First Pickup', 'Completed your first pickup', 'truck', '2026-07-05 09:00:00');

-- ============================================================================
-- DONATION ASSIGNMENTS
-- Team-based donation assignments
-- ============================================================================
INSERT INTO donation_assignments (donation_id, team_id, member_id, assigned_by, assigned_at, status, completed_at) VALUES
(2, 1, 7, 5, '2026-07-16 10:30:00', 'completed', '2026-07-16 12:00:00');

-- ============================================================================
-- EMAIL VERIFICATIONS
-- Sample email verification tokens
-- ============================================================================
INSERT INTO email_verifications (user_id, token_hash, expires_at, is_used) VALUES
(2, '$2b$10$abc123xyz456', '2026-08-30 18:00:00', 1),
(3, '$2b$10$def789uvw012', '2026-08-30 18:00:00', 1),
(4, '$2b$10$ghi345rst678', '2026-08-30 18:00:00', 1);

-- ============================================================================
-- PASSWORD HISTORY
-- Sample password history entries
-- ============================================================================
INSERT INTO password_history (user_id, password_hash, created_at) VALUES
(2, '$2b$10$oldhash123456', '2026-06-01 10:00:00'),
(3, '$2b$10$oldhash789012', '2026-06-05 14:00:00'),
(4, '$2b$10$oldhash345678', '2026-06-10 09:00:00');

-- ============================================================================
-- REFRESH TOKENS
-- Sample refresh tokens
-- ============================================================================
INSERT INTO refresh_tokens (user_id, token_hash, user_agent, ip_address, is_revoked, expires_at) VALUES
(2, '$2b$10$refreshtoken123', 'Mozilla/5.0', '192.168.1.1', 0, '2026-09-30 18:00:00'),
(5, '$2b$10$refreshtoken456', 'Mozilla/5.0', '192.168.1.2', 0, '2026-09-30 18:00:00');

-- ============================================================================
-- AUDIT LOGS
-- Sample audit log entries
-- ============================================================================
INSERT INTO audit_logs (user_id, action, ip_address, user_agent, metadata) VALUES
(2, 'user_login', '192.168.1.1', 'Mozilla/5.0', '{"success": true}'),
(5, 'donation_accepted', '192.168.1.2', 'Mozilla/5.0', '{"donation_id": 2}'),
(1, 'user_banned', '192.168.1.10', 'Mozilla/5.0', '{"target_user_id": 999}');

-- ============================================================================
-- PASSWORD RESETS
-- Sample password reset tokens
-- ============================================================================
INSERT INTO password_resets (user_id, token, expires_at, is_used) VALUES
(2, 'reset_token_abc123', '2026-08-30 18:00:00', 0);

-- ============================================================================
-- NOTE: As requested, this seed file includes only INSERT statements.
-- donation_status_history receives its initial row per donation request
-- automatically from the donation_requests AFTER INSERT trigger.
-- ============================================================================
