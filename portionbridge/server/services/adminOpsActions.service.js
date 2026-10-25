const { pool } = require('../config/db');
const disasterIncidentModel = require('../models/disasterIncident.model');
const reliefRequestModel = require('../models/reliefRequest.model');
const reliefItemModel = require('../models/reliefRequestItem.model');
const reliefPledgeModel = require('../models/reliefPledge.model');
const reliefPledgeReportModel = require('../models/reliefPledgeReport.model');
const reliefTaskModel = require('../models/reliefTask.model');
const volunteerProfileModel = require('../models/volunteerProfile.model');
const donationModel = require('../models/donation.model');
const alertService = require('./disasterAlert.service');
const incidentService = require('./disasterIncident.service');
const donationService = require('./donation.service');
const reliefTaskService = require('./reliefTask.service');
const reliefPledgeService = require('./reliefPledge.service');
const reliefRequestService = require('./reliefRequest.service');
const auditService = require('./audit.service');
const { notifyRelief } = require('./reliefNotify');
const { withPledgeLocks } = require('./reliefLocking');
const AppError = require('../utils/AppError');
const { runInTransaction } = require('../utils/dbTransaction');
const { recordIncidentHistory } = require('../utils/incidentHistory');
const { serializeItem } = require('../utils/reliefSerializers');
const { parseQuantity, isValidForUnit, dbToMilli, milliToDb, milliToNumber, buildRequestSummary } = require('../utils/reliefQuantity');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');
const { HTTP_STATUS, AUDIT_ACTIONS, RELIEF } = require('../constants');

const S = RELIEF.INCIDENT_STATUS;
const need = (text, min = 3) => typeof text === 'string' && text.trim().length >= min;
const reasonOrThrow = (reason, label = 'A reason', min = 5) => {
  if (!need(reason, min)) throw new AppError(`${label} is required (at least ${min} characters).`, HTTP_STATUS.UNPROCESSABLE_ENTITY, 'REASON_REQUIRED');
  return reason.trim();
};
const audit = (admin, action, ctx, metadata) => auditService.record({ userId: admin.id, action, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, metadata });

// ============================================================================
// Incidents
// ============================================================================

/** Asks the reporter for more information. The incident stays unverified. */
async function requestIncidentInfo(admin, incidentId, { note }, ctx = {}) {
  const text = reasonOrThrow(note, 'A note describing the information needed', 5);
  const { row } = await runInTransaction(async (connection) => {
    const row = await disasterIncidentModel.findByIdForUpdate(incidentId, connection);
    if (!row) throw new AppError('Incident not found.', HTTP_STATUS.NOT_FOUND);
    if (![S.REPORTED, S.UNDER_REVIEW].includes(row.status)) {
      throw new AppError('Additional information can only be requested while the incident is awaiting verification.', HTTP_STATUS.CONFLICT, 'INVALID_STATE');
    }
    await disasterIncidentModel.updateById(incidentId, {
      status: S.UNDER_REVIEW, info_requested_at: new Date(), info_requested_by: admin.id, info_request_note: text.slice(0, 500),
    }, connection);
    await recordIncidentHistory(connection, { incidentId, action: 'info_requested', fromStatus: row.status, toStatus: S.UNDER_REVIEW, reason: text, actorId: admin.id });
    return { row };
  });
  if (row.reported_by) {
    await notifyRelief(row.reported_by, {
      title: 'More information needed for your incident report',
      message: `An administrator needs more information about "${row.title}": ${text.slice(0, 300)}`,
      relatedId: incidentId, incidentId,
    });
  }
  await audit(admin, AUDIT_ACTIONS.OPS_INCIDENT_INFO_REQUESTED, ctx, { incidentId, hasReporter: Boolean(row.reported_by) });
  return { incidentId, status: S.UNDER_REVIEW };
}

/**
 * Folds a DUPLICATE incident into a surviving one. Nothing is deleted: the duplicate keeps its row
 * (status 'merged', merged_into_id) and its history; its relief requests are RE-POINTED to the survivor,
 * so pledges, tasks, deliveries and audit trails stay attached to the same request ids. A live alert on the
 * duplicate is cancelled through the Phase 4 alert hook (withdrawal notice, deduplicated by the outbox).
 */
async function mergeIncidents(admin, sourceId, { targetIncidentId, reason }, ctx = {}) {
  const why = reasonOrThrow(reason, 'A reason for the merge');
  const targetId = Number(targetIncidentId);
  if (!Number.isInteger(targetId) || targetId < 1) throw new AppError('targetIncidentId is required.', HTTP_STATUS.UNPROCESSABLE_ENTITY);
  if (targetId === Number(sourceId)) throw new AppError('An incident cannot be merged into itself.', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'MERGE_SELF');

  const out = await runInTransaction(async (connection) => {
    // lock in id order so two concurrent merges cannot deadlock
    const [first, second] = [Number(sourceId), targetId].sort((a, b) => a - b);
    const rowA = await disasterIncidentModel.findByIdForUpdate(first, connection);
    const rowB = await disasterIncidentModel.findByIdForUpdate(second, connection);
    const source = first === Number(sourceId) ? rowA : rowB;
    const target = first === targetId ? rowA : rowB;
    if (!source) throw new AppError('Incident not found.', HTTP_STATUS.NOT_FOUND);
    if (!target) throw new AppError('Target incident not found.', HTTP_STATUS.NOT_FOUND);
    if (source.status === S.MERGED) throw new AppError('This incident was already merged.', HTTP_STATUS.CONFLICT, 'ALREADY_MERGED');
    if ([S.MERGED, S.REJECTED].includes(target.status)) {
      throw new AppError(`Cannot merge into an incident that is ${target.status}.`, HTTP_STATUS.CONFLICT, 'INVALID_MERGE_TARGET');
    }
    if (source.verification_status === 'verified' && target.verification_status !== 'verified') {
      throw new AppError('A verified incident can only be merged into another verified incident.', HTTP_STATUS.CONFLICT, 'TARGET_NOT_VERIFIED');
    }
    const [reqs] = await connection.query('SELECT id, status FROM relief_requests WHERE incident_id = :id ORDER BY id FOR UPDATE', { id: source.id });
    const live = reqs.some((r) => ['pending_review', 'approved'].includes(r.status));
    if (live && !RELIEF.OPEN_INCIDENT_STATUSES.includes(target.status)) {
      throw new AppError('The surviving incident must be verified or active to receive open relief requests.', HTTP_STATUS.CONFLICT, 'TARGET_NOT_OPEN');
    }

    if (reqs.length) await connection.query('UPDATE relief_requests SET incident_id = :target WHERE incident_id = :source', { target: target.id, source: source.id });
    const note = `Merged into incident #${target.id}: ${why}`.slice(0, 1000);
    await disasterIncidentModel.updateById(source.id, {
      status: S.MERGED, merged_into_id: target.id, merged_at: new Date(), merged_by: admin.id, verification_notes: note,
    }, connection);
    const alertEventIds = await alertService.onIncidentStatusChange(connection, { incident: { ...source, status: S.MERGED }, to: S.MERGED, actorId: admin.id });
    await recordIncidentHistory(connection, {
      incidentId: source.id, action: 'merged_into', fromStatus: source.status, toStatus: S.MERGED, reason: why,
      details: { targetId: target.id, movedRequestIds: reqs.map((r) => r.id) }, actorId: admin.id,
    });
    await recordIncidentHistory(connection, {
      incidentId: target.id, action: 'merged_from', fromStatus: target.status, toStatus: target.status, reason: why,
      details: { sourceId: source.id, movedRequestIds: reqs.map((r) => r.id), sourceSeverity: source.severity }, actorId: admin.id,
    });
    return { sourceId: source.id, targetId: target.id, movedRequestIds: reqs.map((r) => r.id), alertEventIds, sourceSeverity: source.severity, targetSeverity: target.severity };
  });
  alertService.dispatch(out.alertEventIds);
  await audit(admin, AUDIT_ACTIONS.OPS_INCIDENT_MERGED, ctx, { sourceId: out.sourceId, targetId: out.targetId, movedRequests: out.movedRequestIds.length, reason: why });
  return {
    sourceId: out.sourceId, targetId: out.targetId, movedRequestIds: out.movedRequestIds,
    note: out.sourceSeverity !== out.targetSeverity ? `Severity differs (merged ${out.sourceSeverity}, surviving ${out.targetSeverity}); review the survivor's severity.` : null,
  };
}

/** resolved -> active, or rejected -> under_review, with a mandatory justification. */
async function reopenIncident(admin, incidentId, { reason }, ctx = {}) {
  const why = reasonOrThrow(reason, 'A justification for reopening');
  const row = await disasterIncidentModel.findById(incidentId);
  if (!row) throw new AppError('Incident not found.', HTTP_STATUS.NOT_FOUND);
  const to = row.status === S.RESOLVED ? S.ACTIVE : row.status === S.REJECTED ? S.UNDER_REVIEW : null;
  if (!to) throw new AppError('Only a resolved or rejected incident can be reopened.', HTTP_STATUS.CONFLICT, 'INVALID_STATE');
  await incidentService.changeStatus(incidentId, admin, { status: to, notes: `Reopened: ${why}` }, ctx);
  await audit(admin, AUDIT_ACTIONS.OPS_INCIDENT_REOPENED, ctx, { incidentId, from: row.status, to });
  return { incidentId, status: to };
}

// ============================================================================
// Relief requests
// ============================================================================

async function requestRequestCorrection(admin, requestId, { note }, ctx = {}) {
  const text = reasonOrThrow(note, 'A note describing the correction needed');
  const row = await runInTransaction(async (connection) => {
    const r = await reliefRequestModel.findByIdForUpdate(requestId, connection);
    if (!r) throw new AppError('Relief request not found.', HTTP_STATUS.NOT_FOUND);
    if (r.status !== RELIEF.REQUEST_STATUS.PENDING_REVIEW) {
      throw new AppError('Corrections can only be requested while a request is pending review.', HTTP_STATUS.CONFLICT, 'INVALID_STATE');
    }
    await reliefRequestModel.updateById(requestId, { correction_requested_at: new Date(), correction_note: text.slice(0, 500) }, connection);
    return r;
  });
  if (row.requested_by) {
    await notifyRelief(row.requested_by, {
      title: 'Corrections needed on your relief request',
      message: `An administrator asked for changes to "${row.title}": ${text.slice(0, 300)}`,
      relatedId: requestId, incidentId: row.incident_id, reliefRequestId: requestId,
    });
  }
  await audit(admin, AUDIT_ACTIONS.OPS_REQUEST_CORRECTION_REQUESTED, ctx, { requestId });
  return { requestId };
}

async function flagReassessment(admin, requestId, { reason }, ctx = {}) {
  const text = reasonOrThrow(reason, 'A reason for reassessment');
  await runInTransaction(async (connection) => {
    const r = await reliefRequestModel.findByIdForUpdate(requestId, connection);
    if (!r) throw new AppError('Relief request not found.', HTTP_STATUS.NOT_FOUND);
    if (!['approved', 'pending_review'].includes(r.status)) throw new AppError(`A ${r.status} request does not need reassessment.`, HTTP_STATUS.CONFLICT, 'INVALID_STATE');
    await reliefRequestModel.updateById(requestId, { reassessment_flagged_at: new Date(), reassessment_flagged_by: admin.id, reassessment_reason: text.slice(0, 500) }, connection);
  });
  await audit(admin, AUDIT_ACTIONS.OPS_REQUEST_REASSESSMENT_FLAGGED, ctx, { requestId, reason: text });
  return { requestId, flagged: true };
}

async function clearReassessment(admin, requestId, { note } = {}, ctx = {}) {
  await runInTransaction(async (connection) => {
    const r = await reliefRequestModel.findByIdForUpdate(requestId, connection);
    if (!r) throw new AppError('Relief request not found.', HTTP_STATUS.NOT_FOUND);
    if (!r.reassessment_flagged_at) throw new AppError('This request is not flagged for reassessment.', HTTP_STATUS.CONFLICT, 'NOT_FLAGGED');
    await reliefRequestModel.updateById(requestId, { reassessment_flagged_at: null, reassessment_flagged_by: null, reassessment_reason: null }, connection);
  });
  await audit(admin, AUDIT_ACTIONS.OPS_REQUEST_REASSESSMENT_CLEARED, ctx, { requestId, note: note ? String(note).slice(0, 300) : null });
  return { requestId, flagged: false };
}

// ============================================================================
// Volunteers & tasks
// ============================================================================

const ACTIVE_TASK_SQL = "d.status IN ('accepted', 'scheduled', 'on_the_way', 'picked_up') AND d.is_deleted = 0";

/**
 * Volunteers an admin may assign to a task, with the SAME eligibility the volunteer would face when accepting
 * (base location on file, task inside their coverage radius). Only operational fields are returned — no phone,
 * email or address.
 */
async function listVolunteers(query) {
  const { page, limit, offset } = getPaginationParams(query);
  const params = { limit, offset };
  const conditions = ["u.role = 'volunteer'", 'u.is_deleted = 0', 'u.is_banned = 0'];
  if (query.search) { conditions.push('u.name LIKE :search'); params.search = `%${String(query.search).slice(0, 60)}%`; }

  let pickup = null;
  if (query.pledgeId) {
    const row = await reliefTaskModel.findByPledgeId(Number(query.pledgeId));
    if (!row) throw new AppError('Task not found.', HTTP_STATUS.NOT_FOUND);
    const donation = await donationModel.findById(row.donation_id);
    pickup = donation ? donationService.getDonationPickupCoords(donation) : null;
  }
  const where = conditions.join(' AND ');
  const [rows] = await pool.query(
    `SELECT u.id, u.name, vp.vehicle_type, vp.is_online, vp.total_pickups, vp.rating, vp.coverage_radius, vp.latitude, vp.longitude,
            (SELECT COUNT(*) FROM donation_requests d WHERE COALESCE(d.assigned_member_id, d.volunteer_id) = u.id AND ${ACTIVE_TASK_SQL}) AS active_tasks
       FROM users u LEFT JOIN volunteer_profiles vp ON vp.user_id = u.id
      WHERE ${where} ORDER BY active_tasks ASC, vp.is_online DESC, u.name ASC LIMIT :limit OFFSET :offset`, params
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users u WHERE ${where}`, params);
  const { calculateDistance } = require('../models/volunteerDiscovery.model');
  return {
    volunteers: rows.map((v) => {
      const hasBase = v.latitude !== null && v.longitude !== null;
      let distanceKm = null; let eligible = hasBase; let reason = hasBase ? null : 'No base location on file';
      if (pickup && hasBase) {
        distanceKm = Math.round(calculateDistance(v.latitude, v.longitude, pickup.latitude, pickup.longitude) * 10) / 10;
        const radius = Number(v.coverage_radius) || 25;
        if (distanceKm > radius) { eligible = false; reason = `Outside coverage radius (${distanceKm} km > ${radius} km)`; }
      } else if (pickup && !hasBase) { eligible = false; }
      return {
        id: v.id, name: v.name, vehicleType: v.vehicle_type || null, isOnline: Boolean(v.is_online), completedPickups: Number(v.total_pickups || 0),
        rating: v.rating === null ? null : Number(v.rating), activeTasks: Number(v.active_tasks), distanceKm, eligible, ineligibleReason: reason,
      };
    }),
    meta: buildPaginationMeta({ page, limit, totalItems: Number(total) }),
  };
}

async function loadTask(pledgeId) {
  const row = await reliefTaskModel.findByPledgeId(pledgeId);
  if (!row) throw new AppError('Task not found.', HTTP_STATUS.NOT_FOUND);
  return row;
}

async function assertAssignableVolunteer(volunteerId) {
  const [[u]] = await pool.query("SELECT id, name, role, is_banned, is_deleted FROM users WHERE id = :id", { id: Number(volunteerId) });
  if (!u || u.role !== 'volunteer' || u.is_deleted || u.is_banned) {
    throw new AppError('That user is not an active volunteer.', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'NOT_A_VOLUNTEER');
  }
  return u;
}

async function precheckRadius(row, volunteerId) {
  const profile = await volunteerProfileModel.findByUserId(volunteerId);
  if (!profile || profile.latitude === null || profile.longitude === null) {
    throw new AppError('That volunteer has no base location on file, so eligibility cannot be confirmed.', HTTP_STATUS.FORBIDDEN, 'ADDRESS_REQUIRED');
  }
  const donation = await donationModel.findById(row.donation_id);
  donationService.assertDonationWithinRadius(donation, { coverageRadius: profile.coverage_radius, latitude: profile.latitude, longitude: profile.longitude }, 'volunteer');
}

async function recordAssignment({ pledgeId, action, from = null, to = null, reason, actorId }) {
  await pool.query(
    'INSERT INTO relief_task_assignments (pledge_id, action, from_volunteer_id, to_volunteer_id, reason, actor_id) VALUES (:pledgeId, :action, :from, :to, :reason, :actorId)',
    { pledgeId, action, from, to, reason: reason ? String(reason).slice(0, 500) : null, actorId }
  );
}

const assertIndividualTask = (row) => {
  if (row.assignment_mode === 'team') throw new AppError('Team tasks are managed with the team tools; individual assignment is not available.', HTTP_STATUS.CONFLICT, 'TEAM_TASK');
};

async function assignTask(admin, pledgeId, { volunteerId, reason }, ctx = {}) {
  const why = reasonOrThrow(reason, 'A reason for the assignment');
  const row = await loadTask(pledgeId);
  assertIndividualTask(row);
  if (row.pledge_status !== 'pledged' || row.donation_status !== 'pending' || row.donation_deleted || row.request_status !== 'approved'
    || !RELIEF.OPEN_INCIDENT_STATUSES.includes(row.incident_status)) {
    throw new AppError('This task is not waiting for a volunteer. Use reassign for a task that already has one.', HTTP_STATUS.CONFLICT, 'TASK_NOT_AVAILABLE');
  }
  const vol = await assertAssignableVolunteer(volunteerId);
  await donationService.acceptDonation(row.donation_id, vol.id); // existing eligibility + row lock + status history
  await recordAssignment({ pledgeId, action: 'assigned', to: vol.id, reason: why, actorId: admin.id });
  await notifyRelief(vol.id, {
    title: 'You were assigned a relief pickup',
    message: `An administrator assigned you relief pickup #${row.donation_id} for "${row.request_title}". Open your relief tasks to schedule it.`,
    relatedId: row.donation_id, incidentId: row.incident_id, reliefRequestId: row.request_id, reliefPledgeId: pledgeId,
  });
  await audit(admin, AUDIT_ACTIONS.OPS_TASK_ASSIGNED, ctx, { pledgeId, volunteerId: vol.id, reason: why });
  return { pledgeId, volunteerId: vol.id };
}

async function reassignTask(admin, pledgeId, { volunteerId, reason }, ctx = {}) {
  const why = reasonOrThrow(reason, 'A reason for the reassignment');
  const row = await loadTask(pledgeId);
  assertIndividualTask(row);
  const previous = row.volunteer_id || null;
  if (!previous || !['accepted', 'scheduled', 'on_the_way'].includes(row.donation_status) || row.pledge_status !== 'pledged') {
    throw new AppError('Only a task that is assigned but not yet picked up can be reassigned.', HTTP_STATUS.CONFLICT, 'INVALID_STATE_TRANSITION');
  }
  if (Number(volunteerId) === previous) throw new AppError('That volunteer already has this task.', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'SAME_VOLUNTEER');
  const vol = await assertAssignableVolunteer(volunteerId);
  await precheckRadius(row, vol.id); // fail BEFORE releasing the current volunteer

  await reliefTaskService.releaseTask(admin, pledgeId, { reason: `Reassigned by administrator: ${why}` }, ctx);
  try {
    await donationService.acceptDonation(row.donation_id, vol.id);
  } catch (err) {
    await recordAssignment({ pledgeId, action: 'released', from: previous, reason: `${why} (new volunteer could not accept: ${err.message})`, actorId: admin.id });
    throw new AppError(`The task was released from the previous volunteer but ${vol.name} could not accept it (${err.message}). It is back in the available pool.`, HTTP_STATUS.CONFLICT, 'REASSIGN_PARTIAL');
  }
  await recordAssignment({ pledgeId, action: 'reassigned', from: previous, to: vol.id, reason: why, actorId: admin.id });
  await notifyRelief(vol.id, {
    title: 'You were assigned a relief pickup',
    message: `An administrator reassigned relief pickup #${row.donation_id} to you. Open your relief tasks to schedule it.`,
    relatedId: row.donation_id, incidentId: row.incident_id, reliefRequestId: row.request_id, reliefPledgeId: pledgeId,
  });
  await audit(admin, AUDIT_ACTIONS.OPS_TASK_REASSIGNED, ctx, { pledgeId, from: previous, to: vol.id, reason: why });
  return { pledgeId, fromVolunteerId: previous, volunteerId: vol.id };
}

async function releaseAssignedTask(admin, pledgeId, { reason }, ctx = {}) {
  const why = reasonOrThrow(reason, 'A reason for releasing the task');
  const row = await loadTask(pledgeId);
  const previous = row.volunteer_id || null;
  await reliefTaskService.releaseTask(admin, pledgeId, { reason: why }, ctx);
  await recordAssignment({ pledgeId, action: 'released', from: previous, reason: why, actorId: admin.id });
  await audit(admin, AUDIT_ACTIONS.OPS_TASK_RELEASED, ctx, { pledgeId, from: previous, reason: why });
  return { pledgeId, released: true };
}

async function cancelTask(admin, pledgeId, { reason }, ctx = {}) {
  const why = reasonOrThrow(reason, 'A reason for cancelling the task');
  const row = await loadTask(pledgeId);
  await reliefPledgeService.cancelPledge(admin, pledgeId, { reason: why }, ctx); // existing rules: nothing verified delivered yet
  await recordAssignment({ pledgeId, action: 'cancelled', from: row.volunteer_id || null, reason: why, actorId: admin.id });
  await audit(admin, AUDIT_ACTIONS.OPS_TASK_CANCELLED, ctx, { pledgeId, reason: why });
  return { pledgeId, cancelled: true };
}

async function getAssignmentHistory(pledgeId) {
  const [rows] = await pool.query(
    `SELECT a.id, a.action, a.reason, a.created_at, fu.name AS from_name, tu.name AS to_name, au.name AS actor_name
       FROM relief_task_assignments a LEFT JOIN users fu ON fu.id = a.from_volunteer_id LEFT JOIN users tu ON tu.id = a.to_volunteer_id LEFT JOIN users au ON au.id = a.actor_id
      WHERE a.pledge_id = :pledgeId ORDER BY a.created_at DESC, a.id DESC`, { pledgeId }
  );
  return rows.map((r) => ({ id: r.id, action: r.action, reason: r.reason, from: r.from_name || null, to: r.to_name || null, actor: r.actor_name || null, createdAt: r.created_at }));
}

// ============================================================================
// Delivery correction
// ============================================================================

/**
 * Corrects the verified quantity of an already VERIFIED delivery report. Totals are adjusted by the DELTA
 * (new - old) under the same lock order as every relief write (request -> item -> pledge -> donation), so a
 * correction can never double-count the earlier verification and concurrent corrections queue.
 * The corrected value can never exceed what the volunteer reported.
 */
async function correctDelivery(admin, reportId, { verifiedQuantity, reason }, ctx = {}) {
  const why = reasonOrThrow(reason, 'A reason for the correction');
  const report0 = await reliefPledgeReportModel.findById(reportId);
  if (!report0 || report0.report_type !== 'delivery') throw new AppError('Delivery report not found.', HTTP_STATUS.NOT_FOUND);

  const out = await withPledgeLocks(report0.pledge_id, { requestExclusive: true }, async ({ connection, request, item, pledge }) => {
    const report = await reliefPledgeReportModel.findByIdForUpdate(reportId, connection);
    if (!report || report.status !== 'verified') {
      throw new AppError('Only a verified delivery can be corrected.', HTTP_STATUS.CONFLICT, 'REPORT_NOT_VERIFIED');
    }
    if (pledge.status === 'cancelled') throw new AppError('This pledge was cancelled.', HTTP_STATUS.CONFLICT, 'INVALID_STATE');
    const milli = parseQuantity(verifiedQuantity, { allowZero: true });
    if (milli === null || !isValidForUnit(milli, item.unit)) {
      throw new AppError(`Verified quantity is not valid for unit "${item.unit}".`, HTTP_STATUS.UNPROCESSABLE_ENTITY, 'INVALID_QUANTITY');
    }
    const oldMilli = dbToMilli(report.verified_quantity);
    const reported = dbToMilli(report.quantity);
    if (milli > reported) throw new AppError('The corrected quantity cannot exceed what the volunteer reported.', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VERIFIED_EXCEEDS_REPORTED');
    if (milli === oldMilli) throw new AppError('The corrected quantity equals the current verified quantity.', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'NO_CHANGE');

    const pledged = dbToMilli(pledge.quantity_pledged);
    const collected = dbToMilli(pledge.quantity_collected);
    const pending = dbToMilli(pledge.quantity_pending_verification);
    const newDelivered = dbToMilli(pledge.quantity_delivered) - oldMilli + milli;
    if (newDelivered < 0 || newDelivered > pledged || newDelivered + pending > collected) {
      throw new AppError('The corrected quantity would make the delivered total inconsistent with what was collected.', HTTP_STATUS.CONFLICT, 'DELIVERY_EXCEEDS_COLLECTED');
    }

    const fields = { quantity_delivered: milliToDb(newDelivered) };
    const closed = ['delivered', 'partially_fulfilled', 'failed'].includes(pledge.status);
    let status = pledge.status;
    if (newDelivered === pledged) { status = 'delivered'; if (!pledge.delivered_at) fields.delivered_at = new Date(); }
    else if (closed) {
      status = newDelivered > 0 ? 'partially_fulfilled' : 'failed';
      if (status === 'failed') fields.failed_at = new Date();
      if (status === 'partially_fulfilled' && !pledge.delivered_at) fields.delivered_at = new Date();
    }
    fields.status = status;
    await reliefPledgeModel.updateById(pledge.id, fields, connection);
    await reliefPledgeReportModel.updateById(reportId, { verified_quantity: milliToDb(milli), reviewed_by: admin.id, reviewed_at: new Date() }, connection);
    await connection.query(
      'INSERT INTO relief_delivery_corrections (report_id, pledge_id, old_verified, new_verified, reason, actor_id) VALUES (:reportId, :pledgeId, :oldQ, :newQ, :reason, :actor)',
      { reportId, pledgeId: pledge.id, oldQ: milliToDb(oldMilli), newQ: milliToDb(milli), reason: why, actor: admin.id }
    );

    // keep the request's completed/approved state consistent with the corrected totals
    const itemRows = await reliefItemModel.findWithTotalsByRequestIds([request.id], {}, connection);
    const summary = buildRequestSummary(itemRows.map((i) => serializeItem(i).quantities));
    let requestState = request.status;
    if (request.status === 'completed' && !summary.isFullyFulfilled) {
      await reliefRequestModel.updateById(request.id, { status: 'approved', closed_at: null }, connection);
      requestState = 'approved';
    } else if (request.status === 'approved' && summary.isFullyFulfilled) {
      await reliefRequestModel.updateById(request.id, { status: 'completed', closed_at: new Date() }, connection);
      requestState = 'completed';
    }
    return { pledgeId: pledge.id, donorId: pledge.donor_id, volunteerId: report.reporter_id, unit: item.unit, oldMilli, newMilli: milli, status, requestState, requestId: request.id, incidentId: request.incident_id };
  });

  const msg = `The verified delivered quantity for a relief delivery was corrected from ${milliToNumber(out.oldMilli)} to ${milliToNumber(out.newMilli)} ${out.unit}.`;
  await notifyRelief(out.donorId, { title: 'Relief delivery record corrected', message: msg, relatedId: null, incidentId: out.incidentId, reliefRequestId: out.requestId, reliefPledgeId: out.pledgeId });
  if (out.volunteerId) await notifyRelief(out.volunteerId, { title: 'Delivery record corrected', message: msg, relatedId: null, incidentId: out.incidentId, reliefRequestId: out.requestId, reliefPledgeId: out.pledgeId });
  await audit(admin, AUDIT_ACTIONS.OPS_DELIVERY_CORRECTED, ctx, {
    reportId, pledgeId: out.pledgeId, from: milliToNumber(out.oldMilli), to: milliToNumber(out.newMilli), pledgeStatus: out.status, requestStatus: out.requestState, reason: why,
  });
  return { reportId, pledgeId: out.pledgeId, verifiedQuantity: milliToNumber(out.newMilli), pledgeStatus: out.status, requestStatus: out.requestState };
}

module.exports = {
  requestIncidentInfo, mergeIncidents, reopenIncident, requestRequestCorrection, flagReassessment, clearReassessment,
  listVolunteers, assignTask, reassignTask, releaseAssignedTask, cancelTask, getAssignmentHistory, correctDelivery,
  reliefRequestService,
};
