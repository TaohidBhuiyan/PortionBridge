const { RELIEF } = require('../constants');
const { buildQuantitySummary, buildRequestSummary } = require('./reliefQuantity');

/**
 * Response shaping for the Disaster Relief module. Rows from the model layer
 * contain moderation data (verifier, internal notes) and precise locations; the
 * level passed here decides what leaves the server:
 *
 *   public  anyone, including unauthenticated: approximate coordinates, no street
 *           address, no reporter/verifier identity, no internal notes, no source ref
 *   owner   the user who reported / requested it: adds their own street address
 *   admin   everything
 */

function roundCoord(value) {
  if (value === null || value === undefined) return null;
  return Number(Number(value).toFixed(RELIEF.PUBLIC_COORD_DECIMALS));
}

function exactCoord(value) {
  return value === null || value === undefined ? null : Number(value);
}

function serializeIncident(row, level = 'public') {
  const precise = level !== 'public';
  const out = {
    id: row.id,
    title: row.title,
    description: row.description,
    disasterType: row.disaster_type,
    severity: row.severity,
    priority: row.priority,
    latitude: precise ? exactCoord(row.latitude) : roundCoord(row.latitude),
    longitude: precise ? exactCoord(row.longitude) : roundCoord(row.longitude),
    coordinatesApproximate: !precise,
    district: row.district,
    affectedArea: row.affected_area,
    status: row.status,
    isVerified: row.verification_status === 'verified',
    sourceType: row.source_type,
    verifiedAt: row.verified_at,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (precise) out.address = row.address;
  if (level === 'owner' || level === 'admin') out.verificationStatus = row.verification_status;
  if (level === 'admin') {
    out.sourceReference = row.source_reference;
    out.verificationNotes = row.verification_notes;
    out.verifiedBy = row.verified_by;
    out.verifierName = row.verifier_name || null;
    out.reportedBy = row.reported_by;
    out.reporterName = row.reporter_name || null;
  }
  return out;
}

function serializeRequest(row, level = 'public') {
  const precise = level !== 'public';
  const out = {
    id: row.id,
    incidentId: row.incident_id,
    title: row.title,
    description: row.description,
    locationName: row.location_name,
    latitude: precise ? exactCoord(row.latitude) : roundCoord(row.latitude),
    longitude: precise ? exactCoord(row.longitude) : roundCoord(row.longitude),
    coordinatesApproximate: !precise,
    priority: row.priority,
    status: row.status,
    requestingOrganization: row.requesting_organization,
    expiresAt: row.expires_at,
    isExpired: Boolean(row.expires_at) && new Date(row.expires_at).getTime() <= Date.now(),
    approvedAt: row.approved_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (precise) {
    out.address = row.address;
    out.deliveryInstructions = row.delivery_instructions;
  }
  if (level === 'owner' && row.status === 'rejected') out.reviewNotes = row.review_notes;
  if (level === 'admin') {
    out.reviewNotes = row.review_notes;
    out.requestedBy = row.requested_by;
    out.requesterName = row.requester_name || null;
    out.approvedBy = row.approved_by;
  }
  return out;
}

function serializeItem(row) {
  return {
    id: row.id,
    requestId: row.relief_request_id,
    name: row.item_name,
    category: row.item_category,
    unit: row.unit,
    priority: row.priority,
    status: row.status,
    notes: row.notes,
    quantities: buildQuantitySummary({
      requested: row.quantity_requested,
      activePledged: row.active_pledged,
      collected: row.collected,
      delivered: row.delivered,
      pendingVerification: row.pending_verification,
      itemStatus: row.status,
    }),
  };
}

/** Attaches items + request-level roll-up to a serialized request. */
function withItems(serializedRequest, itemRows) {
  const items = itemRows.map(serializeItem);
  return {
    ...serializedRequest,
    items,
    summary: buildRequestSummary(items.map((i) => i.quantities)),
  };
}

/** Pledges are never public: only the donor, an admin or the assigned fulfiller sees them. */
function serializePledge(row, { admin = false } = {}) {
  const num = (v) => Number(v);
  const out = {
    id: row.id,
    itemId: row.relief_request_item_id,
    requestId: row.relief_request_id,
    itemName: row.item_name,
    itemCategory: row.item_category,
    unit: row.unit,
    requestTitle: row.request_title,
    quantityPledged: num(row.quantity_pledged),
    quantityCollected: num(row.quantity_collected),
    quantityDelivered: num(row.quantity_delivered),
    quantityPendingVerification: num(row.quantity_pending_verification),
    status: row.status,
    donationRequestId: row.donation_request_id,
    notes: row.notes,
    collectedAt: row.collected_at,
    deliveredAt: row.delivered_at,
    cancelledAt: row.cancelled_at,
    failedAt: row.failed_at,
    cancellationReason: row.cancellation_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (admin) {
    out.donorId = row.donor_id;
    out.donorName = row.donor_name;
    out.cancelledBy = row.cancelled_by;
  }
  return out;
}

module.exports = { serializeIncident, serializeRequest, serializeItem, withItems, serializePledge };
