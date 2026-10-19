const { buildQuantitySummary } = require('./reliefQuantity');

/**
 * Task shaping for the donor / volunteer / admin views of a relief pledge.
 *
 * task_status is derived from the pledge status and the linked donation's lifecycle
 * (accepted -> scheduled -> on_the_way -> picked_up -> completed) — there is no second
 * status column to drift:
 *   available            nobody has accepted the donation yet
 *   accepted|scheduled|on_the_way   the existing donation statuses, unchanged
 *   picked_up            goods collected, not yet delivered
 *   delivery_reported    volunteer reported delivery; awaiting admin verification
 *   completed            all pledged goods delivered AND verified
 *   completed_partial    closed with only part delivered (shortfall released)
 *   failed               delivery failed; nothing counted as delivered
 *   cancelled            cancelled before completion
 */
function deriveTaskStatus(row) {
  if (row.pledge_status === 'cancelled' || (row.donation_status === 'cancelled' && row.pledge_status !== 'failed')) return 'cancelled';
  if (row.pledge_status === 'failed') return 'failed';
  if (row.pledge_status === 'delivered') return 'completed';
  if (row.pledge_status === 'partially_fulfilled') return 'completed_partial';
  if (row.donation_status === 'pending') return 'available';
  if (row.donation_status === 'picked_up') {
    return Number(row.quantity_pending_verification) > 0 ? 'delivery_reported' : 'picked_up';
  }
  if (['accepted', 'scheduled', 'on_the_way'].includes(row.donation_status)) return row.donation_status;
  return 'completed';
}

const num = (v) => (v === null || v === undefined ? null : Number(v));

function pickupArea(row) {
  const d = row.pickup_address_details || {};
  return [d.area, d.district].filter(Boolean).join(', ') || null;
}

function base(row) {
  return {
    pledgeId: row.pledge_id,
    taskStatus: deriveTaskStatus(row),
    pledgeStatus: row.pledge_status,
    // a real problem or failed delivery is open (shown to donors/volunteers) ...
    hasOpenIssue: Number(row.open_issues) > 0,
    // ... while an administrator also needs to act on a delivery awaiting verification
    needsAttention: Number(row.open_reports) > 0,
    incident: {
      id: row.incident_id, title: row.incident_title, district: row.incident_district,
      disasterType: row.disaster_type, severity: row.severity,
    },
    request: { id: row.request_id, title: row.request_title, priority: row.request_priority, locationName: row.dropoff_name },
    item: { id: row.item_id, name: row.item_name, category: row.item_category, unit: row.unit },
    quantity: {
      pledged: num(row.quantity_pledged), collected: num(row.quantity_collected),
      delivered: num(row.quantity_delivered), pendingVerification: num(row.quantity_pending_verification),
    },
    pickup: { date: row.pickup_date, timeSlot: row.pickup_time_slot, area: pickupArea(row) },
    donationId: row.donation_id,
    pledgedAt: row.pledged_at,
  };
}

/** Anyone eligible to accept: no contact details, no street address, no donor identity. */
function serializeAvailableTask(row, distanceKm = null) {
  return { ...base(row), distanceKm: distanceKm === null ? null : Math.round(distanceKm * 10) / 10 };
}

/** Assigned volunteer or admin: the full pickup + drop-off details needed to do the job. */
function serializeAssignedTask(row, { admin = false } = {}) {
  const details = row.pickup_address_details || {};
  const out = {
    ...base(row),
    scheduledAt: row.scheduled_at,
    acceptedAt: row.accepted_at,
    collectedAt: row.collected_at,
    deliveredAt: row.delivered_at,
    completedAt: row.completed_at,
    pickup: {
      ...base(row).pickup,
      address: row.pickup_location,
      landmark: details.landmark || null,
      instructions: details.deliveryInstructions || null,
      contactName: details.contactPersonName || row.donor_name,
      contactPhone: row.contact_phone,
      latitude: num(details.latitude),
      longitude: num(details.longitude),
    },
    dropoff: {
      name: row.dropoff_name, address: row.dropoff_address, instructions: row.delivery_instructions,
      latitude: num(row.dropoff_latitude), longitude: num(row.dropoff_longitude),
    },
    requested: num(row.quantity_requested),
    donor: { name: row.donor_name },
    assignedTo: { volunteerId: row.volunteer_id, volunteerName: row.volunteer_name, memberId: row.assigned_member_id, memberName: row.member_name },
  };
  if (admin) out.donor = { id: row.donor_id, name: row.donor_name };
  return out;
}

/** The donor's own pledge: status and who is helping — never the volunteer's contact details. */
function serializeDonorTracking(row) {
  if (!row) return null;
  return {
    donationId: row.donation_id,
    taskStatus: deriveTaskStatus(row),
    donationStatus: row.donation_status,
    pickup: { date: row.pickup_date, timeSlot: row.pickup_time_slot, address: row.pickup_location },
    destination: { name: row.dropoff_name },
    volunteerName: row.volunteer_name || row.member_name || null,
    scheduledAt: row.scheduled_at,
    hasOpenIssue: Number(row.open_issues) > 0,
    quantity: {
      pledged: num(row.quantity_pledged), collected: num(row.quantity_collected),
      delivered: num(row.quantity_delivered), pendingVerification: num(row.quantity_pending_verification),
    },
  };
}

function serializeReport(r, { internal = false } = {}) {
  const out = {
    id: r.id, type: r.report_type, status: r.status, quantity: num(r.quantity),
    verifiedQuantity: num(r.verified_quantity), isFinal: Boolean(r.is_final), createdAt: r.created_at,
  };
  if (internal) {
    out.notes = r.notes;
    out.reporterName = r.reporter_name || null;
    out.reviewNotes = r.review_notes;
    out.reviewerName = r.reviewer_name || null;
    out.reviewedAt = r.reviewed_at;
  }
  return out;
}

module.exports = {
  deriveTaskStatus, serializeAvailableTask, serializeAssignedTask, serializeDonorTracking, serializeReport,
};
