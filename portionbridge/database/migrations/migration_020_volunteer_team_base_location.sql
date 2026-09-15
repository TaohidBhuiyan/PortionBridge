-- Migration 020: Volunteer/Team base location (self-service address)
--
-- volunteer_profiles.latitude/longitude/coverage_radius and
-- teams.latitude/longitude/coverage_radius already existed (used to make a
-- volunteer/team discoverable to donors — see volunteerDiscovery.model.js),
-- but neither table had ANY write path anywhere in the app: no
-- controller/route ever set them. This migration doesn't touch those
-- existing columns; it only adds a human-readable label alongside them so
-- the UI can show "Your location: Mirpur, Dhaka" instead of just raw
-- coordinates, once a volunteer/team leader sets their base location
-- (Phase 1 follow-up — Sep 2026).

ALTER TABLE volunteer_profiles
  ADD COLUMN base_address VARCHAR(255) DEFAULT NULL AFTER coverage_radius;

ALTER TABLE teams
  ADD COLUMN base_address VARCHAR(255) DEFAULT NULL AFTER coverage_radius;
