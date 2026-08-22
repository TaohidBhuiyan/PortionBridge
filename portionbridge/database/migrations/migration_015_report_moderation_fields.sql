-- Migration 015: Report Moderation Fields
--
-- Phase 8 needs to distinguish "resolved" (action was taken) from
-- "dismissed" (reviewed, no violation found) — the existing
-- reports.status ENUM only has pending/reviewed/resolved, with no way to
-- represent a dismissal, and no column to record WHY a report was closed
-- or WHO closed it. Both are genuinely needed for a real "moderation
-- history" (an admin decision with no reasoning attached isn't a useful
-- history), so this extends the existing reports table rather than
-- inventing a parallel moderation-log table for the same rows.
--
-- Idempotent: only alters what's missing.

USE portionbridge;

-- 1. Add 'dismissed' to the status ENUM
SET @enum_has_value = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = 'portionbridge'
    AND table_name = 'reports'
    AND column_name = 'status'
    AND column_type LIKE '%dismissed%'
);

SET @sql = IF(@enum_has_value = 0,
  "ALTER TABLE reports MODIFY COLUMN status ENUM('pending', 'reviewed', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending'",
  'SELECT ''reports.status already has dismissed'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. resolution_notes — the admin's reasoning when closing a report
SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = 'portionbridge' AND table_name = 'reports' AND column_name = 'resolution_notes'
);
SET @sql = IF(@column_exists = 0,
  'ALTER TABLE reports ADD COLUMN resolution_notes TEXT DEFAULT NULL AFTER details',
  'SELECT ''Column resolution_notes already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. resolved_by — which admin made the moderation decision
SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = 'portionbridge' AND table_name = 'reports' AND column_name = 'resolved_by'
);
SET @sql = IF(@column_exists = 0,
  'ALTER TABLE reports ADD COLUMN resolved_by INT UNSIGNED DEFAULT NULL AFTER status',
  'SELECT ''Column resolved_by already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. resolved_at — when the report was closed
SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = 'portionbridge' AND table_name = 'reports' AND column_name = 'resolved_at'
);
SET @sql = IF(@column_exists = 0,
  'ALTER TABLE reports ADD COLUMN resolved_at TIMESTAMP NULL DEFAULT NULL AFTER resolved_by',
  'SELECT ''Column resolved_at already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. FK for resolved_by (added last, after the column exists, and only if missing)
SET @fk_exists = (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE table_schema = 'portionbridge' AND table_name = 'reports' AND constraint_name = 'fk_reports_resolved_by'
);
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE reports ADD CONSTRAINT fk_reports_resolved_by FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT ''Constraint fk_reports_resolved_by already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
