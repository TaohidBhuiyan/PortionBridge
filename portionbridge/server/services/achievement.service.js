const { pool } = require('../config/db');
const { HTTP_STATUS } = require('../constants');
const AppError = require('../utils/AppError');
const achievementModel = require('../models/achievement.model');
const donationModel = require('../models/donation.model');

/**
 * Gets all achievements for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Object with achievements array and summary
 */
async function getUserAchievements(userId) {
  const [achievements, totalPoints, totalCount] = await Promise.all([
    achievementModel.findByUserId(userId),
    achievementModel.getUserPoints(userId),
    achievementModel.getUserCount(userId),
  ]);

  return {
    achievements,
    summary: {
      totalPoints,
      totalCount,
    },
  };
}

/**
 * Gets all available achievement definitions
 * @param {Object} options
 * @param {string} [options.role] - Filter by role
 * @returns {Promise<Array>} Array of achievement definitions
 */
async function getAchievementDefinitions({ role } = {}) {
  return achievementModel.getDefinitions({ role });
}

/**
 * Checks and unlocks achievements for a user based on their stats
 * This should be called after donation completion or other milestone events
 * @param {number} userId - User ID
 * @param {string} userRole - User role (donor or volunteer)
 * @returns {Promise<Array>} Array of newly unlocked achievements
 */
async function checkAndUnlockAchievements(userId, userRole) {
  // Get user's stats
  const userStats = await getUserStats(userId, userRole);
  
  // Get relevant achievement definitions
  const definitions = await achievementModel.getDefinitions({ 
    role: userRole === 'donor' ? 'donor' : 'volunteer' 
  });

  const newlyUnlocked = [];

  for (const def of definitions) {
    // Check if already unlocked
    const existing = await achievementModel.findByUserAndType(userId, def.type);
    if (existing) continue;

    // Check if criteria is met
    if (isCriteriaMet(userStats, def)) {
      await achievementModel.create({
        userId,
        achievementType: def.type,
        achievementName: def.name,
        description: def.description,
        icon: def.icon,
      });
      newlyUnlocked.push(def);
    }
  }

  return newlyUnlocked;
}

/**
 * Gets user statistics for achievement checking
 * @param {number} userId - User ID
 * @param {string} userRole - User role
 * @returns {Promise<Object>} User stats
 */
async function getUserStats(userId, userRole) {
  if (userRole === 'donor') {
    const [rows] = await pool.query(
      `SELECT 
        COUNT(*) as total_donations,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'completed' THEN quantity ELSE 0 END) as total_quantity
       FROM donation_requests
       WHERE donor_id = :userId AND is_deleted = 0`,
      { userId }
    );
    return rows[0] || { total_donations: 0, completed_count: 0, total_quantity: 0 };
  } else {
    const [rows] = await pool.query(
      `SELECT 
        COUNT(*) as total_pickups,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count
       FROM donation_requests
       WHERE volunteer_id = :userId AND is_deleted = 0`,
      { userId }
    );
    
    // Get average rating
    const [ratingRows] = await pool.query(
      `SELECT ROUND(AVG(stars), 2) as average_rating, COUNT(*) as rating_count
       FROM ratings
       WHERE rated_user = :userId`,
      { userId }
    );

    return {
      ...rows[0],
      average_rating: ratingRows[0]?.average_rating || 0,
      rating_count: ratingRows[0]?.rating_count || 0,
    };
  }
}

/**
 * Checks if achievement criteria is met
 * @param {Object} userStats - User statistics
 * @param {Object} definition - Achievement definition
 * @returns {boolean} Whether criteria is met
 */
function isCriteriaMet(userStats, definition) {
  switch (definition.criteria_type) {
    case 'donations_count':
      return userStats.completed_count >= definition.criteria_value;
    case 'pickups_count':
      return userStats.completed_count >= definition.criteria_value;
    case 'rating_avg':
      return userStats.average_rating >= 5.0 && userStats.rating_count >= definition.criteria_value;
    case 'streak':
      // Placeholder for streak calculation
      return false;
    default:
      return false;
  }
}

module.exports = {
  getUserAchievements,
  getAchievementDefinitions,
  checkAndUnlockAchievements,
};
