-- ============================================================================
-- TABLE: user_achievements
-- Stores achievements unlocked by users
-- ============================================================================
CREATE TABLE user_achievements (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id               INT UNSIGNED NOT NULL,
  achievement_type      VARCHAR(50) NOT NULL,
  achievement_name      VARCHAR(100) NOT NULL,
  description           VARCHAR(255) NOT NULL,
  icon                  VARCHAR(50) DEFAULT NULL,
  unlocked_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  
  UNIQUE KEY uq_user_achievement (user_id, achievement_type),
  KEY idx_user_achievements_user_id (user_id),
  KEY idx_user_achievements_type (achievement_type),
  
  CONSTRAINT fk_user_achievements_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================================
-- TABLE: achievement_definitions
-- Defines available achievements and their criteria
-- ============================================================================
CREATE TABLE achievement_definitions (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  type                  VARCHAR(50) NOT NULL,
  name                  VARCHAR(100) NOT NULL,
  description           VARCHAR(255) NOT NULL,
  icon                  VARCHAR(50) NOT NULL,
  role                  ENUM('donor', 'volunteer', 'both') NOT NULL DEFAULT 'both',
  criteria_type         ENUM('donations_count', 'pickups_count', 'rating_avg', 'streak') NOT NULL,
  criteria_value        INT UNSIGNED NOT NULL,
  points                INT UNSIGNED NOT NULL DEFAULT 0,
  is_active             TINYINT(1) NOT NULL DEFAULT 1,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  UNIQUE KEY uq_achievement_type (type),
  KEY idx_achievement_definitions_role (role),
  KEY idx_achievement_definitions_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================================
-- INSERT DEFAULT ACHIEVEMENT DEFINITIONS
-- ============================================================================
INSERT INTO achievement_definitions (type, name, description, icon, role, criteria_type, criteria_value, points) VALUES
-- Donor Achievements
('first_donation', 'First Donation', 'Completed your first donation', 'gift', 'donor', 'donations_count', 1, 10),
('helping_hand', 'Helping Hand', 'Completed 5 donations', 'hand-heart', 'donor', 'donations_count', 5, 25),
('community_hero', 'Community Hero', 'Completed 10 donations', 'award', 'donor', 'donations_count', 10, 50),
('generous_giver', 'Generous Giver', 'Completed 25 donations', 'heart', 'donor', 'donations_count', 25, 100),
('legendary_donor', 'Legendary Donor', 'Completed 50 donations', 'crown', 'donor', 'donations_count', 50, 200),
('top_donor', 'Top Donor', 'Reached top 10 on donor leaderboard', 'trophy', 'donor', 'donations_count', 1, 150),

-- Volunteer Achievements
('first_pickup', 'First Pickup', 'Completed your first pickup', 'truck', 'volunteer', 'pickups_count', 1, 10),
('reliable_volunteer', 'Reliable Volunteer', 'Completed 5 pickups', 'shield-check', 'volunteer', 'pickups_count', 5, 25),
('dedicated_helper', 'Dedicated Helper', 'Completed 10 pickups', 'star', 'volunteer', 'pickups_count', 10, 50),
('super_volunteer', 'Super Volunteer', 'Completed 25 pickups', 'zap', 'volunteer', 'pickups_count', 25, 100),
('legendary_volunteer', 'Legendary Volunteer', 'Completed 50 pickups', 'crown', 'volunteer', 'pickups_count', 50, 200),
('top_volunteer', 'Top Volunteer', 'Reached top 10 on volunteer leaderboard', 'trophy', 'volunteer', 'pickups_count', 1, 150),
('five_star_hero', '5-Star Hero', 'Maintained 5.0 average rating with 10+ ratings', 'star', 'volunteer', 'rating_avg', 10, 100),

-- Both Roles
('consistent_contributor', 'Consistent Contributor', 'Active for 30 days', 'calendar-check', 'both', 'streak', 30, 50);
