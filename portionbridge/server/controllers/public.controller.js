const { HTTP_STATUS } = require('../constants');
const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const leaderboardModel = require('../models/leaderboard.model');
const ratingModel = require('../models/rating.model');
const donationModel = require('../models/donation.model');
const userModel = require('../models/user.model');
const { pool } = require('../config/db');
const { getPaginationParams, buildPaginationMeta } = require('../utils/helpers');

/**
 * GET /api/v1/public/stats
 * Public statistics for landing page - no authentication required
 */
const getPublicStats = asyncHandler(async (req, res) => {
  // Get meals delivered (food donations completed)
  const [mealsResult] = await pool.query(
    `SELECT COUNT(*) as count 
     FROM donation_requests 
     WHERE category = 'food' AND status = 'completed' AND is_deleted = 0`
  );
  const mealsDelivered = mealsResult[0].count;

  // Get clothes donated (clothes donations completed)
  const [clothesResult] = await pool.query(
    `SELECT COUNT(*) as count 
     FROM donation_requests 
     WHERE category = 'clothes' AND status = 'completed' AND is_deleted = 0`
  );
  const clothesDonated = clothesResult[0].count;

  // Get verified volunteers
  const [volunteersResult] = await pool.query(
    `SELECT COUNT(*) as count 
     FROM users 
     WHERE role = 'volunteer' AND email_verified = 1 AND is_deleted = 0`
  );
  const verifiedVolunteers = volunteersResult[0].count;

  // Get active zones (unique teams or derive from pickup locations)
  const [zonesResult] = await pool.query(
    `SELECT COUNT(DISTINCT id) as count 
     FROM teams`
  );
  const activeZones = zonesResult[0].count || 0;

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Public statistics retrieved successfully.',
    data: {
      mealsDelivered,
      clothesDonated,
      verifiedVolunteers,
      activeZones,
    },
  });
});

/**
 * GET /api/v1/public/leaderboard/donors
 * Public donor leaderboard - no authentication required
 */
const getPublicDonorLeaderboard = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { sortBy, sortOrder } = req.query;

  const [donors] = await pool.query(
    `SELECT user_id, donor_name as name, profile_photo, 
            total_donations as donations, completed_count, 
            total_quantity_donated as items, average_rating
     FROM top_donors
     ORDER BY completed_count DESC
     LIMIT :limit OFFSET :offset`,
    { limit, offset }
  );

  const [totalResult] = await pool.query(
    `SELECT COUNT(*) as total FROM top_donors`
  );
  const totalItems = totalResult[0].total;

  const meta = buildPaginationMeta({ page, limit, totalItems });

  // Add derived fields for landing page compatibility
  const donorsWithKind = donors.map(d => ({
    ...d,
    area: 'Various areas',
    kind: 'Mixed donations',
  }));

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Public donor leaderboard retrieved successfully.',
    data: { donors: donorsWithKind },
    meta,
  });
});

/**
 * GET /api/v1/public/leaderboard/volunteers
 * Public volunteer leaderboard - no authentication required
 */
const getPublicVolunteerLeaderboard = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { sortBy, sortOrder } = req.query;

  const [volunteers] = await pool.query(
    `SELECT user_id, volunteer_name as name, profile_photo, 
            total_pickups as pickups, completed_count, average_rating
     FROM top_volunteers
     ORDER BY completed_count DESC
     LIMIT :limit OFFSET :offset`,
    { limit, offset }
  );

  const [totalResult] = await pool.query(
    `SELECT COUNT(*) as total FROM top_volunteers`
  );
  const totalItems = totalResult[0].total;

  const meta = buildPaginationMeta({ page, limit, totalItems });

  // Add derived fields for landing page compatibility
  const volunteersWithKind = volunteers.map(v => ({
    ...v,
    area: 'Various zones',
    kind: 'Mixed pickups',
  }));

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Public volunteer leaderboard retrieved successfully.',
    data: { volunteers: volunteersWithKind },
    meta,
  });
});

/**
 * GET /api/v1/public/reviews
 * Public reviews with rating summary - no authentication required
 */
const getPublicReviews = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);

  // Get recent reviews with user info
  const [reviews] = await pool.query(
    `SELECT r.id, r.stars as rating, r.comment as text, 
            u.name as rated_user_name, r.created_at
     FROM ratings r
     JOIN users u ON r.rated_user = u.id
     WHERE u.is_deleted = 0
     ORDER BY r.created_at DESC
     LIMIT :limit OFFSET :offset`,
    { limit, offset }
  );

  const [totalResult] = await pool.query(
    `SELECT COUNT(*) as total 
     FROM ratings r
     JOIN users u ON r.rated_user = u.id
     WHERE u.is_deleted = 0`
  );
  const totalItems = totalResult[0].total;

  const meta = buildPaginationMeta({ page, limit, totalItems });

  // Format reviews for landing page.
  // AUDIT ADDITION: now also includes createdAt — r.created_at was already
  // being selected in the query above but dropped here before reaching the
  // response, which meant the Landing Page had no way to show a real date
  // even though the data existed. No new query, no schema change.
  const formattedReviews = reviews.map(r => ({
    name: r.rated_user_name,
    rating: r.rating,
    text: r.text,
    createdAt: r.created_at,
  }));

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Public reviews retrieved successfully.',
    data: { reviews: formattedReviews },
    meta,
  });
});

/**
 * GET /api/v1/public/ratings/summary
 * Rating breakdown summary - no authentication required
 */
const getRatingsSummary = asyncHandler(async (req, res) => {
  // Get total reviews count
  const [totalResult] = await pool.query(
    `SELECT COUNT(*) as total 
     FROM ratings r
     JOIN users u ON r.rated_user = u.id
     WHERE u.is_deleted = 0`
  );
  const totalReviews = totalResult[0].total;

  // Get rating breakdown
  const [breakdownResult] = await pool.query(
    `SELECT stars as star, COUNT(*) as count
     FROM ratings r
     JOIN users u ON r.rated_user = u.id
     WHERE u.is_deleted = 0
     GROUP BY stars
     ORDER BY stars DESC`
  );

  const breakdown = [];
  for (let i = 5; i >= 1; i--) {
    const found = breakdownResult.find(r => r.star === i);
    const count = found ? found.count : 0;
    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    breakdown.push({ star: i, count, percentage });
  }

  // Get average rating
  const [avgResult] = await pool.query(
    `SELECT AVG(stars) as avg_rating
     FROM ratings r
     JOIN users u ON r.rated_user = u.id
     WHERE u.is_deleted = 0`
  );
  const averageRating = avgResult[0].avg_rating ? Math.round(avgResult[0].avg_rating * 10) / 10 : 0;

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Ratings summary retrieved successfully.',
    data: {
      totalReviews,
      averageRating,
      breakdown,
    },
  });
});

/**
 * GET /api/v1/public/activity-feed
 * Public activity feed - no authentication required
 */
const getActivityFeed = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  // Get recent activities from audit logs and donation status changes
  const [activities] = await pool.query(
    `SELECT 
       al.action,
       al.metadata,
       al.created_at,
       u.name as user_name
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     WHERE al.action IN (
       'donation_completed',
       'donation_picked_up',
       'donation_on_the_way',
       'login_success'
     )
     ORDER BY al.created_at DESC
     LIMIT :limit`,
    { limit }
  );

  // Format activities for landing page ticker
  const formattedActivities = activities.map(a => {
    const metadata = a.metadata ? JSON.parse(a.metadata) : {};
    let text = '';
    let icon = 'bolt';

    switch (a.action) {
      case 'donation_completed':
        text = `${a.user_name || 'A donor'} completed a donation`;
        icon = 'check';
        break;
      case 'donation_picked_up':
        text = `${a.user_name || 'A volunteer'} picked up a donation`;
        icon = 'shirt';
        break;
      case 'donation_on_the_way':
        text = `${a.user_name || 'A volunteer'} is on the way`;
        icon = 'pin';
        break;
      case 'login_success':
        text = `${a.user_name || 'A volunteer'} just logged in`;
        icon = 'bolt';
        break;
      default:
        text = 'Activity recorded';
    }

    return {
      text,
      icon,
      timestamp: a.created_at,
    };
  });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Activity feed retrieved successfully.',
    data: { activities: formattedActivities },
  });
});

/**
 * GET /api/v1/public/zones
 * Public zones/teams coverage - no authentication required
 * Generates zone information from existing teams and donation data
 */
const getPublicZones = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPaginationParams(req.query);

  // Get zones (teams) with aggregated statistics
  const [zones] = await pool.query(
    `SELECT 
       t.id,
       t.name as zone_name,
       t.description,
       t.leader_id,
       u.name as leader_name,
       u.profile_photo as leader_photo,
       COUNT(DISTINCT tm.user_id) as volunteer_count,
       COUNT(DISTINCT CASE WHEN dr.id IS NOT NULL THEN dr.id END) as total_donations,
       COUNT(DISTINCT CASE WHEN dr.status = 'pending' THEN dr.id END) as pending_donations,
       COUNT(DISTINCT CASE WHEN dr.status = 'completed' THEN dr.id END) as completed_donations,
       COUNT(DISTINCT CASE WHEN dr.category = 'food' AND dr.status = 'completed' THEN dr.id END) as completed_food,
       COUNT(DISTINCT CASE WHEN dr.category = 'clothes' AND dr.status = 'completed' THEN dr.id END) as completed_clothes,
       COUNT(DISTINCT CASE WHEN dr.status IN ('pending', 'accepted', 'scheduled') THEN dr.id END) as active_requests
     FROM teams t
     LEFT JOIN users u ON t.leader_id = u.id
     LEFT JOIN team_members tm ON t.id = tm.team_id
     LEFT JOIN donation_requests dr ON t.id = dr.team_id AND dr.is_deleted = 0
     GROUP BY t.id, t.name, t.description, t.leader_id, u.name, u.profile_photo
     ORDER BY completed_donations DESC, active_requests DESC
     LIMIT :limit OFFSET :offset`,
    { limit, offset }
  );

  const [totalResult] = await pool.query(
    `SELECT COUNT(DISTINCT id) as total FROM teams`
  );
  const totalItems = totalResult[0].total;

  const meta = buildPaginationMeta({ page, limit, totalItems });

  // Format zones for landing page
  const formattedZones = zones.map(z => ({
    id: z.id,
    name: z.zone_name,
    description: z.description || 'Volunteer team coverage area',
    leader: {
      id: z.leader_id,
      name: z.leader_name || 'Team Leader',
      photo: z.leader_photo,
    },
    volunteerCount: z.volunteer_count,
    stats: {
      completedDonations: z.completed_donations,
      pendingDonations: z.pending_donations,
      totalDonations: z.total_donations,
      completedFood: z.completed_food,
      completedClothes: z.completed_clothes,
      activeRequests: z.active_requests,
    },
    status: z.active_requests > 0 ? 'active' : 'idle',
  }));

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Public zones retrieved successfully.',
    data: { zones: formattedZones },
    meta,
  });
});

/**
 * GET /api/v1/public/volunteers/:id
 * Public volunteer profile - no authentication required
 */
const getPublicVolunteerProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get volunteer user info with profile
  const [volunteers] = await pool.query(
    `SELECT 
       u.id,
       u.name,
       u.email,
       u.phone,
       u.profile_photo,
       u.profile_picture,
       u.email_verified,
       u.created_at,
       vp.bio,
       vp.skills,
       vp.availability,
       vp.service_area,
       vp.vehicle_type,
       vp.total_pickups,
       vp.rating,
       vp.latitude,
       vp.longitude,
       vp.coverage_radius,
       vp.is_online,
       vp.last_location_update
     FROM users u
     INNER JOIN volunteer_profiles vp ON u.id = vp.user_id
     WHERE u.id = :id AND u.role = 'volunteer' AND u.is_deleted = 0
     LIMIT 1`,
    { id }
  );

  if (!volunteers[0]) {
    return error(res, {
      statusCode: HTTP_STATUS.NOT_FOUND,
      message: 'Volunteer not found.',
    });
  }

  const volunteer = volunteers[0];

  // Parse JSON fields
  if (volunteer.skills) volunteer.skills = JSON.parse(volunteer.skills);
  if (volunteer.availability) volunteer.availability = JSON.parse(volunteer.availability);
  if (volunteer.service_area) volunteer.service_area = JSON.parse(volunteer.service_area);

  // Get team information if volunteer belongs to a team
  const [teamData] = await pool.query(
    `SELECT 
       t.id,
       t.name,
       t.description,
       t.leader_id,
       tm.role as team_role,
       COUNT(DISTINCT tm2.user_id) as member_count
     FROM team_members tm
     INNER JOIN teams t ON tm.team_id = t.id
     LEFT JOIN team_members tm2 ON t.id = tm2.team_id
     WHERE tm.user_id = :id
     GROUP BY t.id, t.name, t.description, t.leader_id, tm.role
     LIMIT 1`,
    { id }
  );

  let team = null;
  if (teamData[0]) {
    team = teamData[0];
  }

  // Get volunteer statistics
  const [statsResult] = await pool.query(
    `SELECT 
       COUNT(DISTINCT CASE WHEN dr.status IN ('accepted', 'scheduled') THEN dr.id END) as active_pickups,
       COUNT(DISTINCT CASE WHEN dr.status = 'completed' AND dr.is_deleted = 0 THEN dr.id END) as completed_pickups,
       COUNT(DISTINCT CASE WHEN dr.is_deleted = 1 THEN dr.id END) as cancelled_pickups,
       COUNT(DISTINCT dr.id) as total_assignments
     FROM donation_requests dr
     WHERE dr.volunteer_id = :id`,
    { id }
  );

  const stats = statsResult[0] || { active_pickups: 0, completed_pickups: 0, cancelled_pickups: 0, total_assignments: 0 };

  // Calculate acceptance and cancellation rates
  const acceptanceRate = stats.total_assignments > 0 
    ? ((stats.completed_pickups + stats.active_pickups) / stats.total_assignments) * 100 
    : 0;
  const cancellationRate = stats.total_assignments > 0 
    ? (stats.cancelled_pickups / stats.total_assignments) * 100 
    : 0;

  // Get rating summary
  const [ratingResult] = await pool.query(
    `SELECT 
       COUNT(*) as total_ratings,
       AVG(stars) as average_rating
     FROM ratings r
     WHERE r.rated_user = :id`,
    { id }
  );

  const ratingSummary = ratingResult[0] || { total_ratings: 0, average_rating: 0 };

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Volunteer profile retrieved successfully.',
    data: {
      volunteer: {
        ...volunteer,
        team,
        statistics: {
          ...stats,
          acceptance_rate: parseFloat(acceptanceRate.toFixed(2)),
          cancellation_rate: parseFloat(cancellationRate.toFixed(2)),
        },
        rating_summary: {
          total_ratings: ratingSummary.total_ratings,
          average_rating: ratingSummary.average_rating ? parseFloat(ratingSummary.average_rating.toFixed(2)) : 0,
        },
      },
    },
  });
});

/**
 * GET /api/v1/public/volunteers/:id/reviews
 * Public volunteer reviews - no authentication required
 */
const getVolunteerReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page, limit, offset } = getPaginationParams(req.query);

  // Get reviews for this volunteer
  const [reviews] = await pool.query(
    `SELECT 
       r.id,
       r.stars as rating,
       r.comment,
       r.created_at,
       u.name as reviewer_name,
       u.profile_photo as reviewer_photo,
       dr.title as donation_title,
       dr.category as donation_category
     FROM ratings r
     INNER JOIN users u ON r.rated_by = u.id
     LEFT JOIN donation_requests dr ON r.donation_request_id = dr.id
     WHERE r.rated_user = :id AND u.is_deleted = 0
     ORDER BY r.created_at DESC
     LIMIT :limit OFFSET :offset`,
    { id, limit, offset }
  );

  const [totalResult] = await pool.query(
    `SELECT COUNT(*) as total
     FROM ratings r
     INNER JOIN users u ON r.rated_by = u.id
     WHERE r.rated_user = :id AND u.is_deleted = 0`,
    { id }
  );

  const totalItems = totalResult[0].total;
  const meta = buildPaginationMeta({ page, limit, totalItems });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Volunteer reviews retrieved successfully.',
    data: { reviews },
    meta,
  });
});

/**
 * GET /api/v1/public/zones/:id
 * Public zone details - no authentication required
 */
const getPublicZoneDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get zone details with recent activities
  const [zones] = await pool.query(
    `SELECT 
       t.id,
       t.name as zone_name,
       t.description,
       t.leader_id,
       u.name as leader_name,
       u.profile_photo as leader_photo,
       COUNT(DISTINCT tm.user_id) as volunteer_count,
       COUNT(DISTINCT CASE WHEN dr.id IS NOT NULL THEN dr.id END) as total_donations,
       COUNT(DISTINCT CASE WHEN dr.status = 'pending' THEN dr.id END) as pending_donations,
       COUNT(DISTINCT CASE WHEN dr.status = 'completed' THEN dr.id END) as completed_donations
     FROM teams t
     LEFT JOIN users u ON t.leader_id = u.id
     LEFT JOIN team_members tm ON t.id = tm.team_id
     LEFT JOIN donation_requests dr ON t.id = dr.team_id AND dr.is_deleted = 0
     WHERE t.id = :id
     GROUP BY t.id, t.name, t.description, t.leader_id, u.name, u.profile_photo
     LIMIT 1`,
    { id }
  );

  if (!zones[0]) {
    return error(res, {
      statusCode: HTTP_STATUS.NOT_FOUND,
      message: 'Zone not found.',
    });
  }

  const zone = zones[0];

  // Get recent donations for this zone
  const [recentDonations] = await pool.query(
    `SELECT 
       dr.id,
       dr.title,
       dr.category,
       dr.quantity,
       dr.status,
       dr.created_at,
       u.name as donor_name
     FROM donation_requests dr
     LEFT JOIN users u ON dr.donor_id = u.id
     WHERE dr.team_id = :id AND dr.is_deleted = 0
     ORDER BY dr.created_at DESC
     LIMIT 10`,
    { id }
  );

  // Get team members
  const [members] = await pool.query(
    `SELECT 
       tm.role,
       u.name,
       u.profile_photo
     FROM team_members tm
     JOIN users u ON tm.user_id = u.id
     WHERE tm.team_id = :id
     ORDER BY tm.role DESC, tm.joined_at ASC`,
    { id }
  );

  const formattedZone = {
    id: zone.id,
    name: zone.zone_name,
    description: zone.description || 'Volunteer team coverage area',
    leader: {
      id: zone.leader_id,
      name: zone.leader_name || 'Team Leader',
      photo: zone.leader_photo,
    },
    volunteerCount: zone.volunteer_count,
    stats: {
      completedDonations: zone.completed_donations,
      pendingDonations: zone.pending_donations,
      totalDonations: zone.total_donations,
    },
    recentDonations: recentDonations.map(d => ({
      id: d.id,
      title: d.title,
      category: d.category,
      quantity: d.quantity,
      status: d.status,
      donorName: d.donor_name,
      createdAt: d.created_at,
    })),
    members: members.map(m => ({
      role: m.role,
      name: m.name,
      photo: m.profile_photo,
    })),
  };

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Zone details retrieved successfully.',
    data: { zone: formattedZone },
  });
});

module.exports = {
  getPublicStats,
  getPublicDonorLeaderboard,
  getPublicVolunteerLeaderboard,
  getPublicReviews,
  getRatingsSummary,
  getActivityFeed,
  getPublicZones,
  getPublicZoneDetails,
  getPublicVolunteerProfile,
  getVolunteerReviews,
};
