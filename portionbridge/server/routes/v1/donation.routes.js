const express = require('express');
const router = express.Router();

const {
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
} = require('../../controllers/donation.controller');

const {
  createDonationValidationRules,
  updateDonationValidationRules,
  cancelDonationValidationRules,
  browseDonationsValidationRules,
  acceptDonationValidationRules,
  schedulePickupValidationRules,
  onTheWayValidationRules,
  pickedUpValidationRules,
  completeDonationValidationRules,
  historyQueryValidationRules,
  historySummaryValidationRules,
} = require('../../validators/donation.validator');

const validateRequest = require('../../middleware/validateRequest');
const { protect, authorize } = require('../../middleware/auth.middleware');
const { loadDonation, restrictToDonationOwner } = require('../../middleware/donation.middleware');
const { USER_ROLES } = require('../../constants');

// Volunteers (and admins) browse pending requests.
router.get(
  '/',
  protect,
  authorize(USER_ROLES.VOLUNTEER, USER_ROLES.ADMIN),
  browseDonationsValidationRules,
  validateRequest,
  browseDonations
);

// --- Donor history (static paths — must be registered before any future
// GET '/:id' route is added, so they're never shadowed by a param route) ---
router.get(
  '/my-history/summary',
  protect,
  authorize(USER_ROLES.DONOR),
  historySummaryValidationRules,
  validateRequest,
  getDonorHistorySummary
);

router.get(
  '/my-history',
  protect,
  authorize(USER_ROLES.DONOR),
  historyQueryValidationRules,
  validateRequest,
  getDonorHistory
);

// --- Volunteer history ---
router.get(
  '/assigned-history/summary',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  historySummaryValidationRules,
  validateRequest,
  getVolunteerHistorySummary
);

router.get(
  '/assigned-history',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  historyQueryValidationRules,
  validateRequest,
  getVolunteerHistory
);

// Only donors can create/edit/cancel donation requests.
router.post(
  '/',
  protect,
  authorize(USER_ROLES.DONOR),
  createDonationValidationRules,
  validateRequest,
  createDonation
);

router.patch(
  '/:id',
  protect,
  authorize(USER_ROLES.DONOR),
  updateDonationValidationRules,
  validateRequest,
  loadDonation,
  restrictToDonationOwner,
  updateDonation
);

router.delete(
  '/:id',
  protect,
  authorize(USER_ROLES.DONOR),
  cancelDonationValidationRules,
  validateRequest,
  loadDonation,
  restrictToDonationOwner,
  cancelDonation
);

// A volunteer accepts someone else's donation — no restrictToDonationOwner here,
// since the volunteer is deliberately not the donor. loadDonation still runs
// first for a fast 404 if the id doesn't exist at all; the real concurrency
// guard is the row lock inside donationService.acceptDonation.
router.patch(
  '/:id/accept',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  acceptDonationValidationRules,
  validateRequest,
  loadDonation,
  acceptDonation
);

// The assigned volunteer schedules pickup. No restrictToDonationOwner here
// either — that middleware checks donor_id, but this route's ownership
// check is against volunteer_id, which is a different rule handled inside
// donationService.schedulePickup (403 if not the assigned volunteer).
router.patch(
  '/:id/schedule',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  schedulePickupValidationRules,
  validateRequest,
  loadDonation,
  schedulePickup
);

// (Module 9) The assigned volunteer marks a scheduled donation as on the way.
// Same reasoning as /schedule: ownership is against volunteer_id, checked
// inside donationService.markOnTheWay, not via restrictToDonationOwner.
router.patch(
  '/:id/on-the-way',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  onTheWayValidationRules,
  validateRequest,
  loadDonation,
  markOnTheWay
);

// (Module 9) The assigned volunteer marks an on-the-way donation as picked up.
router.patch(
  '/:id/picked-up',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  pickedUpValidationRules,
  validateRequest,
  loadDonation,
  markPickedUp
);

// (Module 9 — BEHAVIOR CHANGE) The DONOR marks a picked-up donation as
// completed. Previously this was authorize(VOLUNTEER) with no
// restrictToDonationOwner — now it's the donor's confirmation step, so
// restrictToDonationOwner (donor_id check) applies here just like
// update/cancel. donationService.completeDonation still re-verifies
// ownership + status against the freshly locked row inside its transaction,
// since this middleware's read could be stale by the time it runs.
router.patch(
  '/:id/complete',
  protect,
  authorize(USER_ROLES.DONOR),
  completeDonationValidationRules,
  validateRequest,
  loadDonation,
  restrictToDonationOwner,
  completeDonation
);

// --- Team donation assignment routes (team leader only) ---

// Accept a donation on behalf of a team
router.post(
  '/:id/accept-team',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  acceptDonationValidationRules,
  validateRequest,
  loadDonation,
  acceptDonationForTeam
);

// Assign a team member to a team-assigned donation
router.post(
  '/:id/assign-member',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  loadDonation,
  assignTeamMember
);

// Get donations assigned to a team
router.get(
  '/team/:teamId',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  getTeamDonations
);

// Get all team assignments with details
router.get(
  '/team/:teamId/assignments',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  getTeamAssignments
);

// --- Team member assignment routes ---

// Get donations assigned to the current team member
router.get(
  '/my-assignments',
  protect,
  authorize(USER_ROLES.VOLUNTEER),
  getMyAssignments
);

module.exports = router;
