const express = require('express');
const router = express.Router();

const { uploadDonationImage, uploadProfilePhoto } = require('../../controllers/upload.controller');
const { protect } = require('../../middleware/auth.middleware');
const { loadDonation, restrictToDonationOwner } = require('../../middleware/donation.middleware');
const { uploadDonationImageMiddleware, uploadProfilePhotoMiddleware } = require('../../middleware/upload.middleware');

/**
 * POST /api/v1/uploads/donation/:id/image
 * Upload an image for a donation request.
 * Only the donation owner can upload images, and only for pending donations.
 */
router.post(
  '/donation/:id/image',
  protect,
  loadDonation,
  restrictToDonationOwner,
  uploadDonationImageMiddleware,
  uploadDonationImage
);

/**
 * POST /api/v1/uploads/profile/photo
 * Upload a profile photo for the authenticated user.
 */
router.post(
  '/profile/photo',
  protect,
  uploadProfilePhotoMiddleware,
  uploadProfilePhoto
);

module.exports = router;
