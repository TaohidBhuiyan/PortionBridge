const { HTTP_STATUS } = require('../constants');
const AppError = require('../utils/AppError');
const volunteerDiscoveryModel = require('../models/volunteerDiscovery.model');
const volunteerProfileModel = require('../models/volunteerProfile.model');
const teamModel = require('../models/team.model');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');

/**
 * Finds nearby volunteers based on donor's location.
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Object containing volunteers array and pagination meta
 */
async function findNearbyVolunteers(query) {
  const { page, limit, offset } = getPaginationParams(query);
  const { 
    latitude, 
    longitude, 
    radius, 
    availableOnly, 
    onlineOnly,
    specialty,
    search,
    sortBy,
    sortOrder
  } = query;

  // Validate coordinates
  if (!latitude || !longitude) {
    throw new AppError('Latitude and longitude are required.', HTTP_STATUS.BAD_REQUEST);
  }

  if (latitude < -90 || latitude > 90) {
    throw new AppError('Invalid latitude. Must be between -90 and 90.', HTTP_STATUS.BAD_REQUEST);
  }

  if (longitude < -180 || longitude > 180) {
    throw new AppError('Invalid longitude. Must be between -180 and 180.', HTTP_STATUS.BAD_REQUEST);
  }

  const filters = {
    latitude: Number(latitude),
    longitude: Number(longitude),
    radius: radius ? Number(radius) : 10,
    availableOnly: availableOnly !== 'false',
    onlineOnly: onlineOnly === 'true',
    specialty: specialty || null,
    search: search || null,
    sortBy: sortBy || 'distance',
    sortOrder: sortOrder || 'asc',
  };

  const [volunteers, totalItems] = await Promise.all([
    volunteerDiscoveryModel.findNearbyVolunteers({ ...filters, limit, offset }),
    volunteerDiscoveryModel.countNearbyVolunteers(filters),
  ]);

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { volunteers, meta };
}

/**
 * Finds nearby teams based on donor's location.
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Object containing teams array and pagination meta
 */
async function findNearbyTeams(query) {
  const { page, limit, offset } = getPaginationParams(query);
  const { latitude, longitude, radius, search } = query;

  // Validate coordinates
  if (!latitude || !longitude) {
    throw new AppError('Latitude and longitude are required.', HTTP_STATUS.BAD_REQUEST);
  }

  if (latitude < -90 || latitude > 90) {
    throw new AppError('Invalid latitude. Must be between -90 and 90.', HTTP_STATUS.BAD_REQUEST);
  }

  if (longitude < -180 || longitude > 180) {
    throw new AppError('Invalid longitude. Must be between -180 and 180.', HTTP_STATUS.BAD_REQUEST);
  }

  const filters = {
    latitude: Number(latitude),
    longitude: Number(longitude),
    radius: radius ? Number(radius) : 15,
    search: search || null,
  };

  const [teams, totalItems] = await Promise.all([
    volunteerDiscoveryModel.findNearbyTeams({ ...filters, limit, offset }),
    volunteerDiscoveryModel.countNearbyTeams(filters),
  ]);

  const meta = buildPaginationMeta({ page, limit, totalItems });
  return { teams, meta };
}

/**
 * Updates volunteer's current location.
 * @param {number} userId - User ID
 * @param {Object} data - Location data
 * @returns {Promise<void>}
 */
async function updateVolunteerLocation(userId, data) {
  const { latitude, longitude, isOnline } = data;

  // Validate coordinates
  if (!latitude || !longitude) {
    throw new AppError('Latitude and longitude are required.', HTTP_STATUS.BAD_REQUEST);
  }

  if (latitude < -90 || latitude > 90) {
    throw new AppError('Invalid latitude. Must be between -90 and 90.', HTTP_STATUS.BAD_REQUEST);
  }

  if (longitude < -180 || longitude > 180) {
    throw new AppError('Invalid longitude. Must be between -180 and 180.', HTTP_STATUS.BAD_REQUEST);
  }

  // Check if volunteer profile exists
  const profile = await volunteerProfileModel.findByUserId(userId);
  if (!profile) {
    throw new AppError('Volunteer profile not found.', HTTP_STATUS.NOT_FOUND);
  }

  await volunteerDiscoveryModel.updateVolunteerLocation(userId, {
    latitude: Number(latitude),
    longitude: Number(longitude),
    isOnline: isOnline !== undefined ? isOnline : true,
  });
}

/**
 * Updates team's base location.
 * @param {number} teamId - Team ID
 * @param {number} userId - User ID of the requester (team leader)
 * @param {Object} data - Location data
 * @returns {Promise<void>}
 */
async function updateTeamLocation(teamId, userId, data) {
  const { latitude, longitude, coverageRadius } = data;

  // Validate coordinates
  if (!latitude || !longitude) {
    throw new AppError('Latitude and longitude are required.', HTTP_STATUS.BAD_REQUEST);
  }

  if (latitude < -90 || latitude > 90) {
    throw new AppError('Invalid latitude. Must be between -90 and 90.', HTTP_STATUS.BAD_REQUEST);
  }

  if (longitude < -180 || longitude > 180) {
    throw new AppError('Invalid longitude. Must be between -180 and 180.', HTTP_STATUS.BAD_REQUEST);
  }

  // Check if team exists and user is leader
  const team = await teamModel.findById(teamId);
  if (!team) {
    throw new AppError('Team not found.', HTTP_STATUS.NOT_FOUND);
  }

  if (team.leader_id !== userId) {
    throw new AppError('Only team leader can update team location.', HTTP_STATUS.FORBIDDEN);
  }

  await volunteerDiscoveryModel.updateTeamLocation(teamId, {
    latitude: Number(latitude),
    longitude: Number(longitude),
    coverageRadius: coverageRadius ? Number(coverageRadius) : 10,
  });
}

/**
 * Gets volunteer statistics for discovery (active pickups, completed pickups).
 * @param {number} volunteerId - Volunteer ID
 * @returns {Promise<Object>} Volunteer statistics
 */
async function getVolunteerStats(volunteerId) {
  const profile = await volunteerProfileModel.findByUserId(volunteerId);
  if (!profile) {
    throw new AppError('Volunteer profile not found.', HTTP_STATUS.NOT_FOUND);
  }

  // Get active and completed pickup counts from donation model
  const donationModel = require('../models/donation.model');
  const summary = await donationModel.getVolunteerSummary(volunteerId);

  return {
    totalPickups: profile.total_pickups || 0,
    activePickups: Number(summary.accepted) + Number(summary.scheduled),
    completedPickups: Number(summary.completed),
    rating: profile.rating || null,
    isOnline: profile.is_online || false,
    lastLocationUpdate: profile.last_location_update || null,
  };
}

module.exports = {
  findNearbyVolunteers,
  findNearbyTeams,
  updateVolunteerLocation,
  updateTeamLocation,
  getVolunteerStats,
};
