const reliefPledgeModel = require('../models/reliefPledge.model');
const reliefPledgeReportModel = require('../models/reliefPledgeReport.model');
const reliefTaskModel = require('../models/reliefTask.model');
const donationModel = require('../models/donation.model');
const donationService = require('./donation.service');
const reliefRequestService = require('./reliefRequest.service');
const auditService = require('./audit.service');
const { withPledgeLocks } = require('./reliefLocking');
const { applyVerifiedDelivery } = require('./reliefDelivery');
const { notifyRelief } = require('./reliefNotify');
const AppError = require('../utils/AppError');
const { quantityOrThrow } = require('../utils/reliefQuantityInput');
const { dbToMilli, milliToDb, milliToNumber } = require('../utils/reliefQuantity');
const { serializeAssignedTask, serializeReport } = require('../utils/reliefTaskSerializers');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');
const { HTTP_STATUS, AUDIT_ACTIONS, USER_ROLES } = require('../constants');

const isAdmin = (user) => Boolean(user) && user.role === USER_ROLES.ADMIN;
const reportNotFound = () => new AppError('Report not found.', HTTP_STATUS.NOT_FOUND);

function serializeQueueRow(r) {
  return {
    ...serializeReport(r, { internal: true }),
    pledgeId: r.pledge_id,
    pledgeStatus: r.pledge_status,
    donationId: r.donation_request_id,
    incident: { id: r.incident_id, title: r.incident_title, district: r.district },
    request: { id: r.request_id, title: r.request_title },
    item: { id: r.item_id, name: r.item_name, unit: r.unit },
    donorName: r.donor_name,
    pledge: {
      pledged: Number(r.quantity_pledged), collected: Number(r.quantity_collected),
      delivered: Number(r.quantity_delivered), pendingVerification: Number(r.quantity_pending_verification),
    },
  };
}

/** Admin queue. Defaults to what needs a decision: delivery awaiting verification and open problems. */
async function listReports(query) {
  const { page, limit, offset } = getPaginationParams(query);
  const filters = {
    types: query.type ? [query.type] : undefined,
    statuses: query.status ? [query.status] : ['pending', 'open'],
  };
  const [rows, total] = await Promise.all([
    reliefPledgeReportModel.findQueue(filters, { limit, offset }),
    reliefPledgeReportModel.countQueue(filters),
  ]);
  return { reports: rows.map(serializeQueueRow), meta: buildPaginationMeta({ page, limit, totalItems: total }) };
}

async function pledgeIdOfReport(reportId, types) {
  const report = await reliefPledgeReportModel.findById(reportId);
  if (!report || (types && !types.includes(report.report_type))) throw reportNotFound();
  return report.pledge_id;
}

/**
 * Verifies a volunteer's delivery report. The ONLY route by which reported delivery becomes
 * verified delivered quantity (besides an admin's own direct entry for unlinked pledges).
 * The admin may verify a smaller quantity than reported (a discrepancy, which needs notes);
 * never more. Completes the linked donation and, if every item is now delivered, the request.
 */
async function verifyDelivery(admin, reportId, { verifiedQuantity, notes }, ctx = {}) {
  const pledgeId = await pledgeIdOfReport(reportId, ['delivery']);
  const out = await withPledgeLocks(pledgeId, { requestExclusive: true }, async ({ connection, request, item, pledge, donation }) => {
    const report = await reliefPledgeReportModel.findByIdForUpdate(reportId, connection);
    if (!report || report.status !== 'pending') {
      throw new AppError('This delivery report is not awaiting verification.', HTTP_STATUS.CONFLICT, 'REPORT_NOT_PENDING');
    }
    if (!donation || donation.status !== 'picked_up' || pledge.status !== 'collected') {
      throw new AppError('The task is no longer in a state where delivery can be verified.', HTTP_STATUS.CONFLICT, 'INVALID_STATE_TRANSITION');
    }
    const reported = dbToMilli(report.quantity);
    const verified = verifiedQuantity === undefined || verifiedQuantity === null ? reported : quantityOrThrow(verifiedQuantity, item.unit, 'Verified quantity');
    if (verified > reported) {
      throw new AppError('You cannot verify more than the volunteer reported.', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VERIFIED_EXCEEDS_REPORTED');
    }
    if (verified < reported && !notes) {
      throw new AppError('Please explain why a smaller quantity was verified than was reported.', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'NOTES_REQUIRED');
    }
    const applied = await applyVerifiedDelivery({
      connection, request, pledge, donation, report, reportedMilli: reported, verifiedMilli: verified,
      isFinal: Boolean(report.is_final), reviewerId: admin.id,
    });
    if (notes) await reliefPledgeReportModel.updateById(reportId, { review_notes: notes }, connection);
    return { applied, donation, donorId: pledge.donor_id, volunteerId: report.reporter_id, reported, verified, unit: item.unit, pledgeStatus: applied.status };
  });

  if (out.applied.completedDonation) {
    await donationService.afterDonationCompleted(out.applied.completedDonation, out.applied.completedDonation.volunteer_id, ctx);
  }
  await auditService.record({
    userId: admin.id, action: AUDIT_ACTIONS.RELIEF_DELIVERY_VERIFIED, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent,
    metadata: {
      reportId, pledgeId, reported: milliToNumber(out.reported), verified: milliToNumber(out.verified),
      pledgeStatus: out.pledgeStatus, requestCompleted: out.applied.requestCompleted,
    },
  });
  const discrepancy = out.verified < out.reported;
  await notifyRelief(out.donorId, {
    title: 'Relief delivery verified',
    message: `${milliToNumber(out.verified)} ${out.unit} of your pledge were verified as delivered${out.pledgeStatus === 'delivered' ? ' — your pledge is complete. Thank you!' : out.pledgeStatus === 'partially_fulfilled' ? '. Your pledge was closed as partially fulfilled.' : '.'}`,
    relatedId: out.donation.id,
  });
  await notifyRelief(out.volunteerId, {
    title: 'Your delivery was verified',
    message: discrepancy
      ? `An administrator verified ${milliToNumber(out.verified)} of the ${milliToNumber(out.reported)} ${out.unit} you reported.`
      : `Your delivery of ${milliToNumber(out.verified)} ${out.unit} was verified.`,
    relatedId: out.donation.id,
  });
  return getReportDetail(reportId);
}

/** Rejects a delivery report outright (nothing counts as delivered); the volunteer can resubmit. */
async function rejectDelivery(admin, reportId, { notes }, ctx = {}) {
  const pledgeId = await pledgeIdOfReport(reportId, ['delivery']);
  const out = await withPledgeLocks(pledgeId, {}, async ({ connection, pledge, donation }) => {
    const report = await reliefPledgeReportModel.findByIdForUpdate(reportId, connection);
    if (!report || report.status !== 'pending') {
      throw new AppError('This delivery report is not awaiting verification.', HTTP_STATUS.CONFLICT, 'REPORT_NOT_PENDING');
    }
    const remaining = dbToMilli(pledge.quantity_pending_verification) - dbToMilli(report.quantity);
    await reliefPledgeModel.updateById(pledgeId, { quantity_pending_verification: milliToDb(Math.max(0, remaining)) }, connection);
    await reliefPledgeReportModel.updateById(reportId, { status: 'rejected', reviewed_by: admin.id, reviewed_at: new Date(), review_notes: notes }, connection);
    return { volunteerId: report.reporter_id, donationId: donation ? donation.id : null };
  });
  await auditService.record({
    userId: admin.id, action: AUDIT_ACTIONS.RELIEF_DELIVERY_REJECTED, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent,
    metadata: { reportId, pledgeId },
  });
  await notifyRelief(out.volunteerId, {
    title: 'Delivery report not accepted',
    message: `An administrator did not accept your delivery report: ${notes}. Please submit a corrected report.`,
    relatedId: out.donationId,
  });
  return getReportDetail(reportId);
}

/**
 * Closes out an open failed-delivery / problem report.
 *   close   acknowledge the report; no change to the pledge
 *   reopen  (failed delivery only) let the volunteer try the delivery again
 *   fail    end the task: nothing more will be delivered. Pledge becomes 'failed' (nothing
 *           verified delivered) or 'partially_fulfilled' (some was); the shortfall is released.
 */
async function resolveReport(admin, reportId, { action, notes }, ctx = {}) {
  const pledgeId = await pledgeIdOfReport(reportId, ['failed_delivery', 'problem']);
  const out = await withPledgeLocks(pledgeId, { requestExclusive: true }, async ({ connection, request, pledge, donation }) => {
    const report = await reliefPledgeReportModel.findByIdForUpdate(reportId, connection);
    if (!report || report.status !== 'open') throw new AppError('This report is not open.', HTTP_STATUS.CONFLICT, 'REPORT_NOT_OPEN');
    if (action === 'reopen' && report.report_type !== 'failed_delivery') {
      throw new AppError('Only a failed delivery can be reopened.', HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    let completedDonation = null;
    let status = pledge.status;
    let requestCompleted = false;
    if (action === 'fail') {
      if (pledge.status !== 'collected') {
        throw new AppError('Only a pledge whose goods were collected can be failed. Cancel or release it instead.', HTTP_STATUS.CONFLICT, 'INVALID_STATE_TRANSITION');
      }
      if (dbToMilli(pledge.quantity_pending_verification) > 0) {
        throw new AppError('Verify or reject the pending delivery report first.', HTTP_STATUS.CONFLICT, 'DELIVERY_PENDING_VERIFICATION');
      }
      const delivered = dbToMilli(pledge.quantity_delivered);
      status = delivered > 0 ? 'partially_fulfilled' : 'failed';
      await reliefPledgeModel.updateById(pledgeId, delivered > 0
        ? { status, delivered_at: new Date() }
        : { status, failed_at: new Date() }, connection);
      if (donation && donation.status === 'picked_up') {
        if (delivered > 0) completedDonation = await donationModel.completeDonation(connection, donation.id, donation.volunteer_id || admin.id);
        else await donationModel.softDelete(donation.id, connection, admin.id);
      }
      requestCompleted = await reliefRequestService.completeRequestIfFulfilled(request.id, connection);
      for (const open of await reliefPledgeReportModel.findOpenByPledge(pledgeId, ['failed_delivery', 'problem'], connection)) {
        await reliefPledgeReportModel.updateById(open.id, { status: 'resolved', reviewed_by: admin.id, reviewed_at: new Date(), review_notes: notes || 'Task closed by an administrator' }, connection);
      }
    } else {
      await reliefPledgeReportModel.updateById(reportId, { status: 'resolved', reviewed_by: admin.id, reviewed_at: new Date(), review_notes: notes || null }, connection);
    }
    return { status, completedDonation, requestCompleted, volunteerId: report.reporter_id, donorId: pledge.donor_id, donationId: donation ? donation.id : null };
  });

  if (out.completedDonation) {
    await donationService.afterDonationCompleted(out.completedDonation, out.completedDonation.volunteer_id, ctx);
  }
  await auditService.record({
    userId: admin.id, action: action === 'fail' ? AUDIT_ACTIONS.RELIEF_PLEDGE_FAILED : AUDIT_ACTIONS.RELIEF_REPORT_RESOLVED,
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent,
    metadata: { reportId, pledgeId, action, pledgeStatus: out.status, hasNotes: Boolean(notes) },
  });
  await notifyRelief(out.volunteerId, {
    title: 'Your relief report was reviewed',
    message: action === 'reopen' ? 'An administrator reopened the delivery — you can try again.'
      : action === 'fail' ? 'An administrator closed this relief task.'
      : 'An administrator resolved the problem you reported.',
    relatedId: out.donationId,
  });
  if (action === 'fail') {
    await notifyRelief(out.donorId, {
      title: out.status === 'failed' ? 'Relief delivery could not be completed' : 'Relief pledge closed as partially fulfilled',
      message: out.status === 'failed'
        ? 'Your supplies could not be delivered. Nothing has been counted as delivered. An administrator will follow up if needed.'
        : 'Part of your pledge was delivered and verified. The rest could not be delivered.',
      relatedId: out.donationId,
    });
  }
  return getReportDetail(reportId);
}

async function getReportDetail(reportId) {
  const report = await reliefPledgeReportModel.findById(reportId);
  if (!report) throw reportNotFound();
  return { report: serializeReport(report, { internal: true }), task: await adminTask(report.pledge_id) };
}

async function adminTask(pledgeId) {
  const row = await reliefTaskModel.findByPledgeId(pledgeId);
  return row ? serializeAssignedTask(row, { admin: true }) : null;
}

/** Every relief task, newest/attention first, for administrators. */
async function listTasks(query) {
  const { page, limit, offset } = getPaginationParams(query);
  const filters = {
    attention: query.attention === 'true',
    status: query.status || undefined,
    requestId: query.requestId ? Number(query.requestId) : undefined,
  };
  const [rows, total] = await Promise.all([
    reliefTaskModel.findForAdmin(filters, { limit, offset }),
    reliefTaskModel.countForAdmin(filters),
  ]);
  return { tasks: rows.map((r) => serializeAssignedTask(r, { admin: true })), meta: buildPaginationMeta({ page, limit, totalItems: total }) };
}

/**
 * Audit-style history of one pledge: donation status changes (from the existing status
 * history) merged with pickup / delivery / problem reports. Admins see everything including
 * notes and who acted; the donor and the assigned volunteer see their own task without
 * internal reviewer details.
 */
async function getTimeline(user, pledgeId) {
  const row = await reliefTaskModel.findByPledgeId(pledgeId);
  if (!row) throw new AppError('Pledge not found.', HTTP_STATUS.NOT_FOUND);
  const admin = isAdmin(user);
  const donor = row.donor_id === user.id;
  const volunteer = row.volunteer_id === user.id || row.assigned_member_id === user.id;
  if (!admin && !donor && !volunteer) throw new AppError('Pledge not found.', HTTP_STATUS.NOT_FOUND);

  const [history, reports] = await Promise.all([
    reliefTaskModel.findDonationHistory(row.donation_id),
    reliefPledgeReportModel.findByPledge(pledgeId),
  ]);
  const events = [
    ...history.map((h) => ({
      kind: 'status', at: h.changed_at, from: h.old_status, to: h.new_status, ...(admin ? { by: h.changed_by_name || null } : {}),
    })),
    ...reports.map((r) => ({ kind: 'report', at: r.created_at, ...serializeReport(r, { internal: admin || volunteer }) })),
  ].sort((a, b) => new Date(a.at) - new Date(b.at));
  return { pledgeId, events };
}

module.exports = { listReports, verifyDelivery, rejectDelivery, resolveReport, listTasks, getTimeline, getReportDetail };
