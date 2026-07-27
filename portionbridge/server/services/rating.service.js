const { pool } = require('../config/db');
const { HTTP_STATUS, DONATION_STATUS, NOTIFICATION_TYPES, AUDIT_ACTIONS } = require('../constants');
const AppError = require('../utils/AppError');
const ratingModel = require('../models/rating.model');
const donationModel = require('../models/donation.model');
const notificationModel = require('../models/notification.model');
const notificationService = require('./notification.service');
const auditService = require('./audit.service');

/**
 * Creates a rating for a completed donation. Only the donor may rate, only
 * once the donation is COMPLETED, and only once per donation (enforced both
 * by a pre-check and, as the real guarantee against races, the DB's
 * UNIQUE KEY (donation_request_id, rated_by)).
 * @param {number} donorId - ID of the donor submitting the rating
 * @param {Object} params
 * @param {number} params.donationId - Donation being rated
 * @param {number} params.stars - Rating value, 1-5
 * @param {string} [params.comment] - Optional comment
 * @param {string} [params.ipAddress]
 * @param {string} [params.userAgent]
 * @returns {Promise<Object>} The created rating object
 * @throws {AppError} 404 not found, 403 not the donor, 409 wrong status or already rated
 */
async function createRating(donorId, { donationId, stars, comment, ipAddress, userAgent }) {
  const donation = await donationModel.findById(donationId);

  if (!donation) {
    throw new AppError('Donation request not found.', HTTP_STATUS.NOT_FOUND);
  }
  if (donation.donor_id !== donorId) {
    throw new AppError('You are not allowed to rate this donation request.', HTTP_STATUS.FORBIDDEN);
  }
  if (donation.status !== DONATION_STATUS.COMPLETED) {
    throw new AppError(
      `This donation request cannot be rated because its status is "${donation.status}". Only completed donations can be rated.`,
      HTTP_STATUS.CONFLICT
    );
  }
  if (!donation.volunteer_id) {
    // Defensive — a completed donation should always have an assigned volunteer.
    throw new AppError('This donation has no assigned volunteer to rate.', HTTP_STATUS.CONFLICT);
  }

  const existing = await ratingModel.findByDonationId(donationId);
  if (existing) {
    throw new AppError('You have already rated this donation request.', HTTP_STATUS.CONFLICT);
  }

  const connection = await pool.getConnection();
  let ratingId;
  let notificationId;

  try {
    await connection.beginTransaction();

    ratingId = await ratingModel.create(connection, {
      donationRequestId: donationId,
      ratedBy: donorId,
      ratedUser: donation.volunteer_id,
      stars,
      comment,
    });

    notificationId = await notificationModel.create(connection, {
      userId: donation.volunteer_id,
      type: NOTIFICATION_TYPES.RATING_RECEIVED,
      title: 'You received a new rating',
      message: `You received a ${stars}-star rating for donation request #${donationId}.`,
      relatedId: donationId,
    });

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    // Race-condition safety net: two near-simultaneous rating attempts on the
    // same donation both pass the pre-check above; the DB's UNIQUE KEY is
    // what actually prevents the second insert, surfaced here as ER_DUP_ENTRY.
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('You have already rated this donation request.', HTTP_STATUS.CONFLICT);
    }
    throw err;
  } finally {
    connection.release();
  }

  const rating = await ratingModel.findById(ratingId);

  await notificationService.deliverById(donation.volunteer_id, notificationId);

  await auditService.record({
    userId: donorId,
    action: AUDIT_ACTIONS.RATING_CREATED,
    ipAddress,
    userAgent,
    metadata: { donationId, ratedUser: donation.volunteer_id, stars },
  });

  return rating;
}

/**
 * Gets the rating for a donation. Restricted to the donation's two
 * participants (donor and assigned volunteer) — mirrors the 403/404
 * ordering used for assignment details elsewhere in the app.
 * @param {number} donationId - Donation ID
 * @param {number} requestingUserId - ID of the user making the request
 * @returns {Promise<Object>} The rating object
 * @throws {AppError} 404 donation or rating not found, 403 not a participant
 */
async function getRatingByDonation(donationId, requestingUserId) {
  const donation = await donationModel.findById(donationId);
  if (!donation) {
    throw new AppError('Donation request not found.', HTTP_STATUS.NOT_FOUND);
  }

  const isParticipant = donation.donor_id === requestingUserId || donation.volunteer_id === requestingUserId;
  if (!isParticipant) {
    throw new AppError('You are not allowed to view this rating.', HTTP_STATUS.FORBIDDEN);
  }

  const rating = await ratingModel.findByDonationId(donationId);
  if (!rating) {
    throw new AppError('This donation request has not been rated yet.', HTTP_STATUS.NOT_FOUND);
  }

  return rating;
}

module.exports = { createRating, getRatingByDonation };
