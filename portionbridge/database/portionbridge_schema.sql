-- ============================================================================
-- PortionBridge — Complete Database Schema
-- Engine: MySQL (XAMPP / phpMyAdmin compatible)
-- Requires: MySQL 8.0.16+ or MariaDB 10.2.1+ (for CHECK constraint enforcement)
-- Charset: utf8mb4 (full Unicode support, including emoji in chat messages)
-- ============================================================================
-- This schema includes all changes from migrations 002-011
-- ============================================================================

CREATE DATABASE IF NOT EXISTS portionbridge
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE portionbridge;

-- ============================================================================
-- Drop existing tables in reverse dependency order (safe re-import)
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS top_donors;
DROP VIEW IF EXISTS top_volunteers;

DROP TABLE IF EXISTS donation_assignments;
DROP TABLE IF EXISTS team_invitations;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS saved_addresses;
DROP TABLE IF EXISTS volunteer_profiles;
DROP TABLE IF EXISTS notification_settings;
DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS schema_migrations;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS donation_status_history;
DROP TABLE IF EXISTS donation_requests;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS password_history;
DROP TABLE IF EXISTS email_verifications;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- TABLE: users
-- Stores Donor / Volunteer / Admin accounts.
-- ============================================================================
CREATE TABLE users (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name              VARCHAR(100) NOT NULL,
  email             VARCHAR(150) NOT NULL,
  password          VARCHAR(255) NOT NULL,               -- bcrypt hash
  role              ENUM('donor', 'volunteer', 'admin') NOT NULL DEFAULT 'donor',
  email_verified    TINYINT(1)   NOT NULL DEFAULT 0,
  phone             VARCHAR(20)  DEFAULT NULL,
  phone_verified    TINYINT(1)   NOT NULL DEFAULT 0,
  address           VARCHAR(255) DEFAULT NULL,
  profile_photo     VARCHAR(255) DEFAULT NULL,
  date_of_birth     DATE         DEFAULT NULL,
  gender            ENUM('male', 'female', 'other', 'prefer_not_to_say') DEFAULT NULL,
  provider          VARCHAR(20)  DEFAULT NULL,             -- NULL for password accounts, 'google' for OAuth-linked accounts
  google_id         VARCHAR(64)  DEFAULT NULL,             -- Google 'sub' claim, unique per Google account
  profile_picture   VARCHAR(500) DEFAULT NULL,             -- Profile picture URL from Google OAuth
  is_banned         TINYINT(1)   NOT NULL DEFAULT 0,
  failed_login_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  lock_until        DATETIME     DEFAULT NULL,
  last_login_at     DATETIME     DEFAULT NULL,
  last_login_ip     VARCHAR(45)  DEFAULT NULL,
  last_user_agent   VARCHAR(255) DEFAULT NULL,
  is_deleted        TINYINT(1)   NOT NULL DEFAULT 0,      -- soft delete flag
  deleted_at        DATETIME     DEFAULT NULL,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                       ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_google_id (google_id),

  KEY idx_users_role (role),
  KEY idx_users_is_deleted (is_deleted),
  KEY idx_users_is_banned (is_banned),
  KEY idx_users_lock_until (lock_until),
  KEY idx_users_email_verified (email_verified),

  CONSTRAINT chk_users_email_format CHECK (email LIKE '%_@__%.__%')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================================
-- TABLES: Authentication security support
-- ============================================================================
CREATE TABLE email_verifications (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  token_hash    VARCHAR(255) NOT NULL,
  expires_at    DATETIME NOT NULL,
  is_used       TINYINT(1) NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email_verifications_token_hash (token_hash),
  KEY idx_email_verifications_user_id (user_id),
  KEY idx_email_verifications_expires_at (expires_at),
  CONSTRAINT fk_email_verifications_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE password_history (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_password_history_user_id (user_id),
  KEY idx_password_history_created_at (created_at),
  CONSTRAINT fk_password_history_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE refresh_tokens (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id               INT UNSIGNED NOT NULL,
  token_hash            VARCHAR(255) NOT NULL,
  user_agent            VARCHAR(255) DEFAULT NULL,
  ip_address            VARCHAR(45) DEFAULT NULL,
  is_revoked            TINYINT(1) NOT NULL DEFAULT 0,
  replaced_by_token_id  INT UNSIGNED DEFAULT NULL,
  expires_at            DATETIME NOT NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_tokens_token_hash (token_hash),
  KEY idx_refresh_tokens_user_id (user_id),
  KEY idx_refresh_tokens_is_revoked (is_revoked),
  KEY idx_refresh_tokens_expires_at (expires_at),
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_refresh_tokens_replaced_by FOREIGN KEY (replaced_by_token_id) REFERENCES refresh_tokens(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE audit_logs (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED DEFAULT NULL,
  action        VARCHAR(100) NOT NULL,
  ip_address    VARCHAR(45) DEFAULT NULL,
  user_agent    VARCHAR(255) DEFAULT NULL,
  metadata      TEXT DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_logs_user_id (user_id),
  KEY idx_audit_logs_action (action),
  KEY idx_audit_logs_created_at (created_at),
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ============================================================================
-- TABLE: password_resets
-- Supports the "Forgot Password" reset-link / OTP flow.
-- ============================================================================
CREATE TABLE password_resets (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id           INT UNSIGNED NOT NULL,
  token             VARCHAR(255) NOT NULL,
  expires_at        DATETIME NOT NULL,
  is_used           TINYINT(1) NOT NULL DEFAULT 0,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_password_resets_token (token),
  KEY idx_password_resets_user_id (user_id),
  KEY idx_password_resets_expires_at (expires_at),

  CONSTRAINT fk_password_resets_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ============================================================================
-- TABLE: saved_addresses
-- Stores reusable pickup addresses for donors (max 3 per user)
-- Migration 008
-- ============================================================================
CREATE TABLE saved_addresses (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id                 INT UNSIGNED NOT NULL,
  label                   ENUM('home', 'office', 'other', 'custom') NOT NULL,
  custom_label            VARCHAR(50) DEFAULT NULL,
  full_address            VARCHAR(500) NOT NULL,
  division                VARCHAR(100) NOT NULL,
  district                VARCHAR(100) NOT NULL,
  area                    VARCHAR(100) NOT NULL,
  postal_code             VARCHAR(20) DEFAULT NULL,
  building_name           VARCHAR(100) DEFAULT NULL,
  floor                   VARCHAR(20) DEFAULT NULL,
  landmark                VARCHAR(255) DEFAULT NULL,
  delivery_instructions   VARCHAR(500) DEFAULT NULL,
  latitude                DECIMAL(10, 8) DEFAULT NULL,
  longitude               DECIMAL(11, 8) DEFAULT NULL,
  contact_person_name     VARCHAR(100) NOT NULL,
  contact_phone           VARCHAR(20) NOT NULL,
  is_default              TINYINT(1) NOT NULL DEFAULT 0,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                          ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_saved_addresses_user_id (user_id),
  KEY idx_saved_addresses_is_default (is_default),

  CONSTRAINT fk_saved_addresses_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT chk_saved_addresses_custom_label
    CHECK (label = 'custom' OR custom_label IS NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ============================================================================
-- TABLE: user_preferences
-- Stores donor-specific preferences
-- ============================================================================
CREATE TABLE user_preferences (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id           INT UNSIGNED NOT NULL,
  preferred_contact ENUM('email', 'phone', 'both') NOT NULL DEFAULT 'email',
  receive_notifications TINYINT(1) NOT NULL DEFAULT 1,
  preferred_pickup_time VARCHAR(50) DEFAULT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_user_preferences_user_id (user_id),

  CONSTRAINT fk_user_preferences_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ============================================================================
-- TABLE: notification_settings
-- Stores notification preferences per user
-- ============================================================================
CREATE TABLE notification_settings (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id           INT UNSIGNED NOT NULL,
  email_notifications TINYINT(1) NOT NULL DEFAULT 1,
  push_notifications TINYINT(1) NOT NULL DEFAULT 1,
  sms_notifications TINYINT(1) NOT NULL DEFAULT 0,
  donation_updates TINYINT(1) NOT NULL DEFAULT 1,
  chat_messages TINYINT(1) NOT NULL DEFAULT 1,
  rating_notifications TINYINT(1) NOT NULL DEFAULT 1,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_notification_settings_user_id (user_id),

  CONSTRAINT fk_notification_settings_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ============================================================================
-- TABLE: volunteer_profiles
-- Extended profile information for volunteers
-- ============================================================================
CREATE TABLE volunteer_profiles (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id           INT UNSIGNED NOT NULL,
  bio               TEXT DEFAULT NULL,
  skills            JSON DEFAULT NULL,
  availability      VARCHAR(255) DEFAULT NULL,
  service_areas     VARCHAR(255) DEFAULT NULL,
  vehicle_type      ENUM('none', 'bicycle', 'motorcycle', 'car', 'van', 'truck') DEFAULT NULL,
  total_pickups     INT UNSIGNED NOT NULL DEFAULT 0,
  rating            DECIMAL(3, 2) DEFAULT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_volunteer_profiles_user_id (user_id),

  CONSTRAINT fk_volunteer_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ============================================================================
-- TABLE: teams
-- Migration 010
-- ============================================================================
CREATE TABLE teams (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500) DEFAULT NULL,
  leader_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_teams_leader FOREIGN KEY (leader_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  
  CONSTRAINT uq_teams_leader UNIQUE (leader_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_teams_leader ON teams(leader_id);


-- ============================================================================
-- TABLE: team_members
-- Migration 010
-- ============================================================================
CREATE TABLE team_members (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  role ENUM('leader', 'member') NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) 
    REFERENCES teams(id) ON DELETE CASCADE,
  
  CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  
  CONSTRAINT uq_team_members_user UNIQUE (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_role ON team_members(role);


-- ============================================================================
-- TABLE: team_invitations
-- Migration 010
-- ============================================================================
CREATE TABLE team_invitations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id INT UNSIGNED NOT NULL,
  invited_by INT UNSIGNED NOT NULL,
  invited_user_id INT UNSIGNED NOT NULL,
  invited_email VARCHAR(150) DEFAULT NULL,
  status ENUM('pending', 'accepted', 'declined', 'expired') NOT NULL DEFAULT 'pending',
  expires_at DATETIME NOT NULL,
  responded_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_team_invitations_team FOREIGN KEY (team_id) 
    REFERENCES teams(id) ON DELETE CASCADE,
  
  CONSTRAINT fk_team_invitations_invited_by FOREIGN KEY (invited_by) 
    REFERENCES users(id) ON DELETE CASCADE,
  
  CONSTRAINT fk_team_invitations_invited_user FOREIGN KEY (invited_user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  
  CONSTRAINT uq_team_invitations_pending UNIQUE (team_id, invited_user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_team_invitations_team ON team_invitations(team_id);
CREATE INDEX idx_team_invitations_invited_user ON team_invitations(invited_user_id);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);
CREATE INDEX idx_team_invitations_expires_at ON team_invitations(expires_at);


-- ============================================================================
-- TABLE: donation_requests
-- Each donation post created by a Donor, optionally claimed by a Volunteer.
-- Includes all fields from migrations 003, 004, 005, 009, 011
-- ============================================================================
CREATE TABLE donation_requests (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title             VARCHAR(200) NOT NULL,
  donor_id          INT UNSIGNED NOT NULL,
  volunteer_id      INT UNSIGNED DEFAULT NULL,
  assignment_mode   ENUM('individual', 'team') NOT NULL DEFAULT 'individual',
  team_id           INT UNSIGNED DEFAULT NULL,
  assigned_member_id INT UNSIGNED DEFAULT NULL,
  accepted_at       DATETIME DEFAULT NULL,
  category          ENUM('food', 'clothes') NOT NULL,
  food_type         ENUM('cooked', 'raw', 'packaged') DEFAULT NULL,
  food_name         VARCHAR(200) DEFAULT NULL,
  quantity          INT UNSIGNED NOT NULL,
  quantity_unit     ENUM('plate', 'box', 'packet', 'piece', 'kg', 'gram', 'liter') DEFAULT NULL,
  number_of_servings INT UNSIGNED DEFAULT NULL,
  description       VARCHAR(500) DEFAULT NULL,
  ingredients       VARCHAR(500) DEFAULT NULL,
  allergens         JSON DEFAULT NULL,
  storage_requirement ENUM('room_temperature', 'refrigerated', 'frozen') DEFAULT NULL,
  is_vegetarian     ENUM('vegetarian', 'non_vegetarian') DEFAULT NULL,
  is_halal          ENUM('yes', 'no') DEFAULT NULL,
  refrigeration_required ENUM('yes', 'no') DEFAULT NULL,
  clothing_category ENUM('shirt', 't_shirt', 'pants', 'jeans', 'jacket', 'sweater', 'saree', 'salwar_kameez', 'hijab', 'shoes', 'blanket', 'others') DEFAULT NULL,
  gender            ENUM('male', 'female', 'unisex') DEFAULT NULL,
  age_group         ENUM('baby', 'child', 'teen', 'adult', 'senior') DEFAULT NULL,
  item_condition    ENUM('new', 'like_new', 'good', 'fair') DEFAULT NULL,
  brand             VARCHAR(100) DEFAULT NULL,
  size              ENUM('xs', 's', 'm', 'l', 'xl', 'xxl', 'free_size') DEFAULT NULL,
  color             VARCHAR(50) DEFAULT NULL,
  season            ENUM('summer', 'winter', 'rainy', 'all_season') DEFAULT NULL,
  photo             VARCHAR(255) DEFAULT NULL,
  images            JSON DEFAULT NULL,
  additional_notes  TEXT DEFAULT NULL,
  pickup_location   VARCHAR(255) NOT NULL,
  saved_address_id  INT UNSIGNED DEFAULT NULL,
  pickup_address_details JSON DEFAULT NULL,
  pickup_time       DATETIME NOT NULL,
  pickup_date       DATE NOT NULL,
  pickup_time_slot  ENUM('morning', 'afternoon', 'evening') NOT NULL,
  expiry_date       DATETIME DEFAULT NULL,
  contact_phone     VARCHAR(20) NOT NULL,
  scheduled_at      DATETIME DEFAULT NULL,
  completed_at      DATETIME DEFAULT NULL,
  status            ENUM('pending', 'accepted', 'scheduled', 'on_the_way', 'picked_up', 'completed')
                       NOT NULL DEFAULT 'pending',
  is_deleted        TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at        DATETIME DEFAULT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                       ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_donation_status (status),
  KEY idx_donation_category (category),
  KEY idx_donation_donor_id (donor_id),
  KEY idx_donation_volunteer_id (volunteer_id),
  KEY idx_donation_is_deleted (is_deleted),
  KEY idx_donation_pickup_location (pickup_location),
  KEY idx_donation_pickup_date (pickup_date),
  KEY idx_donation_saved_address_id (saved_address_id),
  KEY idx_donation_team_id (team_id),
  KEY idx_donation_assigned_member_id (assigned_member_id),
  KEY idx_donation_assignment_mode (assignment_mode),

  CONSTRAINT fk_donation_donor
    FOREIGN KEY (donor_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_donation_volunteer
    FOREIGN KEY (volunteer_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  CONSTRAINT fk_donation_saved_address
    FOREIGN KEY (saved_address_id) REFERENCES saved_addresses(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  CONSTRAINT fk_donation_team
    FOREIGN KEY (team_id) REFERENCES teams(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT fk_donation_assigned_member
    FOREIGN KEY (assigned_member_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT chk_donation_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ============================================================================
-- TABLE: donation_assignments
-- Migration 011
-- Tracks which team members are assigned to which donations
-- ============================================================================
CREATE TABLE donation_assignments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  donation_id INT UNSIGNED NOT NULL,
  team_id INT UNSIGNED NOT NULL,
  member_id INT UNSIGNED NOT NULL,
  assigned_by INT UNSIGNED NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('assigned', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'assigned',
  completed_at DATETIME DEFAULT NULL,
  
  CONSTRAINT fk_donation_assignments_donation FOREIGN KEY (donation_id) 
    REFERENCES donation_requests(id) ON DELETE CASCADE,
  
  CONSTRAINT fk_donation_assignments_team FOREIGN KEY (team_id) 
    REFERENCES teams(id) ON DELETE CASCADE,
  
  CONSTRAINT fk_donation_assignments_member FOREIGN KEY (member_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  
  CONSTRAINT fk_donation_assignments_assigned_by FOREIGN KEY (assigned_by) 
    REFERENCES users(id) ON DELETE CASCADE,
  
  CONSTRAINT uq_donation_assignments UNIQUE (donation_id, member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_donation_assignments_donation ON donation_assignments(donation_id);
CREATE INDEX idx_donation_assignments_team ON donation_assignments(team_id);
CREATE INDEX idx_donation_assignments_member ON donation_assignments(member_id);
CREATE INDEX idx_donation_assignments_status ON donation_assignments(status);


-- ============================================================================
-- TABLE: donation_status_history
-- Full audit trail: logs every status transition of a donation request.
-- ============================================================================
CREATE TABLE donation_status_history (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  donation_request_id   INT UNSIGNED NOT NULL,
  changed_by            INT UNSIGNED DEFAULT NULL,
  old_status            VARCHAR(20) DEFAULT NULL,
  new_status            VARCHAR(20) NOT NULL,
  changed_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_history_donation_id (donation_request_id),
  KEY idx_history_changed_by (changed_by),
  KEY idx_history_changed_at (changed_at),

  CONSTRAINT fk_history_donation
    FOREIGN KEY (donation_request_id) REFERENCES donation_requests(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_history_changed_by
    FOREIGN KEY (changed_by) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ============================================================================
-- TABLE: chat_messages
-- Persistent chat tied to a specific donation request (donor <-> volunteer).
-- ============================================================================
CREATE TABLE chat_messages (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  donation_request_id   INT UNSIGNED NOT NULL,
  sender_id             INT UNSIGNED NOT NULL,
  message               TEXT NOT NULL,
  is_read               TINYINT(1) NOT NULL DEFAULT 0,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_chat_donation_id (donation_request_id),
  KEY idx_chat_sender_id (sender_id),
  KEY idx_chat_created_at (created_at),

  CONSTRAINT fk_chat_donation
    FOREIGN KEY (donation_request_id) REFERENCES donation_requests(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_chat_sender
    FOREIGN KEY (sender_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ============================================================================
-- TABLE: notifications
-- In-app notifications per user (donation accepted, new message, etc.).
-- ============================================================================
CREATE TABLE notifications (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  type          ENUM(
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
                  'team_member_joined',
                  'team_member_left',
                  'team_leadership_transferred',
                  'team_member_promoted',
                  'team_member_removed',
                  'team_announcement',
                  'team_donation_assigned',
                  'team_donation_completed'
                ) NOT NULL,
  title         VARCHAR(150) NOT NULL,
  message       VARCHAR(500) NOT NULL,
  related_id    INT UNSIGNED DEFAULT NULL,
  is_read       TINYINT(1) NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_notifications_user_id (user_id),
  KEY idx_notifications_is_read (is_read),
  KEY idx_notifications_type (type),

  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ============================================================================
-- TABLE: ratings
-- Donor <-> Volunteer mutual ratings after a donation is completed.
-- ============================================================================
CREATE TABLE ratings (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  donation_request_id   INT UNSIGNED NOT NULL,
  rated_by              INT UNSIGNED NOT NULL,
  rated_user            INT UNSIGNED NOT NULL,
  stars                 TINYINT UNSIGNED NOT NULL,
  comment               VARCHAR(500) DEFAULT NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_rating_per_donation_rater (donation_request_id, rated_by),

  KEY idx_ratings_rated_user (rated_user),
  KEY idx_ratings_rated_by (rated_by),

  CONSTRAINT fk_ratings_donation
    FOREIGN KEY (donation_request_id) REFERENCES donation_requests(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_ratings_rated_by
    FOREIGN KEY (rated_by) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_ratings_rated_user
    FOREIGN KEY (rated_user) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT chk_ratings_stars CHECK (stars BETWEEN 1 AND 5),
  CONSTRAINT chk_ratings_not_self CHECK (rated_by <> rated_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ============================================================================
-- TABLE: reports
-- Report/Flag a user or a donation post; reviewed by Admin.
-- Migration 006: Added details column and unique constraint
-- ============================================================================
CREATE TABLE reports (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  reporter_id             INT UNSIGNED NOT NULL,
  reported_user_id        INT UNSIGNED DEFAULT NULL,
  reported_donation_id    INT UNSIGNED DEFAULT NULL,
  reason                  VARCHAR(500) NOT NULL,
  details                 TEXT DEFAULT NULL,
  status                  ENUM('pending', 'reviewed', 'resolved') NOT NULL DEFAULT 'pending',
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY idx_reports_reporter_id (reporter_id),
  KEY idx_reports_reported_user_id (reported_user_id),
  KEY idx_reports_reported_donation_id (reported_donation_id),
  KEY idx_reports_status (status),
  UNIQUE KEY uq_reports_reporter_donation (reporter_id, reported_donation_id),

  CONSTRAINT fk_reports_reporter
    FOREIGN KEY (reporter_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_reports_reported_user
    FOREIGN KEY (reported_user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_reports_reported_donation
    FOREIGN KEY (reported_donation_id) REFERENCES donation_requests(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT chk_reports_target_present
    CHECK (reported_user_id IS NOT NULL OR reported_donation_id IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ============================================================================
-- VIEW: top_donors
-- Leaderboard: ranks donors by completed donation count.
-- Migration 007: Fixed to avoid Cartesian product bug
-- ============================================================================
CREATE VIEW top_donors AS
SELECT
  u.id                              AS user_id,
  u.name                            AS donor_name,
  u.profile_photo                   AS profile_photo,
  dstats.total_donations            AS total_donations,
  dstats.completed_count            AS completed_count,
  dstats.total_quantity_donated     AS total_quantity_donated,
  rstats.average_rating             AS average_rating
FROM users u
JOIN (
  SELECT
    donor_id,
    COUNT(*)                                                    AS total_donations,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)       AS completed_count,
    SUM(CASE WHEN status = 'completed' THEN quantity ELSE 0 END) AS total_quantity_donated
  FROM donation_requests
  WHERE is_deleted = 0
  GROUP BY donor_id
) dstats ON dstats.donor_id = u.id
LEFT JOIN (
  SELECT rated_user, ROUND(AVG(stars), 2) AS average_rating
  FROM ratings
  GROUP BY rated_user
) rstats ON rstats.rated_user = u.id
WHERE u.role = 'donor' AND u.is_deleted = 0
ORDER BY completed_count DESC, total_quantity_donated DESC;


-- ============================================================================
-- VIEW: top_volunteers
-- Leaderboard: ranks volunteers by completed pickup count.
-- Migration 007: Fixed to avoid Cartesian product bug
-- ============================================================================
CREATE VIEW top_volunteers AS
SELECT
  u.id                    AS user_id,
  u.name                  AS volunteer_name,
  u.profile_photo         AS profile_photo,
  dstats.total_pickups    AS total_pickups,
  dstats.completed_count  AS completed_count,
  rstats.average_rating   AS average_rating
FROM users u
JOIN (
  SELECT
    volunteer_id,
    COUNT(*)                                              AS total_pickups,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count
  FROM donation_requests
  WHERE is_deleted = 0 AND volunteer_id IS NOT NULL
  GROUP BY volunteer_id
) dstats ON dstats.volunteer_id = u.id
LEFT JOIN (
  SELECT rated_user, ROUND(AVG(stars), 2) AS average_rating
  FROM ratings
  GROUP BY rated_user
) rstats ON rstats.rated_user = u.id
WHERE u.role = 'volunteer' AND u.is_deleted = 0
ORDER BY completed_count DESC, average_rating DESC;
