const { HTTP_STATUS, DONATION_STATUS } = require('../constants');
const AppError = require('../utils/AppError');
const donationModel = require('../models/donation.model');
const userModel = require('../models/user.model');
const { UPLOAD_SUBFOLDERS } = require('../utils/uploadConfig');

/**
 * Upload service business logic.
 * Handles file upload operations for donations and user profiles.
 */

/**
 * Uploads a donation image and updates the donation record.
 * Only the donation owner can upload images, and only for pending donations.
 * @param {number} donationId - Donation ID
 * @param {number} userId - User ID attempting the upload
 * @param {string} filePath - Relative path of the uploaded file
 * @returns {Promise<Object>} Updated donation object
 */
async function uploadDonationImage(donationId, userId, filePath) {
  const donation = await donationModel.findById(donationId);

  if (!donation) {
    throw new AppError('Donation request not found.', HTTP_STATUS.NOT_FOUND);
  }

  // Verify ownership
  if (donation.donor_id !== userId) {
    throw new AppError('You are not allowed to modify this donation request.', HTTP_STATUS.FORBIDDEN);
  }

  // Only pending donations can be modified
  if (donation.status !== DONATION_STATUS.PENDING) {
    throw new AppError(
      `This donation request can no longer be modified because its status is "${donation.status}". Only pending requests can be modified.`,
      HTTP_STATUS.CONFLICT
    );
  }

  // Update donation with new photo path
  await donationModel.update(donationId, { photo: filePath });

  // Return updated donation
  const updatedDonation = await donationModel.findById(donationId);
  return updatedDonation;
}

/**
 * Uploads a profile photo and updates the user record.
 * Only the user themselves can update their own profile photo.
 * @param {number} userId - User ID
 * @param {string} filePath - Relative path of the uploaded file
 * @returns {Promise<Object>} Updated user object
 */
async function uploadProfilePhoto(userId, filePath) {
  const user = await userModel.findById(userId);

  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  // Update user with new profile photo path
  await userModel.updateProfilePhoto(userId, filePath);

  // Return updated user
  const updatedUser = await userModel.findById(userId);
  return updatedUser;
}

/**
 * Constructs the full URL for an uploaded file.
 * @param {string} relativePath - Relative path from uploads directory
 * @returns {string} Full URL accessible via the /uploads static route
 */
function getFileUrl(relativePath) {
  if (!relativePath) return null;
  return `/uploads/${relativePath}`;
}

module.exports = {
  uploadDonationImage,
  uploadProfilePhoto,
  getFileUrl,
};
