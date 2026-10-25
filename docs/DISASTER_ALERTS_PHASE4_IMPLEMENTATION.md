# Phase 4 — Nationwide Disaster Alerts, Smart Notifications & Emergency Updates

## What was reused (verified in code)
- `notifications` table + `notification.service` (database first, then a Socket.io push to the recipient's **own** authenticated sockets), `NotificationsPage`, `NotificationDropdown`, unread counter.
- Incident model: `disaster_incidents.severity` (`low|moderate|high|critical`), `status` (`reported → under_review → verified → active → resolved`, `rejected`), `verification_status`. **Alerts reuse this severity enum**; there is no second severity field. *Information / Warning / High priority / Critical emergency* are display labels for those four values.
- Audit log, relief request/pledge/task lifecycle and the existing `notifyRelief` notices (extended to carry deep-link ids).

## Data model (migration 031)
`disaster_alerts` (one live alert per incident, enforced by a unique generated column) · `disaster_alert_districts` · `disaster_alert_events` (**outbox**: unique `dedupe_key`, states `pending|processing|completed|failed`) · `disaster_alert_preferences` + `_pref_districts` + `_pref_categories` · `notifications` gains `incident_id, relief_request_id, relief_pledge_id, alert_event_id, severity` and `UNIQUE (user_id, alert_event_id)`.

## Lifecycle → alert events
| Trigger | Result |
|---|---|
| Admin verifies an incident (or raises its severity), stored severity ≥ `ALERT_AUTO_LOCAL_MIN_SEVERITY` (default `high`), no live alert | auto **local** alert, event `issued` (never nationwide) |
| Admin issues an alert (`POST /alerts`) | `issued` — incident must be admin-verified and `verified`/`active` |
| Admin updates an alert | `escalated` (severity up) · `area_expanded` (scope widened / districts added / radius up) · `updated` |
| Incident severity raised above the live alert's | `escalated` (automatic) |
| Relief request approved while an alert is live | `relief_update` (once per request) |
| Requested quantity of an approved request edited | `relief_update`, at most once per request per hour |
| Admin correction | `correction` → people the alert already reached |
| Incident resolved / admin resolves | `resolved` (alert becomes `resolved`) |
| Admin cancels (reason required, audited) | `cancelled` → withdrawal notice; frees the incident for a new alert |

Unverified incidents never enter the outbox and the dispatcher re-checks verification at delivery time. Ordinary database updates produce nothing.
Not in the current data model: *withdrawn/duplicate* incident statuses (rejected = incorrect; duplicate **alerts** are prevented by the one-live-alert rule and can be cancelled) and **upazila** (neither incidents nor users have it), so targeting is district + coordinates.

## Targeting (one set-based query — `models/alertAudience.model.js`)
Eligible: active, non-banned **donors and volunteers**; a user matching several rules is returned once.
1. **Mandatory** — scope `nationwide` and severity `critical`: everyone, regardless of optional settings.
2. **Nationwide** — scope `nationwide`: users with nationwide alerts on (default on) whose minimum level / categories accept it.
3. **Nearby** — any scope: nearby alerts on, filters accept it, and (a) a preferred district is one of the alert's districts, or (b) their coarse alert centre (volunteers: existing base location as fallback) is within `min(user radius [default 25 km], alert radius)` of the incident coordinates. Missing/invalid coordinates never match (no error).
4. **Involved** — donors with an open pledge / volunteers on an active relief task for the incident always get updates.
5. **Prior recipients** — corrections, resolutions and cancellations go to exactly the people the alert already reached.
A nationwide alert's district list lets users who turned nationwide off still hear about their own affected area. Nationwide scope requires severity `high` or `critical`.

**Mandatory policy vs optional personalisation:** users may switch off nearby alerts, non-critical nationwide alerts, categories, a minimum level, or the in-app alert inbox. They cannot switch off *critical nationwide* alerts. Admins cannot override any other opt-out. The preferences API returns this policy text.

**Location privacy:** browser location is requested only when the user presses "Use my approximate location"; it is rounded server-side to 2 decimals (~1.1 km) and clearable. Districts work without any location. Audit entries never contain coordinates; notification text contains no addresses or phone numbers.

## Deduplication & retry
- The outbox row is written **in the same transaction** as the change, so a failed delivery can't lose the event. A failing alert hook never blocks verifying an incident; deadlocks/lock timeouts are re-thrown to the existing retry.
- `dedupe_key` (`alert:12:issued`, `alert:12:v3`, `alert:12:relief:40:approved`, `…:qty:<hour>`, optional admin `requestKey`) makes repeated requests no-ops.
- A worker **claims** an event with one atomic `UPDATE`; exactly one wins; completed events are never re-claimed; stale `processing` claims (5 min) are recoverable.
- Delivery is `INSERT IGNORE` on `UNIQUE (user_id, alert_event_id)`: a re-run only adds who is missing.
- Failures are stored (`failed`, `last_error`); the sweeper retries up to `ALERT_MAX_ATTEMPTS`, then an admin presses **Retry delivery**.
- Socket push happens after rows exist, only to the recipient's own sockets, and never fails the event; offline users read the DB-backed inbox.

## APIs
User (Bearer): `GET/PUT /api/v1/alerts/preferences`, `GET /api/v1/alerts/active[?incidentId=]`; `GET /api/v1/notifications` now also returns `incident_id, relief_request_id, relief_pledge_id, severity` plus live `incident_status`/`incident_updated_at` (filter `?type=disaster_alert`).
Admin only (`authorize('admin')`, publish/update rate-limited 30/h): `POST /alerts/preview`, `POST /alerts`, `GET /alerts`, `GET /alerts/:id`, `PATCH /alerts/:id`, `POST /alerts/:id/correction|resolve|cancel`, `POST /alerts/:id/events/:eventId/retry`.

## Configuration
`ALERT_AUTO_LOCAL_MIN_SEVERITY` (default `high`; `off` disables auto alerts), `ALERT_SWEEP_INTERVAL_MS` (60000; 0 disables), `ALERT_MAX_ATTEMPTS` (5), `ALERT_STALE_CLAIM_SECONDS` (300). No secrets or new services.

## Channels — honest status
Only the **in-app inbox + Socket.io** exist. No SMS, email, WhatsApp or push integration is configured; none is claimed and the admin UI says so. To add one later, consume `disaster_alert_events` with a per-channel delivery table — the outbox and dedupe key are channel-agnostic.

## Known limitations
- The sweeper is in-process (claims keep multiple nodes safe, but each node runs its own).
- District matching is exact (case-insensitive): an incident entered as "Chittagong" won't match "Chattogram".
- The inbox "Disaster Alerts" tab filters the notifications already loaded.
- Realtime push is skipped for rows created by an earlier failed attempt of the same event (they show up in the inbox).
- Migration 031 isn't folded into `main_schema.sql` (same as 029/030).
- Pre-existing and unrelated: the `achievement` integration test fails on the original upload too; client lint has 118 pre-existing problems (unchanged).
