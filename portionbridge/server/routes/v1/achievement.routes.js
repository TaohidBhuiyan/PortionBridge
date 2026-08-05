const express = require('express');
const router = express.Router();

const {
  getUserAchievements,
  getAchievementDefinitions,
  checkAchievements,
} = require('../../controllers/achievement.controller');
const { protect } = require('../../middleware/auth.middleware');

// All achievement routes require authentication
router.get('/', protect, getUserAchievements);
router.get('/definitions', protect, getAchievementDefinitions);
router.post('/check', protect, checkAchievements);

module.exports = router;
