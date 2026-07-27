const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const donationRoutes = require('./donation.routes');
const volunteerRoutes = require('./volunteer.routes');
const adminRoutes = require('./admin.routes');
const ratingRoutes = require('./rating.routes');
const reportRoutes = require('./report.routes');
const chatRoutes = require('./chat.routes');
const notificationRoutes = require('./notification.routes');
const leaderboardRoutes = require('./leaderboard.routes');
const savedAddressRoutes = require('./savedAddress.routes');
const masterDataRoutes = require('./masterData.routes');
const profileRoutes = require('./profile.routes');
const teamRoutes = require('./team.routes');
const publicRoutes = require('./public.routes');

// Every new route group (chat...) gets mounted here in later phases
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/donations', donationRoutes);
router.use('/volunteer', volunteerRoutes);
router.use('/admin', adminRoutes);
router.use('/ratings', ratingRoutes);
router.use('/reports', reportRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/saved-addresses', savedAddressRoutes);
router.use('/master', masterDataRoutes);
router.use('/profile', profileRoutes);
router.use('/teams', teamRoutes);
router.use('/public', publicRoutes);

module.exports = router;
