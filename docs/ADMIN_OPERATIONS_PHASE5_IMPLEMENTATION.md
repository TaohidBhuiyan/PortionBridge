# Phase 5 — Admin Disaster Operations Dashboard & Nationwide Relief Coordination

## Verified starting point (Phases 0–4, from the code)
Already present and **reused, not rebuilt**: incident verification/status workflow with audit (`disasterIncident.service`), relief requests/items with authoritative quantity totals (`utils/reliefQuantity`, `reliefRequestItem.model`), pledges with pickup logistics, volunteer tasks (accept/schedule/pickup/delivery/failure/problem, release), **reported vs verified delivery** with admin verify/reject/resolve (`reliefReview.service`), pledge cancel by admin, Phase 4 alerts + outbox + notifications, audit log, the admin Relief Review and Disaster Alerts pages.
Gaps closed in Phase 5: ops dashboard + filters, richer lists, incident history/merge/request-info/reopen, request correction + reassessment, quantity history with mandatory reasons, admin assign/reassign/release/cancel, delivery correction, reports + CSV export.
Not available in the data model: **upazila** (no column on incidents, requests or users) — filtering is by division (derived from district) and district; the API/UI say so. There is **no multi-level admin role** (single `admin` role), so "least privilege" means: every operation is admin-only and no donor/volunteer can reach any of it.

## Database (migration 032)
`disaster_incidents`: status `merged`, `merged_into_id/at/by`, `info_requested_*` · `disaster_incident_history` · `relief_requests`: `reassessment_*`, `correction_*` · `relief_item_quantity_history` · `relief_task_assignments` · `relief_delivery_corrections`.

## APIs — `/api/v1/admin/ops/*` (all: Bearer + `authorize('admin')`, validated)
Read: `GET dashboard | incidents | incidents/:id | requests | requests/:id/quantity-history | tasks | tasks/:pledgeId/assignments | exceptions | volunteers | reports | export?dataset=incidents|requests|quantities|tasks`
Write: `POST incidents/:id/request-info | merge | reopen` · `POST requests/:id/request-correction | reassessment`, `DELETE requests/:id/reassessment` · `POST tasks/:pledgeId/assign | reassign | release | cancel` · `POST deliveries/:reportId/correct`.
Unchanged existing endpoints still do the rest: incident verify/reject/resolve (`PATCH /relief/incidents/:id/status`), request approve/reject (`PATCH /relief/requests/:id/status`), delivery verify/reject/resolve (`/relief/admin/reports/*`), alerts (`/api/v1/alerts`).
Modified: item add/update/remove accept `reason` (**required** when the request is already approved); `PATCH /relief/incidents/:id` accepts an optional `reason` stored in the incident history.

## Verification & permission rules
- Nothing is verified automatically: donor/volunteer submissions stay `reported`; only an admin moves an incident to `verified` (`PATCH …/status`), rejection requires a reason, reopening (resolved→active, rejected→under_review) requires a justification.
- Delivery reported by a volunteer is **never** verified delivered until an admin verifies it; a verified quantity cannot exceed the reported one.
- Request-info only while awaiting verification; the incident stays unverified.
- Alerts keep the Phase 4 rules (verified incident only; nationwide ≥ high; admin only).

## Duplicate incidents — merge strategy
`POST incidents/:id/merge {targetIncidentId, reason}`. The duplicate is **kept** with status `merged` and `merged_into_id`; its relief requests are re-pointed to the surviving incident in the same transaction, so pledges, tasks, deliveries, alerts-history and audit rows keep their ids. A live alert on the duplicate is cancelled through the Phase 4 hook. Rules: no self-merge, no double merge, target must not be merged/rejected, a verified duplicate only merges into a verified incident, and open requests need a verified/active target. Merged incidents are hidden from public lists and from dashboard totals (admins can filter `status=merged`). Rows are never deleted.

## How the numbers are calculated (all live SQL, `models/adminOps.model.js`)
- Incident counts exclude `merged`. *Awaiting verification* = reported + under_review; *verified/active* = verified + active; *critical/high* = severity high|critical while still open.
- Per item and unit (units never mixed): **requested** = active item quantity; **pledged** = open pledges' undelivered balance + verified delivered; **collected** = collected quantity of non-cancelled/failed pledges; **verified delivered** = `quantity_delivered` (admin-verified only); **awaiting verification** = reported, unverified delivery; **still needed** = requested − verified delivered.
- *Approved, unfulfilled* = approved requests with at least one active item whose verified delivered < requested.
- *Needs reassessment* = admin-flagged, or approved request whose incident is resolved/rejected/merged, or past `expires_at`.
- *Delayed* = pledge still open and the donation's latest status change is older than `RELIEF_TASK_DELAY_HOURS` (default 24), or an unassigned approved pledge older than that. Present-tense only.
- Failed = pledge `failed`; open issues = reports `open`; discrepancies = verified delivery with verified < reported.
- Timing metrics (report→verification, request→approval, pledge→first acceptance, delivery report→verification, approval→completion) use only rows that carry both timestamps and show the sample size; with no data they read "not available" — nothing is estimated.

## Delivery correction (no double counting)
`POST deliveries/:reportId/correct {verifiedQuantity, reason}` on a *verified* delivery report. Under the existing lock order (request→item→pledge) the pledge total changes by **new − old** only; invalid results (exceeds reported, collected, or pledged) are refused. The pledge status is recomputed (delivered / partially_fulfilled / failed for closed pledges), a completed request is reopened to `approved` if it is no longer fully delivered (and completed again if it becomes so). Every correction is stored (`relief_delivery_corrections`) and audited; donor and volunteer are notified. The underlying pickup donation record is not rewritten.

## Volunteer coordination
Assign / reassign / release / cancel each need a reason, write `relief_task_assignments` + audit, and notify the volunteer. Eligibility is the **existing** rule (base location on file + task within coverage radius) — it is checked before the current volunteer is released on reassign. Only tasks not yet picked up can be reassigned; team tasks are left to the existing team tools. Volunteer lists expose name, vehicle, workload, rating, distance and eligibility only.

## Reports & export
Counts by type/severity/status/district/division, verified vs rejected, requests by status, quantities by item+unit, per-incident fulfilment, task outcomes, trends (day/week/month), timings with sample sizes. CSV export (incidents, requests, quantities, tasks): admin-only, validated filters, ≤10,000 rows, **no names/phones/emails/addresses**, spreadsheet-formula neutralised, audited.

## Configuration
`RELIEF_TASK_DELAY_HOURS` (default 24). Phase 4 settings unchanged.

## Known limitations / dependencies
- No upazila data; no finer admin roles; single `admin` role.
- Incident/request history before Phase 5 exists only in the audit log (the UI says so).
- Correcting a delivery does not rewrite the donor's pickup donation record.
- Reassigning needs the new volunteer to satisfy the existing acceptance rules; a task already picked up cannot be reassigned (cancel/verify flows apply).
- Incident field corrections reuse the existing incident edit form; the ops page records and shows them but does not duplicate the form.
- Migration 032 is not folded into `main_schema.sql` (same as 029–031).
- Pre-existing and unrelated: the `achievement` integration test fails on the original upload; client lint has 118 pre-existing problems (unchanged).
