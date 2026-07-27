# PortionBridge — Database Documentation

Complete reference for every table, column, constraint, view, and trigger in the `portionbridge` schema.

---

## 1. `users`

Stores every Donor, Volunteer, and Admin account.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INT UNSIGNED | PK, AUTO_INCREMENT | Surrogate primary key |
| `name` | VARCHAR(100) | NOT NULL | Full name |
| `email` | VARCHAR(150) | NOT NULL, UNIQUE | Login identifier |
| `password` | VARCHAR(255) | NOT NULL | bcrypt hash (never plaintext) |
| `role` | ENUM('donor','volunteer','admin') | NOT NULL, DEFAULT 'donor' | Account type |
| `phone` | VARCHAR(20) | NULL | Contact number |
| `address` | VARCHAR(255) | NULL | Default address |
| `profile_photo` | VARCHAR(255) | NULL | Path/URL to uploaded photo |
| `is_banned` | TINYINT(1) | DEFAULT 0 | Admin ban flag |
| `is_deleted` | TINYINT(1) | DEFAULT 0 | Soft delete flag |
| `deleted_at` | DATETIME | NULL | Soft delete timestamp |
| `created_at` / `updated_at` | TIMESTAMP | auto-managed | Audit fields |

**Constraints:**
- `uq_users_email` — UNIQUE on `email` (no two accounts share an email)
- `chk_users_email_format` — CHECK that email loosely matches `x@y.z` pattern

**Indexes:** `role`, `is_deleted`, `is_banned` (all frequently filtered in queries like "list active volunteers")

---

## 2. `password_resets`

Backing table for the Forgot Password flow (reset link or OTP). Not yet wired to an API in this phase — schema only.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INT UNSIGNED | PK, AUTO_INCREMENT | |
| `user_id` | INT UNSIGNED | FK → users.id, CASCADE | Owner of the reset request |
| `token` | VARCHAR(255) | NOT NULL, UNIQUE | Random reset token or OTP hash |
| `expires_at` | DATETIME | NOT NULL | Expiry deadline |
| `is_used` | TINYINT(1) | DEFAULT 0 | Prevents token reuse |
| `created_at` | TIMESTAMP | auto | |

---

## 3. `donation_requests`

The core entity — one row per donation post, tracking its entire lifecycle.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INT UNSIGNED | PK, AUTO_INCREMENT | |
| `donor_id` | INT UNSIGNED | FK → users.id, CASCADE | Who posted the donation |
| `volunteer_id` | INT UNSIGNED | FK → users.id, SET NULL, nullable | Who accepted it (null until accepted) |
| `category` | ENUM('food','clothes') | NOT NULL | |
| `quantity` | INT UNSIGNED | NOT NULL, CHECK > 0 | |
| `description` | VARCHAR(500) | NULL | |
| `photo` | VARCHAR(255) | NULL | Uploaded donation photo path |
| `pickup_location` | VARCHAR(255) | NOT NULL | |
| `pickup_time` | DATETIME | NOT NULL | Donor's requested window |
| `scheduled_at` | DATETIME | NULL | Confirmed time once donor approves volunteer's proposal |
| `status` | ENUM('pending','accepted','on_the_way','picked_up','completed') | NOT NULL, DEFAULT 'pending' | Lifecycle stage |
| `is_deleted` | TINYINT(1) | DEFAULT 0 | Soft delete (donor cancels while still pending) |
| `deleted_at` | DATETIME | NULL | |
| `created_at` / `updated_at` | TIMESTAMP | auto | |

**Constraints:**
- `chk_donation_quantity` — quantity must be positive
- `fk_donation_donor` — cascades delete (if a donor account is hard-removed, their posts go too)
- `fk_donation_volunteer` — sets NULL on delete (a removed volunteer doesn't delete the donation post itself)

**Indexes:** `status`, `category`, `donor_id`, `volunteer_id`, `is_deleted`, `pickup_location` — all support the Browse/Filter/Search volunteer flow.

**Application-layer note:** the accept-donation API call should wrap the `UPDATE donation_requests SET volunteer_id = ?, status = 'accepted' WHERE id = ? AND status = 'pending'` inside a transaction to prevent two volunteers accepting the same request simultaneously (race condition / ACID demonstration, as noted in the planning document).

---

## 4. `donation_status_history`

Append-only audit trail. A new row is written automatically by database triggers every time a donation request is created or its status changes — application code never needs to insert into this table directly.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INT UNSIGNED | PK, AUTO_INCREMENT | |
| `donation_request_id` | INT UNSIGNED | FK → donation_requests.id, CASCADE | |
| `changed_by` | INT UNSIGNED | FK → users.id, SET NULL, nullable | Who caused the transition |
| `old_status` | VARCHAR(20) | NULL | NULL on the very first (creation) row |
| `new_status` | VARCHAR(20) | NOT NULL | |
| `changed_at` | TIMESTAMP | auto | |

---

## 5. `chat_messages`

Persistent one-to-one chat between a donor and the volunteer who accepted their request, scoped per donation.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INT UNSIGNED | PK, AUTO_INCREMENT | |
| `donation_request_id` | INT UNSIGNED | FK → donation_requests.id, CASCADE | Chat room key |
| `sender_id` | INT UNSIGNED | FK → users.id, CASCADE | |
| `message` | TEXT | NOT NULL | |
| `is_read` | TINYINT(1) | DEFAULT 0 | Basic read/unread indicator |
| `created_at` | TIMESTAMP | auto | Message ordering |

---

## 6. `notifications`

Per-user in-app notifications. Rows for `donation_accepted` and `status_updated` (completed) are created automatically by the `donation_requests` triggers; `new_message`, `rating_received`, and `report_filed` are inserted by application code (Socket.io handlers / controllers) in later phases.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INT UNSIGNED | PK, AUTO_INCREMENT | |
| `user_id` | INT UNSIGNED | FK → users.id, CASCADE | Recipient |
| `type` | ENUM(...) | NOT NULL | See allowed values below |
| `title` | VARCHAR(150) | NOT NULL | |
| `message` | VARCHAR(500) | NOT NULL | |
| `related_id` | INT UNSIGNED | NULL, no FK (polymorphic) | Points at a donation/chat/etc. depending on `type` |
| `is_read` | TINYINT(1) | DEFAULT 0 | |
| `created_at` | TIMESTAMP | auto | |

**Allowed `type` values:** `donation_accepted`, `new_message`, `status_updated`, `rating_received`, `report_filed`

---

## 7. `ratings`

Mutual 1–5 star ratings exchanged between donor and volunteer after a donation reaches `completed`.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INT UNSIGNED | PK, AUTO_INCREMENT | |
| `donation_request_id` | INT UNSIGNED | FK → donation_requests.id, CASCADE | |
| `rated_by` | INT UNSIGNED | FK → users.id, CASCADE | Who is giving the rating |
| `rated_user` | INT UNSIGNED | FK → users.id, CASCADE | Who is being rated |
| `stars` | TINYINT UNSIGNED | NOT NULL, CHECK 1–5 | |
| `comment` | VARCHAR(500) | NULL | |
| `created_at` | TIMESTAMP | auto | |

**Constraints:**
- `uq_rating_per_donation_rater` — UNIQUE(`donation_request_id`, `rated_by`) — a user can only rate once per donation
- `chk_ratings_stars` — must be between 1 and 5
- `chk_ratings_not_self` — a user cannot rate themselves

---

## 8. `reports`

Flags raised against either a user or a donation post, reviewed by an Admin.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INT UNSIGNED | PK, AUTO_INCREMENT | |
| `reporter_id` | INT UNSIGNED | FK → users.id, CASCADE | Who filed the report |
| `reported_user_id` | INT UNSIGNED | FK → users.id, CASCADE, nullable | Target user (if applicable) |
| `reported_donation_id` | INT UNSIGNED | FK → donation_requests.id, CASCADE, nullable | Target post (if applicable) |
| `reason` | VARCHAR(500) | NOT NULL | |
| `status` | ENUM('pending','reviewed','resolved') | DEFAULT 'pending' | Admin workflow state |
| `created_at` / `updated_at` | TIMESTAMP | auto | |

**Constraints:**
- `chk_reports_target_present` — at least one of `reported_user_id` / `reported_donation_id` must be set

---

## 9. Views

### `top_donors`
Aggregates each donor's total donations, completed count, total quantity donated, and average rating received — powers the Leaderboard and the Donor Personal Dashboard.

### `top_volunteers`
Aggregates each volunteer's total pickups, completed count, and average rating received — powers the Leaderboard and the Volunteer Personal Dashboard.

Both views automatically exclude soft-deleted users and soft-deleted donation requests, and recompute live on every query (no separate storage or refresh needed).

---

## 10. Triggers

### `trg_donation_status_insert`
Fires `AFTER INSERT` on `donation_requests`. Writes the initial history row (`old_status = NULL`, `new_status = 'pending'`) so every donation has a complete history from the moment it's created.

### `trg_donation_status_update`
Fires `AFTER UPDATE` on `donation_requests`, only when `status` actually changes:
1. Always logs the transition into `donation_status_history`.
2. If the new status is `accepted`, creates a `donation_accepted` notification for the donor.
3. If the new status is `completed`, creates a `status_updated` notification for both the donor and (if assigned) the volunteer.

These two triggers are what the planning document's DBMS Evaluation Checklist refers to as "Auto-notification + status history logging on status change."

---

## 11. Engineering Hygiene Checklist Coverage

| Requirement | How it's satisfied |
|---|---|
| ER Diagram | `er_diagram.md`, drawn before implementation |
| Normalization (3NF) | See "Why This Is 3NF" in `er_diagram.md` |
| Foreign Keys | All FKs declared with explicit `ON DELETE` rules |
| Constraints | `CHECK`, `UNIQUE`, `NOT NULL` used throughout |
| Indexes | On every frequently filtered/searched column |
| Views | `top_donors`, `top_volunteers` |
| Trigger | `trg_donation_status_insert`, `trg_donation_status_update` |
| Soft Delete | `is_deleted` + `deleted_at` on `users` and `donation_requests` |
| Status History | `donation_status_history`, fully automated via triggers |
| Audit Fields | `created_at` / `updated_at` on every table |
