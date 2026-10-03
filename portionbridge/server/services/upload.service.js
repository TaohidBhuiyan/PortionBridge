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
  // Normalize backslashes to forward slashes for cross-platform compatibility
  const normalizedPath = (filePath || '').replace(/\\/g, '/');

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

  // Parse existing images array if present
  let existingImages = [];
  if (Array.isArray(donation.images)) {
    existingImages = [...donation.images];
  } else if (typeof donation.images === 'string' && donation.images.trim()) {
    try {
      existingImages = JSON.parse(donation.images);
    } catch (e) {
      existingImages = [];
    }
  }

  // Normalize existing images to forward slashes
  existingImages = existingImages.map((img) => (typeof img === 'string' ? img.replace(/\\/g, '/') : img));

  // Add new normalized path if not already present
  if (!existingImages.includes(normalizedPath)) {
    existingImages.push(normalizedPath);
  }

  // Cover photo: set if missing or normalize existing
  const coverPhoto = donation.photo ? donation.photo.replace(/\\/g, '/') : normalizedPath;

  // Update donation record with normalized photo and images array
  await donationModel.update(donationId, {
    photo: coverPhoto,
    images: existingImages,
  });

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
  // Normalize Windows backslashes to forward slashes
  const normalizedPath = relativePath.replace(/\\/g, '/');
  return `/uploads/${normalizedPath}`;
}

module.exports = {
  uploadDonationImage,
  uploadProfilePhoto,
  getFileUrl,
};
