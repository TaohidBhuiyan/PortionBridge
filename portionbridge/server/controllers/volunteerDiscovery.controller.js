const { HTTP_STATUS } = require('../constants');
const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const volunteerDiscoveryService = require('../services/volunteerDiscovery.service');
const volunteerDiscoveryModel = require('../models/volunteerDiscovery.model');
const donationModel = require('../models/donation.model');

/**
 * GET /api/v1/volunteer-discovery/nearby
 * Find nearby volunteers based on location
 */
const getNearbyVolunteers = asyncHandler(async (req, res) => {
  const { volunteers, meta } = await volunteerDiscoveryService.findNearbyVolunteers(req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Nearby volunteers retrieved successfully.',
    data: { volunteers },
    meta,
  });
});

/**
 * GET /api/v1/volunteer-discovery/nearby-teams
 * Find nearby teams based on location
 */
const getNearbyTeams = asyncHandler(async (req, res) => {
  const { teams, meta } = await volunteerDiscoveryService.findNearbyTeams(req.query);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Nearby teams retrieved successfully.',
    data: { teams },
    meta,
  });
});

/**
 * PUT /api/v1/volunteer-discovery/my-location
 * Update current volunteer's location (volunteer only)
 */
const updateMyLocation = asyncHandler(async (req, res) => {
  await volunteerDiscoveryService.updateVolunteerLocation(req.user.id, req.body);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Location updated successfully.',
  });
});

/**
 * PUT /api/v1/volunteer-discovery/teams/:id/location
 * Update team's base location (team leader only)
 */
const updateTeamLocation = asyncHandler(async (req, res) => {
  await volunteerDiscoveryService.updateTeamLocation(req.params.id, req.user.id, req.body);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Team location updated successfully.',
  });
});

/**
 * GET /api/v1/volunteer-discovery/volunteer/:id/stats
 * Get volunteer statistics for discovery
 */
const getVolunteerStats = asyncHandler(async (req, res) => {
  const stats = await volunteerDiscoveryService.getVolunteerStats(req.params.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Volunteer statistics retrieved successfully.',
    data: { stats },
  });
});

/**
 * GET /api/v1/volunteer-discovery/recommend
 * Smart recommendation for best volunteer based on location and other factors
 */
const getRecommendedVolunteer = asyncHandler(async (req, res) => {
  const { latitude, longitude, pickupTime, category } = req.query;

  if (!latitude || !longitude) {
    return error(res, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Latitude and longitude are required.',
    });
  }

  // Find nearby volunteers
  const volunteers = await volunteerDiscoveryModel.findNearbyVolunteers({
    latitude: Number(latitude),
    longitude: Number(longitude),
    radius: 10,
    availableOnly: true,
    onlineOnly: true,
    limit: 20,
    offset: 0,
  });

  if (volunteers.length === 0) {
    return error(res, {
      statusCode: HTTP_STATUS.NOT_FOUND,
      message: 'No available volunteers found nearby.',
    });
  }

  // Score each volunteer based on multiple factors
  const scoredVolunteers = await Promise.all(volunteers.map(async (volunteer) => {
    let score = 0;
    const reasons = [];

    // Distance factor (40% weight) - closer is better
    const distanceScore = Math.max(0, 100 - volunteer.distance * 10);
    score += distanceScore * 0.4;
    if (volunteer.distance < 2) {
      reasons.push('Very close to your location');
    } else if (volunteer.distance < 5) {
      reasons.push('Close to your location');
    }

    // Online status (20% weight)
    if (volunteer.is_online) {
      score += 20;
      reasons.push('Available now');
    }

    // Workload factor (20% weight) - lower active pickups is better
    const activePickups = volunteer.active_pickups || 0;
    const workloadScore = Math.max(0, 100 - activePickups * 20);
    score += workloadScore * 0.2;
    if (activePickups === 0) {
      reasons.push('No active pickups');
    } else if (activePickups < 3) {
      reasons.push('Low workload');
    }

    // Rating factor (10% weight)
    const rating = volunteer.rating || 0;
    const ratingScore = (rating / 5) * 100;
    score += ratingScore * 0.1;
    if (rating >= 4.5) {
      reasons.push('Highly rated');
    } else if (rating >= 4.0) {
      reasons.push('Good rating');
    }

    // Completed pickups factor (10% weight) - more experience is better
    const completedPickups = volunteer.total_pickups || 0;
    const experienceScore = Math.min(100, completedPickups * 2);
    score += experienceScore * 0.1;
    if (completedPickups >= 20) {
      reasons.push('Experienced volunteer');
    } else if (completedPickups >= 10) {
      reasons.push('Some experience');
    }

    return {
      ...volunteer,
      score: Math.round(score),
      reasons: reasons.slice(0, 3), // Top 3 reasons
    };
  }));

  // Sort by score and get the best one
  scoredVolunteers.sort((a, b) => b.score - a.score);
  const recommended = scoredVolunteers[0];

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Recommended volunteer retrieved successfully.',
    data: {
      volunteer: recommended,
      alternatives: scoredVolunteers.slice(1, 4), // Top 3 alternatives
    },
  });
});

module.exports = {
  getNearbyVolunteers,
  getNearbyTeams,
  updateVolunteerLocation,
  updateTeamLocation,
  getVolunteerStats,
  getRecommendedVolunteer,
};
