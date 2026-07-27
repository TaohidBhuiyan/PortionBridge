const { pool } = require('../config/db');
const { HTTP_STATUS, AUDIT_ACTIONS } = require('../constants');
const AppError = require('../utils/AppError');
const reportModel = require('../models/report.model');
const donationModel = require('../models/donation.model');
const auditService = require('./audit.service');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');

/**
 * Creates a report tied to a donation. Only a participant in that donation
 * (its donor or its assigned volunteer) may file a report, and only once
 * per donation (pre-checked here; guaranteed by the DB's UNIQUE KEY added
 * in migration_006 against races). If a target user is named, they must be
 * the OTHER participant in the same donation, not an arbitrary user.
 * @param {number} reporterId - ID of the user filing the report
 * @param {Object} params
 * @param {number} params.donationId - Donation the report relates to
 * @param {number} [params.reportedUserId] - User being reported, if any
 * @param {string} params.reason - Reason for the report
 * @param {string} [params.details] - Optional additional details
 * @param {string} [params.ipAddress]
 * @param {string} [params.userAgent]
 * @returns {Promise<Object>} The created report object
 * @throws {AppError} 404 donation not found, 403 not a participant, 400 invalid target, 409 already reported
 */
async function createReport(reporterId, { donationId, reportedUserId, reason, details, ipAddress, userAgent }) {
  const donation = await donationModel.findById(donationId);

  if (!donation) {
    throw new AppError('Donation request not found.', HTTP_STATUS.NOT_FOUND);
  }

  const isParticipant = donation.donor_id === reporterId || donation.volunteer_id === reporterId;
  if (!isParticipant) {
    throw new AppError('You are not allowed to report this donation request.', HTTP_STATUS.FORBIDDEN);
  }

  if (reportedUserId) {
    const isValidTarget =
      reportedUserId !== reporterId &&
      (reportedUserId === donation.donor_id || reportedUserId === donation.volunteer_id);

    if (!isValidTarget) {
      throw new AppError(
        'reportedUserId must be the other participant in this donation request.',
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  const existing = await reportModel.findByReporterAndDonation(reporterId, donationId);
  if (existing) {
    throw new AppError('You have already reported this donation request.', HTTP_STATUS.CONFLICT);
  }

  const connection = await pool.getConnection();
  let reportId;

  try {
    await connection.beginTransaction();

    reportId = await reportModel.create(connection, {
      reporterId,
      reportedUserId: reportedUserId || null,
      reportedDonationId: donationId,
      reason,
      details,
    });

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    // Race-condition safety net — see reportModel.create's doc comment.
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('You have already reported this donation request.', HTTP_STATUS.CONFLICT);
    }
    throw err;
  } finally {
    connection.release();
  }

  const report = await reportModel.findById(reportId);

  await auditService.record({
    userId: reporterId,
    action: AUDIT_ACTIONS.REPORT_FILED,
    ipAddress,
    userAgent,
    metadata: { donationId, reportedUserId: reportedUserId || null, reason },
  });

  // Notification is intentionally NOT sent here — reports don't have a
  // natural single recipient in Phase 2 (no admin-facing feature exists
  // yet to notify), and the spec marks this as optional.

  return report;
}

/**
 * Lists the requesting user's own filed reports, with optional status
 * filter and pagination.
 * @param {number} reporterId - ID of the requesting user
 * @param {Object} query - Query parameters from request
 * @returns {Promise<Object>} Object containing reports array and pagination meta
 */
async function listMyReports(reporterId, query) {
  const { page, limit, offset } = getPaginationParams(query);
  const { status, sortBy, sortOrder } = query;
  const filters = { reporterId, status };

  const [reports, totalItems] = await Promise.all([
    reportModel.findMyReports({ ...filters, sortBy, sortOrder, limit, offset }),
    reportModel.countMyReports(filters),
  ]);

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { reports, meta };
}

module.exports = { createReport, listMyReports };
