const reliefRequestModel = require('../models/reliefRequest.model');
const reliefItemModel = require('../models/reliefRequestItem.model');
const reliefPledgeModel = require('../models/reliefPledge.model');
const donationModel = require('../models/donation.model');
const AppError = require('../utils/AppError');
const { runInTransaction } = require('../utils/dbTransaction');
const { HTTP_STATUS } = require('../constants');

/**
 * Runs `fn` holding, in this fixed order:
 *   request lock -> item lock -> pledge lock -> linked donation lock
 * Every relief write path uses the same order, so concurrent transactions queue
 * but cannot deadlock each other. The request lock is shared by default (many
 * pledges for one request may proceed in parallel; the item lock serialises each
 * item) and exclusive where the request itself may change state (delivery
 * verification can complete a request).
 *
 * `donation` is the pledge's linked donation_requests row (null when the pledge
 * has no logistics) — locked FOR UPDATE so a volunteer accepting it and a donor
 * cancelling the pledge cannot interleave.
 */
async function withPledgeLocks(pledgeId, { requestExclusive = false } = {}, fn) {
  const itemId = await reliefPledgeModel.findItemIdByPledgeId(pledgeId);
  if (!itemId) throw new AppError('Pledge not found.', HTTP_STATUS.NOT_FOUND);
  const item0 = await reliefItemModel.findById(itemId);
  const requestId = item0.relief_request_id;

  return runInTransaction(async (connection) => {
    const request = requestExclusive
      ? await reliefRequestModel.findByIdForUpdate(requestId, connection)
      : await reliefRequestModel.findByIdForShare(requestId, connection);
    const item = await reliefItemModel.findByIdForUpdate(itemId, connection);
    const pledge = await reliefPledgeModel.findByIdForUpdate(pledgeId, connection);
    if (!request || !item || !pledge) throw new AppError('Pledge not found.', HTTP_STATUS.NOT_FOUND);
    const donation = pledge.donation_request_id
      ? await donationModel.findByIdForUpdate(connection, pledge.donation_request_id)
      : null;
    return fn({ connection, request, item, pledge, donation });
  });
}

module.exports = { withPledgeLocks };
