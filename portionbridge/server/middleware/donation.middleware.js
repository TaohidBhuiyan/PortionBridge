const { HTTP_STATUS } = require('../constants');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const donationModel = require('../models/donation.model');

/**
 * Loads the donation for :id and attaches it as req.donation.
 * 404s early if it doesn't exist (or is soft-deleted) — keeps the
 * controller/service from having to re-check existence.
 */
const loadDonation = asyncHandler(async (req, res, next) => {
  const donation = await donationModel.findById(req.params.id);
  if (!donation) {
    throw new AppError('Donation request not found.', HTTP_STATUS.NOT_FOUND);
  }
  req.donation = donation;
  next();
});

/**
 * Must run after protect + loadDonation. Ensures only the donor who
 * created the request can edit/cancel it.
 */
function restrictToDonationOwner(req, res, next) {
  if (req.donation.donor_id !== req.user.id) {
    throw new AppError('You are not allowed to modify this donation request.', HTTP_STATUS.FORBIDDEN);
  }
  next();
}

module.exports = { loadDonation, restrictToDonationOwner };
