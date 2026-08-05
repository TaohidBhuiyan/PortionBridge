const { pool } = require('../config/db');

/**
 * Raw SQL data-access layer for location-based volunteer discovery.
 * Provides functions to find nearby volunteers and teams using distance calculation.
 */

/**
 * Calculates distance between two coordinates using Haversine formula.
 * This is used in SQL queries for distance-based filtering.
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Finds nearby volunteers based on donor's location.
 * @param {Object} options - Query options
 * @param {number} options.latitude - Donor's latitude
 * @param {number} options.longitude - Donor's longitude
 * @param {number} options.radius - Search radius in kilometers (default: 10)
 * @param {boolean} options.availableOnly - Filter only available volunteers (default: true)
 * @param {boolean} options.onlineOnly - Filter only online volunteers (default: false)
 * @param {string} options.specialty - Filter by specialty (food/clothes)
 * @param {string} options.search - Search by name or team
 * @param {string} options.sortBy - Sort by distance/rating (default: distance)
 * @param {string} options.sortOrder - Sort direction asc/desc (default: asc)
 * @param {number} options.limit - Result limit
 * @param {number} options.offset - Result offset
 * @returns {Promise<Array>} Array of nearby volunteers with distance
 */
async function findNearbyVolunteers({ 
  latitude, 
  longitude, 
  radius = 10, 
  availableOnly = true, 
  onlineOnly = false,
  specialty = null,
  search = null,
  sortBy = 'distance',
  sortOrder = 'asc',
  limit,
  offset 
}) {
  const conditions = [
    'u.is_deleted = 0',
    'u.is_banned = 0',
    'u.role = :volunteerRole',
    'vp.latitude IS NOT NULL',
    'vp.longitude IS NOT NULL',
  ];
  
  const params = { 
    volunteerRole: 'volunteer',
    lat: latitude,
    lng: longitude,
    radius,
  };

  if (availableOnly) {
    conditions.push('vp.availability IS NOT NULL');
  }

  if (onlineOnly) {
    conditions.push('vp.is_online = 1');
  }

  if (specialty) {
    conditions.push('JSON_CONTAINS(vp.skills, :specialty)');
    params.specialty = JSON.stringify([specialty]);
  }

  if (search) {
    conditions.push('(u.name LIKE :search OR t.name LIKE :search)');
    params.search = `%${search}%`;
  }

  const whereClause = conditions.join(' AND ');

  // Haversine formula for distance calculation in SQL
  const distanceFormula = `
    (6371 * ACOS(
      COS(RADIANS(:lat)) * COS(RADIANS(vp.latitude)) *
      COS(RADIANS(vp.longitude) - RADIANS(:lng)) +
      SIN(RADIANS(:lat)) * SIN(RADIANS(vp.latitude))
    ))
  `;

  const orderColumn = sortBy === 'distance' ? 'distance' : 'vp.total_pickups';
  const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

  const [rows] = await pool.query(
    `SELECT 
      u.id,
      u.name,
      u.email,
      u.phone,
      u.profile_photo,
      u.profile_picture,
      vp.vehicle_type,
      vp.availability,
      vp.skills,
      vp.service_area,
      vp.coverage_radius,
      vp.is_online,
      vp.total_pickups,
      ${distanceFormula} AS distance,
      t.id AS team_id,
      t.name AS team_name,
      tm.role AS team_role
    FROM users u
    INNER JOIN volunteer_profiles vp ON u.id = vp.user_id
    LEFT JOIN team_members tm ON u.id = tm.user_id
    LEFT JOIN teams t ON tm.team_id = t.id
    WHERE ${whereClause}
    HAVING distance <= :radius
    ORDER BY ${orderColumn} ${orderDirection}
    LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );

  // Parse JSON fields
  return rows.map(row => {
    if (row.availability) row.availability = JSON.parse(row.availability);
    if (row.skills) row.skills = JSON.parse(row.skills);
    if (row.service_area) row.service_area = JSON.parse(row.service_area);
    row.distance = Number(row.distance).toFixed(2);
    return row;
  });
}

/**
 * Counts nearby volunteers matching the same filters as findNearbyVolunteers.
 * @param {Object} filters - Filter options (same as findNearbyVolunteers)
 * @returns {Promise<number>} Total count of matching volunteers
 */
async function countNearbyVolunteers({ 
  latitude, 
  longitude, 
  radius = 10, 
  availableOnly = true, 
  onlineOnly = false,
  specialty = null,
  search = null 
}) {
  const conditions = [
    'u.is_deleted = 0',
    'u.is_banned = 0',
    'u.role = :volunteerRole',
    'vp.latitude IS NOT NULL',
    'vp.longitude IS NOT NULL',
  ];
  
  const params = { 
    volunteerRole: 'volunteer',
    lat: latitude,
    lng: longitude,
    radius,
  };

  if (availableOnly) {
    conditions.push('vp.availability IS NOT NULL');
  }

  if (onlineOnly) {
    conditions.push('vp.is_online = 1');
  }

  if (specialty) {
    conditions.push('JSON_CONTAINS(vp.skills, :specialty)');
    params.specialty = JSON.stringify([specialty]);
  }

  if (search) {
    conditions.push('(u.name LIKE :search OR t.name LIKE :search)');
    params.search = `%${search}%`;
  }

  const whereClause = conditions.join(' AND ');

  const distanceFormula = `
    (6371 * ACOS(
      COS(RADIANS(:lat)) * COS(RADIANS(vp.latitude)) *
      COS(RADIANS(vp.longitude) - RADIANS(:lng)) +
      SIN(RADIANS(:lat)) * SIN(RADIANS(vp.latitude))
    ))
  `;

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
    FROM users u
    INNER JOIN volunteer_profiles vp ON u.id = vp.user_id
    LEFT JOIN team_members tm ON u.id = tm.user_id
    LEFT JOIN teams t ON tm.team_id = t.id
    WHERE ${whereClause}
    HAVING distance <= :radius`,
    params
  );

  return rows[0].total;
}

/**
 * Finds nearby teams based on donor's location.
 * @param {Object} options - Query options
 * @param {number} options.latitude - Donor's latitude
 * @param {number} options.longitude - Donor's longitude
 * @param {number} options.radius - Search radius in kilometers (default: 15)
 * @param {string} options.search - Search by team name
 * @param {number} options.limit - Result limit
 * @param {number} options.offset - Result offset
 * @returns {Promise<Array>} Array of nearby teams with distance and member count
 */
async function findNearbyTeams({ 
  latitude, 
  longitude, 
  radius = 15, 
  search = null,
  limit,
  offset 
}) {
  const conditions = [
    't.latitude IS NOT NULL',
    't.longitude IS NOT NULL',
  ];
  
  const params = { 
    lat: latitude,
    lng: longitude,
    radius,
  };

  if (search) {
    conditions.push('t.name LIKE :search');
    params.search = `%${search}%`;
  }

  const whereClause = conditions.join(' AND ');

  const distanceFormula = `
    (6371 * ACOS(
      COS(RADIANS(:lat)) * COS(RADIANS(t.latitude)) *
      COS(RADIANS(t.longitude) - RADIANS(:lng)) +
      SIN(RADIANS(:lat)) * SIN(RADIANS(t.latitude))
    ))
  `;

  const [rows] = await pool.query(
    `SELECT 
      t.id,
      t.name,
      t.description,
      t.coverage_radius,
      ${distanceFormula} AS distance,
      COUNT(DISTINCT tm.user_id) AS member_count,
      u.name AS leader_name,
      u.profile_photo AS leader_photo
    FROM teams t
    INNER JOIN team_members tm ON t.id = tm.team_id
    INNER JOIN users u ON t.leader_id = u.id
    WHERE ${whereClause}
    HAVING distance <= :radius
    GROUP BY t.id
    ORDER BY distance ASC
    LIMIT :limit OFFSET :offset`,
    { ...params, limit, offset }
  );

  return rows.map(row => {
    row.distance = Number(row.distance).toFixed(2);
    return row;
  });
}

/**
 * Counts nearby teams matching the same filters as findNearbyTeams.
 * @param {Object} filters - Filter options (same as findNearbyTeams)
 * @returns {Promise<number>} Total count of matching teams
 */
async function countNearbyTeams({ 
  latitude, 
  longitude, 
  radius = 15, 
  search = null 
}) {
  const conditions = [
    't.latitude IS NOT NULL',
    't.longitude IS NOT NULL',
  ];
  
  const params = { 
    lat: latitude,
    lng: longitude,
    radius,
  };

  if (search) {
    conditions.push('t.name LIKE :search');
    params.search = `%${search}%`;
  }

  const whereClause = conditions.join(' AND ');

  const distanceFormula = `
    (6371 * ACOS(
      COS(RADIANS(:lat)) * COS(RADIANS(t.latitude)) *
      COS(RADIANS(t.longitude) - RADIANS(:lng)) +
      SIN(RADIANS(:lat)) * SIN(RADIANS(t.latitude))
    ))
  `;

  const [rows] = await pool.query(
    `SELECT COUNT(DISTINCT t.id) AS total
    FROM teams t
    INNER JOIN team_members tm ON t.id = tm.team_id
    WHERE ${whereClause}
    HAVING distance <= :radius`,
    params
  );

  return rows[0].total;
}

/**
 * Updates volunteer's current location.
 * @param {number} userId - User ID
 * @param {Object} location - Location data
 * @param {number} location.latitude - Latitude
 * @param {number} location.longitude - Longitude
 * @param {boolean} location.isOnline - Online status
 * @returns {Promise<void>}
 */
async function updateVolunteerLocation(userId, { latitude, longitude, isOnline }) {
  await pool.query(
    `UPDATE volunteer_profiles 
     SET latitude = :latitude, 
         longitude = :longitude, 
         is_online = :isOnline,
         last_location_update = NOW()
     WHERE user_id = :userId`,
    { userId, latitude, longitude, isOnline: isOnline ? 1 : 0 }
  );
}

/**
 * Updates team's base location.
 * @param {number} teamId - Team ID
 * @param {Object} location - Location data
 * @param {number} location.latitude - Latitude
 * @param {number} location.longitude - Longitude
 * @param {number} location.coverageRadius - Coverage radius in km
 * @returns {Promise<void>}
 */
async function updateTeamLocation(teamId, { latitude, longitude, coverageRadius }) {
  await pool.query(
    `UPDATE teams 
     SET latitude = :latitude, 
         longitude = :longitude, 
         coverage_radius = :coverageRadius
     WHERE id = :teamId`,
    { teamId, latitude, longitude, coverageRadius }
  );
}

module.exports = {
  findNearbyVolunteers,
  countNearbyVolunteers,
  findNearbyTeams,
  countNearbyTeams,
  updateVolunteerLocation,
  updateTeamLocation,
  calculateDistance,
};
