-- ============================================================================
-- Migration 022: Volunteer Team Join Requests
-- Description: Adds team_join_requests table to track volunteers requesting
--              to join existing teams and team leaders managing incoming requests.
-- ============================================================================

USE portionbridge;

CREATE TABLE IF NOT EXISTS team_join_requests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  message VARCHAR(255) DEFAULT NULL,
  responded_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_team_join_requests_team FOREIGN KEY (team_id) 
    REFERENCES teams(id) ON DELETE CASCADE,
  
  CONSTRAINT fk_team_join_requests_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_team_join_requests_team ON team_join_requests(team_id);
CREATE INDEX idx_team_join_requests_user ON team_join_requests(user_id);
CREATE INDEX idx_team_join_requests_status ON team_join_requests(status);
