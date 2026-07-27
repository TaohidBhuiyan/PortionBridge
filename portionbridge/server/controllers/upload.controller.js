const { HTTP_STATUS } = require('../constants');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const uploadService = require('../services/upload.service');
const { UPLOAD_SUBFOLDERS } = require('../utils/uploadConfig');
const path = require('path');

/**
 * POST /api/v1/uploads/donation/:id/image
 * Upload an image for a donation request.
 */
const uploadDonationImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded.', HTTP_STATUS.BAD_REQUEST);
  }

  // Extract relative path from full file path
  const relativePath = path.join(UPLOAD_SUBFOLDERS.DONATIONS, path.basename(req.file.path));

  const donation = await uploadService.uploadDonationImage(
    req.params.id,
    req.user.id,
    relativePath
  );

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Donation image uploaded successfully.',
    data: { donation },
  });
});

/**
 * POST /api/v1/uploads/profile/photo
 * Upload a profile photo for the authenticated user.
 */
const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded.', HTTP_STATUS.BAD_REQUEST);
  }

  // Extract relative path from full file path
  const relativePath = path.join(UPLOAD_SUBFOLDERS.PROFILES, path.basename(req.file.path));

  const user = await uploadService.uploadProfilePhoto(req.user.id, relativePath);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Profile photo uploaded successfully.',
    data: { user },
  });
});

module.exports = {
  uploadDonationImage,
  uploadProfilePhoto,
};
