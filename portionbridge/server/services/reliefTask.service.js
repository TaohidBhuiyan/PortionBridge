const reliefPledgeModel = require('../models/reliefPledge.model');
const reliefPledgeReportModel = require('../models/reliefPledgeReport.model');
const reliefTaskModel = require('../models/reliefTask.model');
const donationModel = require('../models/donation.model');
const volunteerProfileModel = require('../models/volunteerProfile.model');
const { calculateDistance } = require('../models/volunteerDiscovery.model');
const donationService = require('./donation.service');
const auditService = require('./audit.service');
const { withPledgeLocks } = require('./reliefLocking');
const { applyVerifiedDelivery } = require('./reliefDelivery');
const { notifyRelief } = require('./reliefNotify');
const { requireDeliveryVerification } = require('../config/relief');
const AppError = require('../utils/AppError');
const { quantityOrThrow } = require('../utils/reliefQuantityInput');
const { dbToMilli, milliToDb, milliToNumber } = require('../utils/reliefQuantity');
const { serializeAvailableTask, serializeAssignedTask } = require('../utils/reliefTaskSerializers');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');
const { HTTP_STATUS, AUDIT_ACTIONS, RELIEF, USER_ROLES } = require('../constants');

const DEFAULT_RADIUS_KM = 10; // same default the general donation browse/accept rules use
const isAdmin = (user) => Boolean(user) && user.role === USER_ROLES.ADMIN;
const notFound = () => new AppError('Task not found.', HTTP_STATUS.NOT_FOUND);
const isAssigned = (row, userId) => row.volunteer_id === userId || row.assigned_member_id === userId;

/** Re-reads the task and returns the view for an assigned volunteer / admin. */
async function assignedView(pledgeId, user) {
  const row = await reliefTaskModel.findByPledgeId(pledgeId);
  return { task: serializeAssignedTask(row, { admin: isAdmin(user) }) };
}

// ----------------------------------------------------------------------------
// Queue + details
// ----------------------------------------------------------------------------

/**
 * Tasks a volunteer could legitimately accept: pending pickups for approved requests on open
 * incidents, inside THEIR coverage radius (the same base-address + radius rule the general
 * acceptDonation enforces, so nothing listed here is refused at acceptance for being out of
 * range). No donor contact details or street addresses are included.
 */
async function listAvailable(user, query) {
  const profile = await volunteerProfileModel.findByUserId(user.id);
  const { page, limit, offset } = getPaginationParams(query);
  if (!profile || profile.latitude === null || profile.longitude === null) {
    return { tasks: [], needsBaseAddress: true, meta: buildPaginationMeta({ page, limit, totalItems: 0 }) };
  }
  const radius = profile.coverage_radius || DEFAULT_RADIUS_KM;
  const rows = await reliefTaskModel.findAvailable({ limit: 500 });
  const eligible = [];
  rows.forEach((row) => {
    const d = row.pickup_address_details || {};
    if (d.latitude === undefined || d.latitude === null || d.longitude === undefined || d.longitude === null) return;
    const km = calculateDistance(profile.latitude, profile.longitude, Number(d.latitude), Number(d.longitude));
    if (km <= radius) eligible.push({ row, km });
  });
  const pageRows = eligible.slice(offset, offset + limit);
  return {
    tasks: pageRows.map(({ row, km }) => serializeAvailableTask(row, km)),
    needsBaseAddress: false,
    meta: buildPaginationMeta({ page, limit, totalItems: eligible.length }),
  };
}

async function listMine(user, query) {
  const { page, limit, offset } = getPaginationParams(query);
  const group = ['active', 'history'].includes(query.group) ? query.group : 'all';
  const [rows, total] = await Promise.all([
    reliefTaskModel.findMine(user.id, { group, limit, offset }),
    reliefTaskModel.countMine(user.id, { group }),
  ]);
  return { tasks: rows.map((r) => serializeAssignedTask(r)), meta: buildPaginationMeta({ page, limit, totalItems: total }) };
}

/**
 * Task detail. An assigned volunteer (or an admin) gets the full pickup and drop-off details;
 * any other volunteer can only see an unaccepted task in its limited "available" form, and gets
 * a 404 for anyone else's task (no existence leak).
 */
async function getTask(user, pledgeId) {
  const row = await reliefTaskModel.findByPledgeId(pledgeId);
  if (!row) throw notFound();
  if (isAdmin(user) || isAssigned(row, user.id)) return { task: serializeAssignedTask(row, { admin: isAdmin(user) }) };
  if (row.donation_status === 'pending' && row.pledge_status === 'pledged' && !row.donation_deleted) {
    return { task: serializeAvailableTask(row) };
  }
  throw notFound();
}

// ----------------------------------------------------------------------------
// Accept / schedule / on the way (existing donation lifecycle, unchanged rules)
// ----------------------------------------------------------------------------

async function acceptTask(user, pledgeId, ctx = {}) {
  const row = await reliefTaskModel.findByPledgeId(pledgeId);
  if (!row) throw notFound();
  if (row.pledge_status !== 'pledged' || row.donation_status !== 'pending' || row.donation_deleted
    || row.request_status !== 'approved' || !RELIEF.OPEN_INCIDENT_STATUSES.includes(row.incident_status)) {
    throw new AppError('This task is no longer available to accept.', HTTP_STATUS.CONFLICT, 'TASK_NOT_AVAILABLE');
  }
  // Reuse the existing acceptance rules: base address required, coverage radius, row lock,
  // status history + notifications written by the donation trigger.
  await donationService.acceptDonation(row.donation_id, user.id);
  await auditService.record({
    userId: user.id, action: AUDIT_ACTIONS.RELIEF_TASK_ACCEPTED, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent,
    metadata: { pledgeId, donationId: row.donation_id },
  });
  return assignedView(pledgeId, user);
}

async function loadAssigned(user, pledgeId) {
  const row = await reliefTaskModel.findByPledgeId(pledgeId);
  if (!row || !isAssigned(row, user.id)) throw notFound();
  return row;
}

async function scheduleTask(user, pledgeId, { scheduledAt }, ctx = {}) {
  const row = await loadAssigned(user, pledgeId);
  const donation = await donationModel.findById(row.donation_id);
  await donationService.schedulePickup(donation, user.id, scheduledAt);
  await auditService.record({
    userId: user.id, action: AUDIT_ACTIONS.RELIEF_TASK_STATUS_UPDATED, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent,
    metadata: { pledgeId, donationId: row.donation_id, to: 'scheduled' },
  });
  return assignedView(pledgeId, user);
}

async function onTheWay(user, pledgeId, ctx = {}) {
  const row = await loadAssigned(user, pledgeId);
  const donation = await donationModel.findById(row.donation_id);
  await donationService.markOnTheWay(donation, user.id, ctx);
  await auditService.record({
    userId: user.id, action: AUDIT_ACTIONS.RELIEF_TASK_STATUS_UPDATED, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent,
    metadata: { pledgeId, donationId: row.donation_id, to: 'on_the_way' },
  });
  return assignedView(pledgeId, user);
}

// ----------------------------------------------------------------------------
// Reports: pickup, delivery, failure, problem, release
// ----------------------------------------------------------------------------

function assertAssignedLocked(donation, userId) {
  if (!donation || !isAssigned(donation, userId)) throw notFound();
}

/**
 * Pickup confirmation WITH the quantity actually collected (may be less than pledged — a
 * shortfall needs an explanation). Moves the donation on_the_way -> picked_up (existing status)
 * and the pledge to 'collected'. Collected is informational: it never counts as delivered.
 */
async function reportPickup(user, pledgeId, { quantity, notes }, ctx = {}) {
  const out = await withPledgeLocks(pledgeId, {}, async ({ connection, item, pledge, donation }) => {
    assertAssignedLocked(donation, user.id);
    if (donation.status !== 'on_the_way') {
      throw new AppError('Mark the task as "on the way" before confirming pickup.', HTTP_STATUS.CONFLICT, 'INVALID_STATE_TRANSITION');
    }
    if (pledge.status !== 'pledged') {
      throw new AppError(`Cannot confirm pickup for a ${pledge.status} pledge.`, HTTP_STATUS.CONFLICT, 'INVALID_STATE_TRANSITION');
    }
    const milli = quantityOrThrow(quantity, item.unit);
    const pledged = dbToMilli(pledge.quantity_pledged);
    if (milli > pledged) {
      throw new AppError(`Collected quantity cannot exceed the pledged ${Number(pledge.quantity_pledged)} ${item.unit}.`, HTTP_STATUS.CONFLICT, 'COLLECTION_EXCEEDS_PLEDGE');
    }
    if (milli < pledged && !notes) {
      throw new AppError('Please explain why less than the pledged quantity was collected.', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'NOTES_REQUIRED');
    }
    const updated = await donationModel.markPickedUp(connection, donation.id, user.id);
    if (!updated) throw new AppError('The pickup could not be recorded; the task status changed.', HTTP_STATUS.CONFLICT);
    await reliefPledgeModel.updateById(pledgeId, { quantity_collected: milliToDb(milli), status: 'collected', collected_at: new Date() }, connection);
    await reliefPledgeReportModel.create({ pledgeId, reporterId: user.id, reportType: 'pickup', quantity: milliToDb(milli), status: 'recorded', notes: notes || null }, connection);
    return { donation: updated, donorId: pledge.donor_id, collected: milliToNumber(milli), pledged: milliToNumber(pledged), unit: item.unit };
  });

  donationService.emitDonationStatusUpdate(out.donation);
  await notifyRelief(out.donorId, {
    title: 'Relief pickup completed',
    message: `Your supplies were picked up (${out.collected} of ${out.pledged} ${out.unit}). Delivery to the affected area is next.`,
    relatedId: out.donation.id,
  });
  await auditService.record({
    userId: user.id, action: AUDIT_ACTIONS.RELIEF_PICKUP_REPORTED, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent,
    metadata: { pledgeId, donationId: out.donation.id, collected: out.collected, pledged: out.pledged },
  });
  return assignedView(pledgeId, user);
}

/**
 * Delivery report. The volunteer REPORTS what they delivered; unless verification is switched
 * off, the quantity stays "pending verification" and is NOT counted as delivered (and the
 * donation is NOT completed) until an administrator verifies it.
 */
async function reportDelivery(user, pledgeId, { quantity, notes, final = true }, ctx = {}) {
  const verificationRequired = requireDeliveryVerification();
  const out = await withPledgeLocks(pledgeId, { requestExclusive: true }, async ({ connection, request, item, pledge, donation }) => {
    assertAssignedLocked(donation, user.id);
    if (donation.status !== 'picked_up' || pledge.status !== 'collected') {
      throw new AppError('Delivery can only be reported after the goods have been picked up.', HTTP_STATUS.CONFLICT, 'INVALID_STATE_TRANSITION');
    }
    if ((await reliefPledgeReportModel.findOpenByPledge(pledgeId, ['failed_delivery'], connection)).length > 0) {
      throw new AppError('A failed-delivery report is awaiting an administrator. Delivery cannot be reported until it is resolved.', HTTP_STATUS.CONFLICT, 'FAILURE_OPEN');
    }
    const collected = dbToMilli(pledge.quantity_collected);
    const delivered = dbToMilli(pledge.quantity_delivered);
    const pending = dbToMilli(pledge.quantity_pending_verification);
    if (pending > 0) {
      throw new AppError('Your previous delivery report is still awaiting verification.', HTTP_STATUS.CONFLICT, 'DELIVERY_PENDING_VERIFICATION');
    }
    if (await reliefPledgeReportModel.findActiveFinalDelivery(pledgeId, connection)) {
      throw new AppError('A final delivery report has already been submitted for this task.', HTTP_STATUS.CONFLICT, 'DELIVERY_ALREADY_REPORTED');
    }
    const milli = quantityOrThrow(quantity, item.unit);
    if (milli > collected - delivered) {
      throw new AppError(`You can report at most ${milliToNumber(collected - delivered)} ${item.unit} (collected minus already delivered).`, HTTP_STATUS.CONFLICT, 'DELIVERY_EXCEEDS_COLLECTED');
    }
    if (final && delivered + milli < collected && !notes) {
      throw new AppError('Please explain the difference between the quantity collected and the quantity delivered.', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'NOTES_REQUIRED');
    }

    const reportId = await reliefPledgeReportModel.create({
      pledgeId, reporterId: user.id, reportType: 'delivery', quantity: milliToDb(milli), isFinal: final, status: 'pending', notes: notes || null,
    }, connection);

    if (verificationRequired) {
      await reliefPledgeModel.updateById(pledgeId, { quantity_pending_verification: milliToDb(milli) }, connection);
      return { donation, applied: null, donorId: pledge.donor_id, quantity: milliToNumber(milli), unit: item.unit };
    }
    const report = await reliefPledgeReportModel.findById(reportId, connection);
    const applied = await applyVerifiedDelivery({
      connection, request, pledge, donation, report, reportedMilli: 0, verifiedMilli: milli, isFinal: final, reviewerId: null,
    });
    return { donation, applied, donorId: pledge.donor_id, quantity: milliToNumber(milli), unit: item.unit };
  });

  if (out.applied && out.applied.completedDonation) {
    await donationService.afterDonationCompleted(out.applied.completedDonation, out.applied.completedDonation.volunteer_id, ctx);
  }
  await auditService.record({
    userId: user.id, action: AUDIT_ACTIONS.RELIEF_DELIVERY_REPORTED, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent,
    metadata: { pledgeId, donationId: out.donation.id, reported: out.quantity, final, verificationRequired },
  });
  await notifyRelief(out.donorId, {
    title: verificationRequired ? 'Relief delivery reported' : 'Relief delivery recorded',
    message: verificationRequired
      ? `The volunteer reported delivering ${out.quantity} ${out.unit} of your pledge. It will count as delivered once an administrator verifies it.`
      : `${out.quantity} ${out.unit} of your pledge were delivered.`,
    relatedId: out.donation.id,
  });
  return assignedView(pledgeId, user);
}

/** The volunteer could not deliver the collected goods. Needs an administrator; nothing counts as delivered. */
async function reportFailure(user, pledgeId, { notes }, ctx = {}) {
  const donationId = await withPledgeLocks(pledgeId, {}, async ({ connection, pledge, donation }) => {
    assertAssignedLocked(donation, user.id);
    if (donation.status !== 'picked_up' || pledge.status !== 'collected') {
      throw new AppError('A failed delivery can only be reported after pickup. Before pickup, release the task instead.', HTTP_STATUS.CONFLICT, 'INVALID_STATE_TRANSITION');
    }
    if ((await reliefPledgeReportModel.findOpenByPledge(pledgeId, ['failed_delivery'], connection)).length > 0) {
      throw new AppError('A failed-delivery report is already open for this task.', HTTP_STATUS.CONFLICT, 'FAILURE_OPEN');
    }
    await reliefPledgeReportModel.create({ pledgeId, reporterId: user.id, reportType: 'failed_delivery', status: 'open', notes }, connection);
    return donation.id;
  });
  await auditService.record({
    userId: user.id, action: AUDIT_ACTIONS.RELIEF_PROBLEM_REPORTED, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent,
    metadata: { pledgeId, donationId, type: 'failed_delivery' },
  });
  return assignedView(pledgeId, user);
}

/** Any problem needing admin help (wrong address, donor unreachable, damaged goods...). */
async function reportProblem(user, pledgeId, { notes }, ctx = {}) {
  const donationId = await withPledgeLocks(pledgeId, {}, async ({ connection, pledge, donation }) => {
    assertAssignedLocked(donation, user.id);
    if (!['pledged', 'collected'].includes(pledge.status)) {
      throw new AppError(`This task is already ${pledge.status}.`, HTTP_STATUS.CONFLICT, 'INVALID_STATE_TRANSITION');
    }
    await reliefPledgeReportModel.create({ pledgeId, reporterId: user.id, reportType: 'problem', status: 'open', notes }, connection);
    return donation.id;
  });
  await auditService.record({
    userId: user.id, action: AUDIT_ACTIONS.RELIEF_PROBLEM_REPORTED, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent,
    metadata: { pledgeId, donationId, type: 'problem' },
  });
  return assignedView(pledgeId, user);
}

/**
 * Gives an accepted task back (before pickup) so another volunteer can take it. The donation
 * returns to the existing 'pending' status; the pledge is untouched. Individual assignments
 * only — team assignments are managed with the existing team tools. Used by the volunteer
 * themselves and, as an admin reassignment, by administrators.
 */
async function releaseTask(user, pledgeId, { reason } = {}, ctx = {}) {
  const admin = isAdmin(user);
  const info = await withPledgeLocks(pledgeId, {}, async ({ connection, pledge, donation }) => {
    if (!donation) throw notFound();
    if (!admin) assertAssignedLocked(donation, user.id);
    if (donation.assignment_mode !== 'individual') {
      throw new AppError('Team tasks are managed with the team tools.', HTTP_STATUS.CONFLICT, 'TEAM_TASK');
    }
    if (!['accepted', 'scheduled', 'on_the_way'].includes(donation.status) || pledge.status !== 'pledged') {
      throw new AppError('A task can only be released before the pickup has been confirmed.', HTTP_STATUS.CONFLICT, 'INVALID_STATE_TRANSITION');
    }
    const previousVolunteer = donation.volunteer_id;
    const changed = await donationModel.releaseToPending(connection, donation.id, user.id);
    if (!changed) throw new AppError('The task could not be released.', HTTP_STATUS.CONFLICT);
    await reliefPledgeReportModel.create({ pledgeId, reporterId: user.id, reportType: 'release', status: 'recorded', notes: reason || null }, connection);
    return { donationId: donation.id, previousVolunteer, donorId: pledge.donor_id };
  });

  await notifyRelief(info.donorId, {
    title: 'Relief pickup is waiting for a new volunteer',
    message: 'The volunteer for your relief pickup was unable to continue. Your pledge is still active and another volunteer can accept it.',
    relatedId: info.donationId,
  });
  if (admin && info.previousVolunteer && info.previousVolunteer !== user.id) {
    await notifyRelief(info.previousVolunteer, {
      title: 'Relief task reassigned',
      message: `An administrator released relief pickup #${info.donationId} from you so it can be reassigned.`,
      relatedId: info.donationId,
    });
  }
  await auditService.record({
    userId: user.id, action: AUDIT_ACTIONS.RELIEF_TASK_RELEASED, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent,
    metadata: { pledgeId, donationId: info.donationId, byAdmin: admin, previousVolunteer: info.previousVolunteer },
  });
  return { released: true };
}

module.exports = {
  listAvailable, listMine, getTask, acceptTask, scheduleTask, onTheWay,
  reportPickup, reportDelivery, reportFailure, reportProblem, releaseTask, assignedView,
};
