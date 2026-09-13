-- Migration 019: Recurring Donations
-- Allows donors to set up recurring donation schedules (daily, weekly, monthly)

CREATE TABLE IF NOT EXISTS recurring_donations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  donor_id INT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  category ENUM('food', 'clothes') NOT NULL,
  description TEXT,
  quantity DECIMAL(10, 2) NOT NULL,
  quantity_unit VARCHAR(50) NOT NULL,
  pickup_location VARCHAR(500) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  
  -- Recurrence settings
  frequency ENUM('daily', 'weekly', 'monthly') NOT NULL,
  interval_value TINYINT UNSIGNED DEFAULT 1, -- e.g., every 2 weeks
  day_of_week TINYINT UNSIGNED, -- 0-6 for weekly (Sunday-Saturday)
  day_of_month TINYINT UNSIGNED, -- 1-31 for monthly
  
  -- Category-specific fields (stored as JSON for flexibility)
  food_details JSON DEFAULT NULL,
  clothing_details JSON DEFAULT NULL,
  
  -- Schedule management
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE DEFAULT NULL,
  next_occurrence DATE NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_recurring_donations_donor FOREIGN KEY (donor_id)
    REFERENCES users(id) ON DELETE CASCADE,
  
  CONSTRAINT chk_recurring_frequency CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  CONSTRAINT chk_recurring_interval CHECK (interval_value >= 1),
  CONSTRAINT chk_recurring_day_of_week CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
  CONSTRAINT chk_recurring_day_of_month CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)),
  CONSTRAINT chk_recurring_dates CHECK (end_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_recurring_donations_donor ON recurring_donations(donor_id);
CREATE INDEX idx_recurring_donations_active ON recurring_donations(is_active);
CREATE INDEX idx_recurring_donations_next ON recurring_donations(next_occurrence);

-- Insert migration record
INSERT IGNORE INTO schema_migrations (id, applied_at)
VALUES ('019_recurring_donations', NOW());
