const { HTTP_STATUS } = require('../constants');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getClientIp, getUserAgent } = require('../utils/helpers');
const donationService = require('../services/donation.service');

/**
 * GET /api/v1/donations/:id
 * Get donation details by ID.
 */
const getDonationDetails = asyncHandler(async (req, res) => {
  const donation = await donationService.getDonationDetails(req.params.id, req.user.id, req.user.role);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Donation details retrieved successfully.',
    data: { donation },
  });
});

/**
 * POST /api/v1/donations
 */
const createDonation = asyncHandler(async (req, res) => {
  const {
    title,
    category,
    quantity,
    quantityUnit,
    numberOfServings,
    pickupTime,
    pickupDate,
    pickupTimeSlot,
    expiryDate,
    contactPhone,
    description,
    photo,
    foodType,
    foodName,
    ingredients,
    allergens,
    storageRequirement,
    isVegetarian,
    isHalal,
    refrigerationRequired,
    clothingCategory,
    gender,
    ageGroup,
    itemCondition,
    brand,
    size,
    color,
    season,
    images,
    additionalNotes,
    savedAddressId,
    pickupAddress,
    saveForFuture,
  } = req.body;

  const donation = await donationService.createDonation(req.user.id, {
    title,
    category,
    quantity,
    quantityUnit,
    numberOfServings,
    pickupTime,
    pickupDate,
    pickupTimeSlot,
    expiryDate,
    contactPhone,
    description,
    photo,
    foodType,
    foodName,
    ingredients,
    allergens,
    storageRequirement,
    isVegetarian,
    isHalal,
    refrigerationRequired,
    clothingCategory,
    gender,
    ageGroup,
    itemCondition,
    brand,
    size,
    color,
    season,
    images,
    additionalNotes,
    savedAddressId,
    pickupAddress,
    saveForFuture,
  });

  return success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Donation request created successfully.',
    data: { donation },
  });
});

/**
 * PATCH /api/v1/donations/:id
 */
const updateDonation = asyncHandler(async (req, res) => {
  const {
    title,
    category,
    quantity,
    quantityUnit,
    numberOfServings,
    pickupTime,
    pickupDate,
    pickupTimeSlot,
    expiryDate,
    contactPhone,
    description,
    photo,
    foodType,
    foodName,
    ingredients,
    allergens,
    storageRequirement,
    isVegetarian,
    isHalal,
    refrigerationRequired,
    clothingCategory,
    gender,
    ageGroup,
    itemCondition,
    brand,
    size,
    color,
    season,
    images,
    additionalNotes,
    savedAddressId,
  } = req.body;

  const donation = await donationService.updateDonation(req.params.id, req.user.id, {
    title,
    category,
    quantity,
    quantityUnit,
    numberOfServings,
    pickupTime,
    pickupDate,
    pickupTimeSlot,
    expiryDate,
    contactPhone,
    description,
    photo,
    foodType,
    foodName,
    ingredients,
    allergens,
    storageRequirement,
    isVegetarian,
    isHalal,
    refrigerationRequired,
    clothingCategory,
    gender,
    ageGroup,
    itemCondition,
    brand,
    size,
    color,
    season,
    images,
    additionalNotes,
    savedAddressId,
  });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Donation request updated successfully.',
    data: { donation },
  });
});

/**
 * DELETE /api/v1/donations/:id  (soft delete / cancel)
 */
const cancelDonation = asyncHandler(async (req, res) => {
  await donationService.cancelDonation(req.params.id, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Donation request cancelled successfully.',
  });
});

/**
 * GET /api/v1/donations
 * Browse pending donation requests — search, filter, sort, paginate.
 */
const browseDonations = asyncHandler(async (req, res) => {
  const { donations, meta } = await donationService.browseDonations(req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Donation requests retrieved successfully.',
    data: { donations },
    meta,
  });
});

/**
 * PATCH /api/v1/donations/:id/accept
 * A volunteer accepts a pending donation request. Transaction + row-lock
 * safe — see donationService.acceptDonation for the concurrency handling.
 */
const acceptDonation = asyncHandler(async (req, res) => {
  const donation = await donationService.acceptDonation(req.donation.id, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Donation accepted successfully.',
    data: { donation },
  });
});

/**
 * PATCH /api/v1/donations/:id/schedule
 * The assigned volunteer sets a pickup time on a donation they've accepted.
 */
const schedulePickup = asyncHandler(async (req, res) => {
  const { scheduledAt } = req.body;

  const donation = await donationService.schedulePickup(req.donation, req.user.id, scheduledAt);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Pickup scheduled successfully.',
    data: { donation },
  });
});

/**
 * PATCH /api/v1/donations/:id/on-the-way
 * (Module 9) The assigned volunteer marks a scheduled donation as on the way.
 */
const markOnTheWay = asyncHandler(async (req, res) => {
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const donation = await donationService.markOnTheWay(req.donation, req.user.id, { ipAddress, userAgent });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Donation marked as on the way.',
    data: { donation },
  });
});

/**
 * PATCH /api/v1/donations/:id/picked-up
 * (Module 9) The assigned volunteer marks an on-the-way donation as picked up.
 */
const markPickedUp = asyncHandler(async (req, res) => {
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const donation = await donationService.markPickedUp(req.donation, req.user.id, { ipAddress, userAgent });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Donation marked as picked up.',
    data: { donation },
  });
});

/**
 * PATCH /api/v1/donations/:id/complete
 * (Module 9 — BEHAVIOR CHANGE) The DONOR marks a picked-up donation as
 * completed. Previously this was the assigned volunteer completing a
 * scheduled donation directly — see donationService.completeDonation for
 * the full rationale.
 */
const completeDonation = asyncHandler(async (req, res) => {
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const donation = await donationService.completeDonation(req.params.id, req.user.id, { ipAddress, userAgent });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Donation completed successfully.',
    data: { donation },
  });
});

/**
 * GET /api/v1/donations/my-history
 * Full donation history for the authenticated donor.
 */
const getDonorHistory = asyncHandler(async (req, res) => {
  const { donations, meta } = await donationService.getDonorHistory(req.user.id, req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Donation history retrieved successfully.',
    data: { donations },
    meta,
  });
});

/**
 * GET /api/v1/donations/assigned-history
 * Full donation history for the authenticated volunteer.
 */
const getVolunteerHistory = asyncHandler(async (req, res) => {
  const { donations, meta } = await donationService.getVolunteerHistory(req.user.id, req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Assigned donation history retrieved successfully.',
    data: { donations },
    meta,
  });
});

/**
 * GET /api/v1/donations/my-history/summary
 */
const getDonorHistorySummary = asyncHandler(async (req, res) => {
  const summary = await donationService.getDonorHistorySummary(req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Donation history summary retrieved successfully.',
    data: { summary },
  });
});

/**
 * GET /api/v1/donations/assigned-history/summary
 */
const getVolunteerHistorySummary = asyncHandler(async (req, res) => {
  const summary = await donationService.getVolunteerHistorySummary(req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Assigned donation history summary retrieved successfully.',
    data: { summary },
  });
});

/**
 * POST /api/v1/donations/:id/accept-team
 * Accept a donation on behalf of a team (team leader only)
 */
const acceptDonationForTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.body;
  const donation = await donationService.acceptDonationForTeam(req.params.id, teamId, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Donation accepted for team successfully.',
    data: { donation },
  });
});

/**
 * POST /api/v1/donations/:id/assign-member
 * Assign a team member to a team-assigned donation (team leader only)
 */
const assignTeamMember = asyncHandler(async (req, res) => {
  const { teamId, memberId } = req.body;
  await donationService.assignTeamMemberToDonation(req.params.id, teamId, memberId, req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Team member assigned successfully.',
  });
});

/**
 * GET /api/v1/donations/team/:teamId
 * Get donations assigned to a team (team leader only)
 */
const getTeamDonations = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const donations = await donationService.getTeamDonations(req.params.teamId, status);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Team donations retrieved successfully.',
    data: { donations },
  });
});

/**
 * GET /api/v1/donations/my-assignments
 * Get donations assigned to the current team member
 */
const getMyAssignments = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const donations = await donationService.getMemberAssignments(req.user.id, status);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Your assignments retrieved successfully.',
    data: { donations },
  });
});

/**
 * GET /api/v1/donations/team/:teamId/assignments
 * Get all team assignments with details (team leader only)
 */
const getTeamAssignments = asyncHandler(async (req, res) => {
  const assignments = await donationService.getTeamAssignments(req.params.teamId);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Team assignments retrieved successfully.',
    data: { assignments },
  });
});

module.exports = {
  getDonationDetails,
  createDonation,
  updateDonation,
  cancelDonation,
  browseDonations,
  acceptDonation,
  acceptDonationForTeam,
  assignTeamMember,
  schedulePickup,
  markOnTheWay,
  markPickedUp,
  completeDonation,
  getDonorHistory,
  getVolunteerHistory,
  getDonorHistorySummary,
  getVolunteerHistorySummary,
  getTeamDonations,
  getMyAssignments,
  getTeamAssignments,
};
