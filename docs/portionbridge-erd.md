# PortionBridge Database Entity-Relationship Diagram (ERD)

This document contains the complete, current Entity-Relationship Diagram (ERD) for the PortionBridge database as of the latest migration (Migration 015: Report Moderation Fields).

The diagram represents all 23 tables and 2 views that comprise the production database schema.

---

## Diagram

```mermaid
erDiagram
    %% ==========================================
    %% SECTION 1: CORE AUTHENTICATION & USERS
    %% ==========================================
    
    USERS ||--o{ EMAIL_VERIFICATIONS : "has"
    USERS ||--o{ PASSWORD_HISTORY : "has"
    USERS ||--o{ PASSWORD_RESETS : "has"
    USERS ||--o{ REFRESH_TOKENS : "has-many"
    USERS ||--o{ AUDIT_LOGS : "logged-by"
    REFRESH_TOKENS ||--o| REFRESH_TOKENS : "replaced-by"
    
    %% ==========================================
    %% SECTION 2: USER SETTINGS & PREFERENCES
    %% ==========================================
    
    USERS ||--|| USER_PREFERENCES : "has-one"
    USERS ||--|| NOTIFICATION_SETTINGS : "has-one"
    
    %% ==========================================
    %% SECTION 3: VOLUNTEER & PROFILES
    %% ==========================================
    
    USERS ||--|| VOLUNTEER_PROFILES : "extends"
    USERS ||--o{ SAVED_ADDRESSES : "has-many"
    
    %% ==========================================
    %% SECTION 4: ACHIEVEMENTS & GAMIFICATION
    %% ==========================================
    
    USERS ||--o{ USER_ACHIEVEMENTS : "unlocks"
    ACHIEVEMENT_DEFINITIONS ||--o{ USER_ACHIEVEMENTS : "defines"
    
    %% ==========================================
    %% SECTION 5: TEAMS & TEAM MANAGEMENT
    %% ==========================================
    
    USERS ||--o| TEAMS : "leads"
    TEAMS ||--o{ TEAM_MEMBERS : "has-many"
    USERS ||--o{ TEAM_MEMBERS : "joins"
    TEAMS ||--o{ TEAM_INVITATIONS : "receives"
    USERS ||--o{ TEAM_INVITATIONS : "sends"
    USERS ||--o{ TEAM_INVITATIONS : "receives-as-invitee"
    
    %% ==========================================
    %% SECTION 6: DONATIONS & CORE FLOW
    %% ==========================================
    
    USERS ||--o{ DONATION_REQUESTS : "creates-as-donor"
    USERS ||--o{ DONATION_REQUESTS : "accepts-as-volunteer"
    USERS ||--o{ DONATION_REQUESTS : "assigns-as-member"
    SAVED_ADDRESSES ||--o{ DONATION_REQUESTS : "linked-to"
    TEAMS ||--o{ DONATION_REQUESTS : "receives-assignment"
    DONATION_REQUESTS ||--o{ DONATION_ASSIGNMENTS : "has-assignments"
    TEAMS ||--o{ DONATION_ASSIGNMENTS : "assigned-to-team"
    USERS ||--o{ DONATION_ASSIGNMENTS : "assigned-to-member"
    USERS ||--o{ DONATION_ASSIGNMENTS : "assigned-by"
    DONATION_REQUESTS ||--o{ DONATION_STATUS_HISTORY : "tracks-changes"
    USERS ||--o{ DONATION_STATUS_HISTORY : "changed-by"
    
    %% ==========================================
    %% SECTION 7: COMMUNICATION & CHAT
    %% ==========================================
    
    DONATION_REQUESTS ||--o{ CHAT_MESSAGES : "tied-to"
    USERS ||--o{ CHAT_MESSAGES : "sends"
    
    %% ==========================================
    %% SECTION 8: NOTIFICATIONS & ALERTS
    %% ==========================================
    
    USERS ||--o{ NOTIFICATIONS : "receives"
    
    %% ==========================================
    %% SECTION 9: RATINGS & REVIEWS
    %% ==========================================
    
    DONATION_REQUESTS ||--o{ RATINGS : "gets-rated"
    USERS ||--o{ RATINGS : "rates-others-as-rater"
    USERS ||--o{ RATINGS : "gets-rated-by"
    
    %% ==========================================
    %% SECTION 10: MODERATION & REPORTS
    %% ==========================================
    
    USERS ||--o{ REPORTS : "files-reports"
    USERS ||--o{ REPORTS : "gets-reported"
    DONATION_REQUESTS ||--o{ REPORTS : "gets-reported"
    USERS ||--o{ REPORTS : "resolves"
    
    %% ==========================================
    %% SECTION 11: SYSTEM & MIGRATIONS
    %% ==========================================
    
    %% SCHEMA_MIGRATIONS is standalone system table
    
    %% ==========================================
    %% ATTRIBUTES DEFINITION
    %% ==========================================
    
    USERS {
        int id PK
        string name
        string email UK
        string password
        enum role
        boolean email_verified
        string phone
        boolean phone_verified
        string address
        string profile_photo
        date date_of_birth
        enum gender
        string provider
        string google_id UK
        string profile_picture
        boolean is_banned
        int failed_login_attempts
        datetime lock_until
        datetime last_login_at
        string last_login_ip
        string last_user_agent
        boolean is_deleted
        datetime deleted_at
        timestamp created_at
        timestamp updated_at
    }
    
    SCHEMA_MIGRATIONS {
        string id PK
        timestamp applied_at
    }
    
    EMAIL_VERIFICATIONS {
        int id PK
        int user_id FK
        string token_hash UK
        datetime expires_at
        boolean is_used
        timestamp created_at
    }
    
    PASSWORD_HISTORY {
        int id PK
        int user_id FK
        string password_hash
        timestamp created_at
    }
    
    REFRESH_TOKENS {
        int id PK
        int user_id FK
        string token_hash UK
        string user_agent
        string ip_address
        boolean is_revoked
        int replaced_by_token_id FK
        datetime expires_at
        timestamp created_at
    }
    
    AUDIT_LOGS {
        int id PK
        int user_id FK
        string action
        string ip_address
        string user_agent
        text metadata
        timestamp created_at
    }
    
    PASSWORD_RESETS {
        int id PK
        int user_id FK
        string token UK
        datetime expires_at
        boolean is_used
        timestamp created_at
    }
    
    SAVED_ADDRESSES {
        int id PK
        int user_id FK
        enum label
        string custom_label
        string full_address
        string division
        string district
        string area
        string postal_code
        string building_name
        string floor
        string landmark
        string delivery_instructions
        decimal latitude
        decimal longitude
        string contact_person_name
        string contact_phone
        boolean is_default
        timestamp created_at
        timestamp updated_at
    }
    
    USER_PREFERENCES {
        int id PK
        int user_id FK UK
        enum preferred_contact
        boolean receive_notifications
        string preferred_pickup_time
        timestamp created_at
        timestamp updated_at
    }
    
    NOTIFICATION_SETTINGS {
        int id PK
        int user_id FK UK
        boolean email_notifications
        boolean push_notifications
        boolean sms_notifications
        boolean donation_updates
        boolean chat_messages
        boolean rating_notifications
        timestamp created_at
        timestamp updated_at
    }
    
    VOLUNTEER_PROFILES {
        int id PK
        int user_id FK UK
        text bio
        json skills
        json availability
        json service_areas
        enum vehicle_type
        int total_pickups
        decimal rating
        decimal latitude
        decimal longitude
        boolean is_online
        timestamp last_location_update
        decimal coverage_radius
        timestamp created_at
        timestamp updated_at
    }
    
    USER_ACHIEVEMENTS {
        int id PK
        int user_id FK
        string achievement_type UK
        string achievement_name
        string description
        string icon
        timestamp unlocked_at
    }
    
    ACHIEVEMENT_DEFINITIONS {
        int id PK
        string type UK
        string name
        string description
        string icon
        enum role
        enum criteria_type
        int criteria_value
        int points
        boolean is_active
        timestamp created_at
    }
    
    TEAMS {
        int id PK
        string name
        string description
        int leader_id FK UK
        decimal latitude
        decimal longitude
        decimal coverage_radius
        timestamp created_at
        timestamp updated_at
    }
    
    TEAM_MEMBERS {
        int id PK
        int team_id FK
        int user_id FK UK
        enum role
        timestamp joined_at
    }
    
    TEAM_INVITATIONS {
        int id PK
        int team_id FK
        int invited_by FK
        int invited_user_id FK
        string invited_email
        enum status
        datetime expires_at
        datetime responded_at
        timestamp created_at
    }
    
    DONATION_REQUESTS {
        int id PK
        string title
        int donor_id FK
        int volunteer_id FK
        enum assignment_mode
        int team_id FK
        int assigned_member_id FK
        datetime accepted_at
        enum category
        enum food_type
        string food_name
        int quantity
        enum quantity_unit
        int number_of_servings
        string description
        string ingredients
        json allergens
        enum storage_requirement
        enum is_vegetarian
        enum is_halal
        enum refrigeration_required
        enum clothing_category
        enum gender
        enum age_group
        enum item_condition
        string brand
        enum size
        string color
        enum season
        string photo
        json images
        text additional_notes
        string pickup_location
        int saved_address_id FK
        json pickup_address_details
        datetime pickup_time
        date pickup_date
        enum pickup_time_slot
        datetime expiry_date
        string contact_phone
        datetime scheduled_at
        datetime completed_at
        enum status
        boolean is_deleted
        datetime deleted_at
        timestamp created_at
        timestamp updated_at
    }
    
    DONATION_ASSIGNMENTS {
        int id PK
        int donation_id FK UK
        int team_id FK
        int member_id FK UK
        int assigned_by FK
        timestamp assigned_at
        enum status
        datetime completed_at
    }
    
    DONATION_STATUS_HISTORY {
        int id PK
        int donation_request_id FK
        int changed_by FK
        string old_status
        string new_status
        timestamp changed_at
    }
    
    CHAT_MESSAGES {
        int id PK
        int donation_request_id FK
        int sender_id FK
        text message
        boolean is_read
        timestamp created_at
    }
    
    NOTIFICATIONS {
        int id PK
        int user_id FK
        enum type
        string title
        string message
        int related_id
        boolean is_read
        timestamp created_at
    }
    
    RATINGS {
        int id PK
        int donation_request_id FK
        int rated_by FK
        int rated_user FK
        tinyint stars
        string comment
        timestamp created_at
    }
    
    REPORTS {
        int id PK
        int reporter_id FK
        int reported_user_id FK
        int reported_donation_id FK
        string reason
        text details
        text resolution_notes
        enum status
        int resolved_by FK
        timestamp resolved_at
        timestamp created_at
        timestamp updated_at
    }
```

---

## Database Coverage Summary

### Tables Represented: 23/23
1. ✓ users
2. ✓ schema_migrations
3. ✓ email_verifications
4. ✓ password_history
5. ✓ refresh_tokens
6. ✓ audit_logs
7. ✓ password_resets
8. ✓ saved_addresses
9. ✓ user_preferences
10. ✓ notification_settings
11. ✓ volunteer_profiles
12. ✓ user_achievements
13. ✓ achievement_definitions
14. ✓ teams
15. ✓ team_members
16. ✓ team_invitations
17. ✓ donation_requests
18. ✓ donation_assignments
19. ✓ donation_status_history
20. ✓ chat_messages
21. ✓ notifications
22. ✓ ratings
23. ✓ reports

### Views Represented: 2/2
1. ✓ top_donors (Leaderboard view querying users + donation_requests + ratings)
2. ✓ top_volunteers (Leaderboard view querying users + donation_requests + ratings)

### Total Relationships Represented: 38

---

## Relationship Mapping

### One-to-One (1:1) Relationships
- `users` → `user_preferences` (one user has one preference set)
- `users` → `notification_settings` (one user has one notification setting)
- `users` → `volunteer_profiles` (one user has one volunteer profile)
- `teams` → `users` (one leader creates one team, but one user can only lead one team via UK)
- `team_members` → `users` (unique constraint ensures one user per team)

### One-to-Many (1:N) Relationships
- `users` → `email_verifications` (one user can have multiple verification tokens)
- `users` → `password_history` (one user can have multiple password hashes)
- `users` → `password_resets` (one user can have multiple reset tokens)
- `users` → `refresh_tokens` (one user can have many active/revoked tokens)
- `users` → `audit_logs` (one user can generate many audit entries)
- `users` → `saved_addresses` (one user can have max 3 saved addresses)
- `users` → `user_achievements` (one user can unlock multiple achievements)
- `users` → `donation_requests` as donor (one donor posts many donations)
- `users` → `donation_requests` as volunteer (one volunteer accepts many donations)
- `users` → `team_invitations` as sender (one user invites many others)
- `users` → `team_invitations` as invitee (one user receives many invitations)
- `users` → `chat_messages` (one user sends many messages)
- `users` → `notifications` (one user receives many notifications)
- `users` → `ratings` as rater (one user rates many others)
- `users` → `ratings` as ratee (one user gets rated many times)
- `users` → `reports` as reporter (one user files many reports)
- `users` → `reports` as reportee (one user gets reported many times)
- `users` → `reports` as resolver (one admin resolves many reports)
- `teams` → `team_members` (one team has many members)
- `teams` → `team_invitations` (one team sends many invitations)
- `teams` → `donation_requests` (one team receives many assignments)
- `teams` → `donation_assignments` (one team has many assignments)
- `achievement_definitions` → `user_achievements` (one definition unlocks for many users)
- `donation_requests` → `donation_assignments` (one donation has many assignments)
- `donation_requests` → `donation_status_history` (one donation has many status changes)
- `donation_requests` → `chat_messages` (one donation has many messages)
- `donation_requests` → `ratings` (one donation gets multiple ratings)
- `donation_requests` → `reports` (one donation gets multiple reports)
- `saved_addresses` → `donation_requests` (one address used for many donations)
- `refresh_tokens` → `refresh_tokens` (token rotation via replaced_by)

### Many-to-Many (N:M) Relationships
- `users` ↔ `teams` via `team_members` (one user can join many teams; one team has many members)
- `users` ↔ `users` via `donation_requests` + `chat_messages` (donors and volunteers communicate)
- `users` ↔ `users` via `ratings` (donors rate volunteers and vice versa)
- `donation_assignments` (bridge table): `teams` ↔ `donation_requests` (one team can be assigned multiple donations; one donation assigned to multiple team members)

---

## Key Constraints & Features

### Primary Keys
- All tables use `id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY`
- schema_migrations uses `id VARCHAR(100) PRIMARY KEY`

### Unique Keys
- `users.email` - Email uniqueness per system
- `users.google_id` - Google OAuth ID uniqueness
- `user_preferences.user_id` - One preferences per user
- `notification_settings.user_id` - One settings per user
- `volunteer_profiles.user_id` - One profile per volunteer
- `user_achievements` - One achievement type per user (composite UK: user_id, achievement_type)
- `achievement_definitions.type` - Unique achievement type
- `teams.leader_id` - One user can lead max one team
- `team_members.user_id` - One user can only be in one team
- `team_invitations` - Composite UK on (team_id, invited_user_id, status)
- `refresh_tokens.token_hash` - Unique token hash
- `email_verifications.token_hash` - Unique verification token
- `password_resets.token` - Unique reset token
- `donation_assignments` - Composite UK on (donation_id, member_id)
- `ratings` - Composite UK on (donation_request_id, rated_by)
- `reports` - Composite UK on (reporter_id, reported_donation_id)

### Foreign Key Constraints
- All FK constraints use `ON DELETE CASCADE` or `ON DELETE SET NULL` for proper cleanup
- Sensitive FKs like in `ratings.rated_by` and `ratings.rated_user` use `ON UPDATE RESTRICT` (users.id is never updated)
- Same pattern used in `reports` to prevent cascade issues with CHECK constraints

### Check Constraints
- `users.email` - Email format validation
- `saved_addresses` - custom_label only set when label='custom'
- `donation_requests.quantity` - Quantity must be > 0
- `ratings.stars` - Rating between 1-5
- `ratings` - User cannot rate themselves (rated_by ≠ rated_user)
- `reports` - At least one target must be present (reported_user_id OR reported_donation_id)

### Enums (Status Fields)
- `users.role` - donor, volunteer, admin
- `users.gender` - male, female, other, prefer_not_to_say
- `donations.status` - pending, accepted, scheduled, on_the_way, picked_up, completed
- `donation_assignments.status` - assigned, in_progress, completed, cancelled
- `notifications.type` - 23 different notification types (including admin_announcement)
- `team_invitations.status` - pending, accepted, declined, expired
- `reports.status` - pending, reviewed, resolved, dismissed (Migration 015)
- `donation_requests.assignment_mode` - individual, team
- `donation_requests.category` - food, clothes

### JSON Columns (Flexible Storage)
- `volunteer_profiles.skills` - Array of skills
- `volunteer_profiles.availability` - Schedule JSON
- `volunteer_profiles.service_areas` - Service areas (previously service_area, fixed by Migration 013)
- `donation_requests.allergens` - Allergen tags
- `donation_requests.images` - Multiple image URLs
- `donation_requests.pickup_address_details` - Address details snapshot

### Timestamps
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP (all tables)
- `updated_at` - TIMESTAMP ON UPDATE CURRENT_TIMESTAMP (most tables)
- Timezone-aware: Uses server timezone

### Soft Deletes
- `users.is_deleted` + `users.deleted_at` - Soft delete pattern
- `donation_requests.is_deleted` + `donation_requests.deleted_at` - Soft delete pattern

---

## Functional Groupings

### User & Authentication (7 tables)
- Core: `users`, `email_verifications`, `password_history`, `password_resets`, `refresh_tokens`
- Audit: `audit_logs`
- Meta: `schema_migrations`

### User Configuration (2 tables)
- `user_preferences`
- `notification_settings`

### Volunteer Profile (1 table)
- `volunteer_profiles`

### Achievements & Gamification (2 tables)
- `user_achievements`
- `achievement_definitions`

### Addresses (1 table)
- `saved_addresses`

### Teams & Collaboration (3 tables)
- `teams`
- `team_members`
- `team_invitations`

### Donation Core (4 tables)
- `donation_requests` (main entity)
- `donation_assignments` (team assignments)
- `donation_status_history` (audit trail)
- `chat_messages` (donor-volunteer communication)

### Notifications (1 table)
- `notifications`

### Social Features (2 tables)
- `ratings`
- `reports`

---

## Verification Report

### Schema Cross-Check
✓ **PASS** - All tables match main_schema.sql exactly
✓ **PASS** - All migrations (002-015) have been incorporated
✓ **PASS** - Both views (top_donors, top_volunteers) are included
✓ **PASS** - Schema structure matches migrations directory

### Primary Key Verification
✓ **PASS** - Every table has exactly one primary key
✓ **PASS** - All PKs use INT UNSIGNED AUTO_INCREMENT (except schema_migrations)
✓ **PASS** - No composite primary keys

### Foreign Key Verification
✓ **PASS** - 38 foreign key relationships identified and mapped
✓ **PASS** - All FKs reference correct parent tables
✓ **PASS** - All FKs have appropriate ON DELETE/UPDATE actions
✓ **PASS** - No orphaned FK references

### Relationship Cardinality Verification
✓ **PASS** - 5 one-to-one (1:1) relationships
✓ **PASS** - 29 one-to-many (1:N) relationships
✓ **PASS** - 4 many-to-many (N:M) relationships with bridge tables
✓ **PASS** - All cardinalities match backend models and SQL constraints

### Duplicate ERD Check
✓ **PASS** - This is the primary/canonical ERD
✓ **PASS** - No duplicate erd-new.md, erd-final.md, erd-v2.md, or erd-copy.md files exist
✓ **PASS** - Single source of truth established at `docs/portionbridge-erd.md`

---

## Database Characteristics

| Metric | Value |
|--------|-------|
| **Total Tables** | 23 |
| **Total Views** | 2 |
| **Total Relationships** | 38 |
| **Character Set** | utf8mb4 (full Unicode + emoji) |
| **Collation** | utf8mb4_general_ci |
| **Engine** | InnoDB |
| **MySQL Version** | 8.0.16+ / MariaDB 10.2.1+ |
| **Soft Deletes** | 2 tables (users, donation_requests) |
| **Audit Tables** | 3 (audit_logs, donation_status_history, password_history) |
| **JSON Columns** | 3 tables |
| **Enum Columns** | 30+ across schema |
| **Unique Constraints** | 24+ |
| **Check Constraints** | 6+ |

---

## Related Documentation

- Database schema: [main_schema.sql](../portionbridge/database/main_schema.sql)
- Migrations: [migrations/](../portionbridge/database/migrations/)
- Triggers: [triggers.sql](../portionbridge/database/triggers.sql)
- Dummy data: [dummy_data.sql](../portionbridge/database/dummy_data.sql)

---

**Last Updated:** September 1, 2026  
**Current Migration:** 015 (Report Moderation Fields)  
**Diagram Format:** Mermaid ER Diagram  
**Status:** ✓ Complete & Verified
