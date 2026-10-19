-- ============================================================================
-- Migration 029: Disaster Response & Relief Map — Phase 1 database foundation
-- Description:
--   Adds four NEW tables. No existing table is altered, dropped or truncated.
--     disaster_incidents       — verified/unverified disaster events
--     relief_requests          — one or more supply requests per incident
--     relief_request_items     — required items + fixed requested quantity
--     relief_pledges           — donor commitments against a requested item
--                                (optionally linked to an existing
--                                donation_requests pickup/delivery record)
--
-- Safe to re-run: every statement uses CREATE TABLE IF NOT EXISTS.
-- Requires MySQL 8.0.16+ / MariaDB 10.2.1+ (CHECK constraints, STORED
-- generated columns) — the same floor main_schema.sql already requires.
--
-- NOTE: intentionally no `USE <database>;` here. Run it against the intended
-- database explicitly:  mysql -u root -p portionbridge < migration_029_...sql
-- (or via `npm run migrate`, which connects to DB_NAME).
--
-- Rollback: migration_029_disaster_relief_foundation.down.sql (manual only;
-- it drops these four tables and any relief data in them).
-- ============================================================================

CREATE TABLE IF NOT EXISTS disaster_incidents (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title               VARCHAR(200) NOT NULL,
  description         TEXT DEFAULT NULL,
  disaster_type       ENUM('flood', 'flash_flood', 'fire', 'building_collapse', 'earthquake', 'cyclone', 'storm', 'other') NOT NULL,
  severity            ENUM('low', 'moderate', 'high', 'critical') NOT NULL DEFAULT 'moderate',
  priority            ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  latitude            DECIMAL(10,7) DEFAULT NULL,
  longitude           DECIMAL(10,7) DEFAULT NULL,
  address             VARCHAR(255) DEFAULT NULL,            -- precise; never returned in public responses
  district            VARCHAR(100) NOT NULL,
  affected_area       VARCHAR(255) DEFAULT NULL,
  status              ENUM('reported', 'under_review', 'verified', 'active', 'resolved', 'rejected') NOT NULL DEFAULT 'reported',
  source_type         ENUM('user_report', 'admin_entry', 'official_source', 'media', 'other') NOT NULL DEFAULT 'user_report',
  source_reference    VARCHAR(500) DEFAULT NULL,
  verification_status ENUM('unverified', 'verified', 'rejected') NOT NULL DEFAULT 'unverified',
  verified_by         INT UNSIGNED DEFAULT NULL,
  verified_at         DATETIME DEFAULT NULL,
  verification_notes  VARCHAR(1000) DEFAULT NULL,           -- internal moderation notes; never public
  reported_by         INT UNSIGNED DEFAULT NULL,
  resolved_at         DATETIME DEFAULT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_disaster_incidents_status (status),
  KEY idx_disaster_incidents_type (disaster_type),
  KEY idx_disaster_incidents_district (district),
  KEY idx_disaster_incidents_reported_by (reported_by),
  KEY idx_disaster_incidents_created_at (created_at),

  CONSTRAINT fk_disaster_incidents_verifier
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_disaster_incidents_reporter
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_disaster_incidents_coords CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR (latitude IS NOT NULL AND longitude IS NOT NULL
        AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS relief_requests (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  incident_id             INT UNSIGNED NOT NULL,
  title                   VARCHAR(200) NOT NULL,
  description             TEXT DEFAULT NULL,
  location_name           VARCHAR(200) NOT NULL,            -- shelter / ward / affected group
  address                 VARCHAR(255) DEFAULT NULL,        -- precise; never returned in public responses
  latitude                DECIMAL(10,7) DEFAULT NULL,
  longitude               DECIMAL(10,7) DEFAULT NULL,
  priority                ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  -- pending_review is the ONLY initial state; approval is a separate admin action.
  status                  ENUM('pending_review', 'approved', 'rejected', 'completed', 'cancelled', 'expired') NOT NULL DEFAULT 'pending_review',
  requested_by            INT UNSIGNED DEFAULT NULL,
  requesting_organization VARCHAR(200) DEFAULT NULL,
  approved_by             INT UNSIGNED DEFAULT NULL,
  approved_at             DATETIME DEFAULT NULL,
  review_notes            VARCHAR(1000) DEFAULT NULL,       -- internal; never public
  expires_at              DATETIME DEFAULT NULL,
  closed_at               DATETIME DEFAULT NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_relief_requests_incident (incident_id),
  KEY idx_relief_requests_status (status),
  KEY idx_relief_requests_requested_by (requested_by),
  KEY idx_relief_requests_expires_at (expires_at),

  CONSTRAINT fk_relief_requests_incident
    FOREIGN KEY (incident_id) REFERENCES disaster_incidents(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_relief_requests_requester
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_relief_requests_approver
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_relief_requests_coords CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR (latitude IS NOT NULL AND longitude IS NOT NULL
        AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS relief_request_items (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  relief_request_id  INT UNSIGNED NOT NULL,
  item_name          VARCHAR(100) NOT NULL,
  item_key           VARCHAR(100) NOT NULL,                 -- lower-cased/whitespace-collapsed item_name, for duplicate detection
  item_category      ENUM('drinking_water', 'dry_food', 'ready_to_eat_food', 'clothing', 'blanket', 'hygiene_kit', 'other') NOT NULL,
  unit               ENUM('piece', 'packet', 'box', 'set', 'kg', 'liter') NOT NULL,
  quantity_requested DECIMAL(12,3) NOT NULL,                -- fixed requirement; pledged/collected/delivered are DERIVED from relief_pledges
  priority           ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  status             ENUM('active', 'cancelled') NOT NULL DEFAULT 'active',
  notes              VARCHAR(500) DEFAULT NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_relief_items_request_item_unit (relief_request_id, item_key, unit),
  KEY idx_relief_items_category (item_category),

  CONSTRAINT fk_relief_items_request
    FOREIGN KEY (relief_request_id) REFERENCES relief_requests(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_relief_items_quantity CHECK (quantity_requested > 0),
  -- indivisible units must be whole numbers; only kg / liter may be fractional
  CONSTRAINT chk_relief_items_whole_units CHECK (
    unit IN ('kg', 'liter') OR quantity_requested = FLOOR(quantity_requested)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS relief_pledges (
  id                     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  relief_request_item_id INT UNSIGNED NOT NULL,
  donor_id               INT UNSIGNED NOT NULL,
  quantity_pledged       DECIMAL(12,3) NOT NULL,
  quantity_collected     DECIMAL(12,3) NOT NULL DEFAULT 0,
  quantity_delivered     DECIMAL(12,3) NOT NULL DEFAULT 0,
  status                 ENUM('pledged', 'collected', 'delivered', 'partially_fulfilled', 'cancelled') NOT NULL DEFAULT 'pledged',
  donation_request_id    INT UNSIGNED DEFAULT NULL,         -- optional link to the existing pickup/delivery workflow
  idempotency_key        VARCHAR(64) DEFAULT NULL,
  notes                  VARCHAR(500) DEFAULT NULL,
  collected_at           DATETIME DEFAULT NULL,
  delivered_at           DATETIME DEFAULT NULL,
  cancelled_at           DATETIME DEFAULT NULL,
  cancelled_by           INT UNSIGNED DEFAULT NULL,
  cancellation_reason    VARCHAR(255) DEFAULT NULL,
  created_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- 1 while the pledge is an open commitment, NULL otherwise. Together with the
  -- unique key below this enforces "one open pledge per donor per item" in the
  -- database itself (NULLs never collide in a unique index).
  active_slot            TINYINT GENERATED ALWAYS AS (CASE WHEN status IN ('pledged', 'collected') THEN 1 ELSE NULL END) STORED,

  PRIMARY KEY (id),
  UNIQUE KEY uq_relief_pledges_one_open_per_donor_item (relief_request_item_id, donor_id, active_slot),
  UNIQUE KEY uq_relief_pledges_idempotency (donor_id, idempotency_key),
  UNIQUE KEY uq_relief_pledges_donation_request (donation_request_id),
  KEY idx_relief_pledges_item_status (relief_request_item_id, status),
  KEY idx_relief_pledges_donor (donor_id),

  CONSTRAINT fk_relief_pledges_item
    FOREIGN KEY (relief_request_item_id) REFERENCES relief_request_items(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_relief_pledges_donor
    FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_relief_pledges_donation
    FOREIGN KEY (donation_request_id) REFERENCES donation_requests(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_relief_pledges_cancelled_by
    FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT chk_relief_pledges_positive CHECK (quantity_pledged > 0),
  CONSTRAINT chk_relief_pledges_order CHECK (
    quantity_delivered >= 0 AND quantity_delivered <= quantity_collected AND quantity_collected <= quantity_pledged
  ),
  CONSTRAINT chk_relief_pledges_delivered_full CHECK (status <> 'delivered' OR quantity_delivered = quantity_pledged),
  CONSTRAINT chk_relief_pledges_partial CHECK (
    status <> 'partially_fulfilled' OR (quantity_delivered > 0 AND quantity_delivered < quantity_pledged)
  ),
  CONSTRAINT chk_relief_pledges_cancelled CHECK (status <> 'cancelled' OR quantity_delivered = 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
