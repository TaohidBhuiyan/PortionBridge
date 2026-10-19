const reliefPledgeModel = require('../models/reliefPledge.model');
const reliefPledgeReportModel = require('../models/reliefPledgeReport.model');
const donationModel = require('../models/donation.model');
const reliefRequestService = require('./reliefRequest.service');
const AppError = require('../utils/AppError');
const { dbToMilli, milliToDb } = require('../utils/reliefQuantity');
const { HTTP_STATUS } = require('../constants');

/**
 * THE one place verified delivered quantities change for a pledge that has a pickup task.
 * Called (inside a transaction that already holds the request, item, pledge and donation
 * locks) when
 *   - an administrator verifies a volunteer's delivery report, or
 *   - verification is switched off and a volunteer's report is applied directly.
 *
 * Rules:
 *   delivered (verified)  += verifiedMilli
 *   pending verification  -= the quantity that had been reported
 *   delivered == pledged                  -> pledge 'delivered'
 *   final report, 0 < delivered < pledged -> pledge 'partially_fulfilled'  (shortfall released)
 *   final report, delivered == 0          -> pledge 'failed'
 *   otherwise                             -> pledge stays 'collected'
 * When the pledge is closed (delivered / partially_fulfilled / failed) the linked donation
 * moves picked_up -> completed (delivered or partial) so the existing lifecycle and its side
 * effects (history, notifications, achievements) run exactly once.
 * Finally the parent request is completed if EVERY item is now fully delivered.
 */
async function applyVerifiedDelivery({ connection, request, pledge, donation, report, reportedMilli, verifiedMilli, isFinal, reviewerId }) {
  const pledged = dbToMilli(pledge.quantity_pledged);
  const collected = dbToMilli(pledge.quantity_collected);
  const delivered = dbToMilli(pledge.quantity_delivered);
  const pending = dbToMilli(pledge.quantity_pending_verification);

  const newDelivered = delivered + verifiedMilli;
  const newPending = pending - reportedMilli;
  if (newPending < 0 || newDelivered + newPending > collected) {
    throw new AppError('The delivered quantity would exceed what was collected.', HTTP_STATUS.CONFLICT, 'DELIVERY_EXCEEDS_COLLECTED');
  }

  const fields = { quantity_delivered: milliToDb(newDelivered), quantity_pending_verification: milliToDb(newPending) };
  let status = pledge.status;
  const full = newDelivered === pledged;
  if (full) {
    status = 'delivered';
    fields.delivered_at = new Date();
  } else if (isFinal) {
    status = newDelivered > 0 ? 'partially_fulfilled' : 'failed';
    if (status === 'partially_fulfilled') fields.delivered_at = new Date();
    else fields.failed_at = new Date();
  }
  fields.status = status;
  await reliefPledgeModel.updateById(pledge.id, fields, connection);

  if (report) {
    await reliefPledgeReportModel.updateById(report.id, {
      status: 'verified', verified_quantity: milliToDb(verifiedMilli), reviewed_by: reviewerId, reviewed_at: new Date(),
    }, connection);
  }

  const closing = status !== 'collected';
  let completedDonation = null;
  if (closing && donation && donation.status === 'picked_up') {
    if (status === 'failed') {
      await donationModel.softDelete(donation.id, connection, reviewerId);
    } else {
      completedDonation = await donationModel.completeDonation(connection, donation.id, donation.volunteer_id || reviewerId);
    }
  }
  const requestCompleted = await reliefRequestService.completeRequestIfFulfilled(request.id, connection);
  return { status, completedDonation, requestCompleted, delivered: newDelivered };
}

module.exports = { applyVerifiedDelivery };
