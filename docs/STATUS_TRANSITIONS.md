# Status models and valid transitions (verified against the code, Phase 6)

All transitions are enforced **on the backend** (service layer, inside a transaction with row locks); the UI only offers valid actions. Illegal transitions return HTTP 409 (or 422 for a missing mandatory reason).

## Disaster incident — `disaster_incidents.status` (+ `verification_status`)
`reported → under_review | rejected` · `under_review → verified | rejected` · `verified → active | resolved` · `active → resolved` · `resolved → active` (reopen, reason required) · `rejected → under_review` (reopen, reason required) · `merged` = terminal (no outgoing transition, read-only).
- Only an **admin** changes status. A reporter's payload can never set status or verification; creation always starts `reported`/unverified.
- Rejection needs a reason. Verification stamps verifier + time. `merged` is set only by the admin merge operation (duplicate kept, requests re-pointed, live alert withdrawn).
- Public visibility: `verified`, `active`, `resolved` only (approximate coordinates). `reported`/`under_review`/`rejected`/`merged` are visible to admins (and the reporter for their own unverified report).
- Pledging, new requests, task acceptance and alerts require an **open** incident (`verified`/`active`).

## Relief request — `relief_requests.status`
`pending_review → approved | rejected | cancelled` · `approved → cancelled | expired` · `completed` is **automatic only** (every active item verified fully delivered) and is **reopened to `approved` by a delivery correction** that makes it unfulfilled again (and completed again when fulfilled). `rejected`, `cancelled`, `expired` are terminal.
Approval is a separate admin action and needs at least one item. Items may not drop below committed quantity; changing quantities on an approved request needs a reason and is written to `relief_item_quantity_history`.

## Pledge — `relief_pledges.status`
`pledged → collected → delivered | partially_fulfilled | failed` · `pledged|collected → cancelled` (donor or admin, only while nothing is verified delivered and goods are not in transit without an admin) · `failed ⇄ pledged/collected` only by admin reopening a failed delivery. A **delivery correction** may move a closed pledge between `delivered`, `partially_fulfilled` and `failed` according to the corrected verified total. Cancelled/failed pledges stop counting toward "pledged"; verified delivered quantities stay counted.

## Volunteer task (the linked `donation_requests` row)
Existing donation flow, unchanged: `pending → accepted → scheduled → on_the_way → picked_up → completed` (plus `cancelled`/failure paths). Relief tasks add: acceptance follows the existing radius/first-come rules; a volunteer may release before pickup; an admin may assign/reassign/release/cancel (not after pickup; team tasks use the team tools). **Reported** delivery (`delivery` report) stays `pending` until an admin **verifies** it; only verification increases `quantity_delivered` (verified ≤ reported).

## Delivery report — `relief_pledge_reports.status`
`pending → verified | rejected` · `open → closed | resolved` for problem/failed-delivery reports · a `verified` delivery may be **corrected** by an admin (verified ≤ reported, totals adjusted by the difference, audited in `relief_delivery_corrections`).

## Alert — `disaster_alerts.status` / events
Alert: `active → resolved | cancelled`, `resolved → cancelled`; one `active` alert per incident (database-enforced). Events (outbox): `pending → processing → completed | failed`, `failed → pending` (admin retry) — each with a unique `dedupe_key`, so a repeat can never notify twice.

## Notification
No status machine: rows are created once (unique per user + alert event for alerts) and only `is_read` flips (own rows only).
