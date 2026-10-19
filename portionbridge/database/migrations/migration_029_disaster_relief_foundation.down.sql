-- ============================================================================
-- Rollback for Migration 029 (Disaster Response & Relief Map, Phase 1).
-- MANUAL USE ONLY — not registered in scripts/migrate.js.
-- DESTRUCTIVE: permanently deletes every row in the four relief tables.
-- Take a backup first (npm run backup). Does not touch any pre-existing table.
-- Run against the intended database explicitly:
--   mysql -u root -p portionbridge < migration_029_disaster_relief_foundation.down.sql
-- ============================================================================
DROP TABLE IF EXISTS relief_pledges;
DROP TABLE IF EXISTS relief_request_items;
DROP TABLE IF EXISTS relief_requests;
DROP TABLE IF EXISTS disaster_incidents;
DELETE FROM schema_migrations WHERE id = 'migration_029_disaster_relief_foundation';
