const { RELIEF } = require('../constants');

/**
 * Quantity rules for the Disaster Relief module — the ONE place they are defined.
 *
 * Every quantity is DECIMAL(12,3) in MySQL. mysql2 returns DECIMAL as a string and
 * JS floats cannot add 0.1 + 0.2 exactly, so all arithmetic here is done on
 * integer "milli-units" (value * 1000). Convert at the edges only.
 *
 * ---------------------------------------------------------------------------
 * DEFINITIONS (per requested item; pledges = rows of relief_pledges)
 * ---------------------------------------------------------------------------
 *   requested            relief_request_items.quantity_requested (fixed requirement)
 *   activePledged        outstanding commitments not yet delivered:
 *                          SUM(quantity_pledged - quantity_delivered)
 *                          over pledges with status IN ('pledged','collected')
 *   collected            cumulative goods collected from donors:
 *                          SUM(quantity_collected) over status NOT IN ('cancelled','failed')
 *   delivered            cumulative VERIFIED goods delivered to the affected location:
 *                          SUM(quantity_delivered) over status NOT IN ('cancelled','failed')
 *                          (a volunteer's delivery report is NOT counted until it is verified)
 *   pendingVerification  delivery REPORTED by volunteers, awaiting admin verification.
 *                          It is informational only: it never reduces remaining
 *                          quantities and is never counted as delivered.
 *   committed            activePledged + delivered
 *                          (a delivered or partially_fulfilled pledge only commits
 *                           what was actually delivered; the shortfall is released;
 *                           a cancelled pledge commits nothing)
 *   remainingToPledge    requested - committed        (guard for NEW pledges; never < 0)
 *   remainingUnfulfilled requested - delivered        (what must still physically arrive)
 *   collectedAwaitingDelivery  collected - delivered
 *
 *   fulfillmentStage (derived, never stored):
 *     cancelled          item removed from the request
 *     fulfilled          delivered >= requested
 *     partially_delivered delivered > 0
 *     fully_pledged      committed >= requested   (NOT fulfilled — nothing may be delivered yet)
 *     partially_pledged  committed > 0
 *     open               otherwise
 *
 * Invariants (also enforced by CHECK constraints on relief_pledges):
 *   0 <= delivered <= collected <= pledged   (per pledge)
 *   committed <= requested                   (enforced under row lock when pledging)
 */

const SCALE = RELIEF.QUANTITY_SCALE;

/**
 * SQL aggregate expressions implementing the definitions above. Used by every
 * query that reports totals so all APIs share exactly the same logic.
 * `p` must be the alias of relief_pledges.
 */
const PLEDGE_TOTALS_SQL = `
  COALESCE(SUM(CASE WHEN p.status IN ('pledged', 'collected') THEN p.quantity_pledged - p.quantity_delivered ELSE 0 END), 0) AS active_pledged,
  COALESCE(SUM(CASE WHEN p.status NOT IN ('cancelled', 'failed') THEN p.quantity_collected ELSE 0 END), 0) AS collected,
  COALESCE(SUM(CASE WHEN p.status NOT IN ('cancelled', 'failed') THEN p.quantity_delivered ELSE 0 END), 0) AS delivered,
  COALESCE(SUM(CASE WHEN p.status IN ('pledged', 'collected') THEN p.quantity_pending_verification ELSE 0 END), 0) AS pending_verification
`;

const QUANTITY_INPUT_PATTERN = /^\d{1,9}(\.\d{1,3})?$/;

/**
 * Parses an API quantity (number or numeric string) into integer milli-units.
 * Returns null for anything that is not a plain decimal with at most 3 decimal
 * places and at most 9 integer digits (rejects NaN, Infinity, exponent notation,
 * booleans, arrays, objects). Zero is only accepted when allowZero is set.
 */
function parseQuantity(value, { allowZero = false } = {}) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const text = String(value).trim();
  if (!QUANTITY_INPUT_PATTERN.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  const milli = Number(whole) * SCALE + Number(fraction.padEnd(3, '0'));
  if (milli === 0 && !allowZero) return null;
  return milli;
}

/** DECIMAL string from MySQL (or number) -> integer milli-units. */
function dbToMilli(value) {
  if (value === null || value === undefined) return 0;
  return Math.round(Number(value) * SCALE);
}

/** integer milli-units -> exact DECIMAL string for SQL parameters ("12.500"). */
function milliToDb(milli) {
  const whole = Math.floor(milli / SCALE);
  const fraction = String(milli % SCALE).padStart(3, '0');
  return `${whole}.${fraction}`;
}

/** integer milli-units -> JS number for API responses (exact to 3 decimals). */
function milliToNumber(milli) {
  return milli / SCALE;
}

/** Indivisible units (piece, packet, box, set) must be whole numbers. */
function isValidForUnit(milli, unit) {
  if (RELIEF.FRACTIONAL_UNITS.includes(unit)) return true;
  return milli % SCALE === 0;
}

/** Lower-cases and collapses whitespace so "Dry  Food" and "dry food" are the same item. */
function normalizeItemKey(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase().slice(0, 100);
}

/**
 * Builds the quantity summary for one item from its requested quantity and the
 * three aggregates produced by PLEDGE_TOTALS_SQL (all accepted as DB decimals).
 */
function buildQuantitySummary({ requested, activePledged, collected, delivered, pendingVerification = 0, itemStatus = 'active' }) {
  const req = dbToMilli(requested);
  const active = dbToMilli(activePledged);
  const coll = dbToMilli(collected);
  const del = dbToMilli(delivered);
  const pending = dbToMilli(pendingVerification);

  const committed = active + del;
  const remainingToPledge = Math.max(0, req - committed);
  const remainingUnfulfilled = Math.max(0, req - del);

  let fulfillmentStage = 'open';
  if (itemStatus === 'cancelled') fulfillmentStage = 'cancelled';
  else if (del >= req) fulfillmentStage = 'fulfilled';
  else if (del > 0) fulfillmentStage = 'partially_delivered';
  else if (committed >= req) fulfillmentStage = 'fully_pledged';
  else if (committed > 0) fulfillmentStage = 'partially_pledged';

  return {
    requested: milliToNumber(req),
    activePledged: milliToNumber(active),
    collected: milliToNumber(coll),
    delivered: milliToNumber(del),
    committed: milliToNumber(committed),
    remainingToPledge: milliToNumber(remainingToPledge),
    remainingUnfulfilled: milliToNumber(remainingUnfulfilled),
    collectedAwaitingDelivery: milliToNumber(Math.max(0, coll - del)),
    pendingVerification: milliToNumber(pending),
    fulfillmentStage,
  };
}

/** Request-level roll-up over item summaries (units differ, so counts — not sums — are used). */
function buildRequestSummary(itemSummaries) {
  const active = itemSummaries.filter((s) => s.fulfillmentStage !== 'cancelled');
  const stageCount = (stage) => active.filter((s) => s.fulfillmentStage === stage).length;
  return {
    totalItems: active.length,
    fulfilledItems: stageCount('fulfilled'),
    fullyPledgedItems: stageCount('fully_pledged'),
    partiallyPledgedItems: stageCount('partially_pledged'),
    partiallyDeliveredItems: stageCount('partially_delivered'),
    openItems: stageCount('open'),
    isFullyFulfilled: active.length > 0 && active.every((s) => s.fulfillmentStage === 'fulfilled'),
  };
}

module.exports = {
  PLEDGE_TOTALS_SQL,
  parseQuantity,
  dbToMilli,
  milliToDb,
  milliToNumber,
  isValidForUnit,
  normalizeItemKey,
  buildQuantitySummary,
  buildRequestSummary,
};
