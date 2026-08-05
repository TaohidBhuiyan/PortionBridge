const { HTTP_STATUS } = require('../constants');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const achievementService = require('../services/achievement.service');

/**
 * GET /api/v1/achievements
 * Get current user's achievements
 */
const getUserAchievements = asyncHandler(async (req, res) => {
  const { achievements, summary } = await achievementService.getUserAchievements(req.user.id);

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Achievements retrieved successfully.',
    data: { achievements, summary },
  });
});

/**
 * GET /api/v1/achievements/definitions
 * Get all available achievement definitions
 */
const getAchievementDefinitions = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const definitions = await achievementService.getAchievementDefinitions({ role });

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Achievement definitions retrieved successfully.',
    data: { definitions },
  });
});

/**
 * POST /api/v1/achievements/check
 * Check and unlock achievements for current user
 * This is typically called internally after milestone events
 */
const checkAchievements = asyncHandler(async (req, res) => {
  const newlyUnlocked = await achievementService.checkAndUnlockAchievements(
    req.user.id,
    req.user.role
  );

  return success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Achievements checked successfully.',
    data: { newlyUnlocked, count: newlyUnlocked.length },
  });
});

module.exports = {
  getUserAchievements,
  getAchievementDefinitions,
  checkAchievements,
};
