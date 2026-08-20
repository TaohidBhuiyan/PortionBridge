const { DONATION_STATUS } = require('../constants');

// Grace periods before a condition counts as "delayed" — generous enough
// that a volunteer running a few minutes behind isn't immediately flagged,
// but real enough to surface genuine problems. All plain constants, no
// magic numbers scattered through the scoring logic below.
const PICKUP_DELAY_GRACE_MINUTES = 15;
const DELIVERY_DELAY_GRACE_MINUTES = 90;
const UNASSIGNED_GRACE_MINUTES = 120;
const STALE_LOCATION_MINUTES = 10;

const ACTIVE_MISSION_STATUSES = new Set([
  DONATION_STATUS.ACCEPTED,
  DONATION_STATUS.SCHEDULED,
  DONATION_STATUS.ON_THE_WAY,
  DONATION_STATUS.PICKED_UP,
]);

function minutesSince(date) {
  if (!date) return null;
  return (Date.now() - new Date(date).getTime()) / 60000;
}

function minutesUntil(date) {
  if (!date) return null;
  return (new Date(date).getTime() - Date.now()) / 60000;
}

/**
 * Derives the operational condition flags a single donation is currently
 * in, from data that's already real and available (no external calls, no
 * fabricated signals): scheduled_at vs now, time since it entered
 * 'picked_up' (donation_status_history), time since creation while still
 * unassigned, and whether the assigned person is currently online
 * (socketRegistry) with a recent location update (tracking.handler.js's
 * existing throttle map).
 *
 * @param {Object} donation - Row from admin.model.js (needs status,
 *   scheduled_at, created_at, volunteer_id, assigned_member_id,
 *   assignment_mode, is_deleted)
 * @param {Object} [context]
 * @param {Date|string|null} [context.pickedUpAt] - When status became 'picked_up'
 *   (from donation_status_history), if applicable
 * @param {boolean} [context.hasOpenReport] - Whether an unresolved report targets this donation
 * @param {boolean|null} [context.assignedPersonOnline] - socketRegistry.isOnline snapshot, or null if nobody's assigned
 * @param {number|null} [context.lastLocationUpdateAt] - ms-epoch of last accepted location share, or null
 * @returns {Object} Flags object — see individual properties below
 */
function deriveDonationFlags(donation, context = {}) {
  const { pickedUpAt = null, hasOpenReport = false, assignedPersonOnline = null, lastLocationUpdateAt = null } = context;

  const isActiveMission = !donation.is_deleted && ACTIVE_MISSION_STATUSES.has(donation.status);
  const assignedPersonId = donation.assignment_mode === 'team' ? donation.assigned_member_id : donation.volunteer_id;

  const isUnassigned =
    !donation.is_deleted &&
    donation.status === DONATION_STATUS.PENDING &&
    !donation.volunteer_id &&
    (minutesSince(donation.created_at) ?? 0) > UNASSIGNED_GRACE_MINUTES;

  const isDelayedPickup =
    !donation.is_deleted &&
    (donation.status === DONATION_STATUS.ACCEPTED || donation.status === DONATION_STATUS.SCHEDULED) &&
    donation.scheduled_at &&
    -minutesUntil(donation.scheduled_at) > PICKUP_DELAY_GRACE_MINUTES;

  const isDelayedDelivery =
    !donation.is_deleted &&
    donation.status === DONATION_STATUS.PICKED_UP &&
    pickedUpAt &&
    (minutesSince(pickedUpAt) ?? 0) > DELIVERY_DELAY_GRACE_MINUTES;

  const isInactiveVolunteer =
    isActiveMission && !!assignedPersonId && assignedPersonOnline === false;

  const isStaleLocation =
    isActiveMission &&
    !!assignedPersonId &&
    (donation.status === DONATION_STATUS.ON_THE_WAY || donation.status === DONATION_STATUS.PICKED_UP) &&
    (lastLocationUpdateAt === null || (Date.now() - lastLocationUpdateAt) / 60000 > STALE_LOCATION_MINUTES);

  return {
    isActiveMission,
    assignedPersonId,
    isUnassigned,
    isDelayedPickup,
    isDelayedDelivery,
    isInactiveVolunteer,
    isStaleLocation,
    hasOpenReport,
  };
}

/**
 * Transparent, rule-based health score (0-100) for a single donation —
 * NOT machine-learned, NOT an external AI call, just named point
 * deductions the admin can read and understand. Every reason returned
 * traces to a specific, real data point.
 * @param {Object} donation - Same shape as deriveDonationFlags expects
 * @param {Object} flags - Result of deriveDonationFlags(donation, context)
 * @returns {{score: number, riskLevel: 'low'|'medium'|'high', reasons: Array<{label: string, impact: number}>}}
 */
function computeDonationHealthScore(donation, flags) {
  let score = 100;
  const reasons = [];

  const deduct = (amount, label) => {
    score -= amount;
    reasons.push({ label, impact: -amount });
  };

  if (donation.donor_verified === false || donation.donor_verified === 0) {
    deduct(10, "Donor's email is not verified");
  }
  if (flags.isUnassigned) {
    deduct(20, 'No volunteer has accepted this donation yet');
  }
  if (
    (donation.status === DONATION_STATUS.ACCEPTED || donation.status === DONATION_STATUS.SCHEDULED) &&
    !donation.scheduled_at
  ) {
    deduct(10, 'No pickup time has been scheduled');
  }
  if (flags.isDelayedPickup) {
    deduct(25, 'Pickup is overdue against the scheduled time');
  }
  if (flags.isDelayedDelivery) {
    deduct(25, 'Delivery is taking longer than expected after pickup');
  }
  if (flags.hasOpenReport) {
    deduct(30, 'An unresolved report has been filed against this donation');
  }
  if (flags.isInactiveVolunteer) {
    deduct(15, 'The assigned volunteer currently appears offline');
  }
  if (flags.isStaleLocation) {
    deduct(10, "The volunteer's location hasn't updated recently");
  }

  score = Math.max(0, Math.min(100, score));
  const riskLevel = score >= 85 ? 'low' : score >= 60 ? 'medium' : 'high';

  if (reasons.length === 0) {
    reasons.push({ label: 'No issues detected', impact: 0 });
  }

  return { score, riskLevel, reasons };
}

module.exports = {
  deriveDonationFlags,
  computeDonationHealthScore,
  PICKUP_DELAY_GRACE_MINUTES,
  DELIVERY_DELAY_GRACE_MINUTES,
  UNASSIGNED_GRACE_MINUTES,
  STALE_LOCATION_MINUTES,
};