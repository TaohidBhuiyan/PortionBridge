const { socketSuccess, socketError } = require('../utils/socketResponse');
const { pool } = require('../../config/db');

/**
 * Registers public landing page event handlers.
 * This namespace does NOT require authentication - it's for public landing page
 * real-time updates (activity feed, statistics, leaderboard).
 * @param {Object} io - Shared Socket.io server instance
 * @param {Object} socket - The socket (no authentication required for public namespace)
 */
function registerPublicHandlers(io, socket) {
  /**
   * get_current_stats - Fetch current statistics for landing page
   */
  socket.on('get_current_stats', async (_payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    try {
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

      // Get active zones
      const [zonesResult] = await pool.query(
        `SELECT COUNT(DISTINCT id) as count 
         FROM teams`
      );
      const activeZones = zonesResult[0].count || 0;

      ack(socketSuccess('Statistics retrieved.', {
        mealsDelivered,
        clothesDonated,
        verifiedVolunteers,
        activeZones,
      }));
    } catch (err) {
      console.error('[Public Socket] Error fetching stats:', err);
      ack(socketError('Failed to fetch statistics', 500));
    }
  });

  /**
   * get_activity_feed - Fetch recent activity for landing page ticker
   */
  socket.on('get_activity_feed', async (_payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    try {
      const [activities] = await pool.query(
        `SELECT 
           al.action_type,
           al.description,
           al.created_at,
           u.name as user_name,
           u.profile_photo
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         WHERE al.action_type IN ('donation_created', 'donation_completed', 'pickup_completed', 'volunteer_registered')
         ORDER BY al.created_at DESC
         LIMIT 20`
      );

      const formattedActivities = activities.map(a => ({
        type: a.action_type,
        text: a.description,
        userName: a.user_name || 'System',
        userPhoto: a.profile_photo,
        timestamp: a.created_at,
      }));

      ack(socketSuccess('Activity feed retrieved.', { activities: formattedActivities }));
    } catch (err) {
      console.error('[Public Socket] Error fetching activity feed:', err);
      ack(socketError('Failed to fetch activity feed', 500));
    }
  });

  /**
   * get_leaderboard - Fetch current leaderboard data
   */
  socket.on('get_leaderboard', async (_payload, callback) => {
    const ack = typeof callback === 'function' ? callback : () => {};

    try {
      // Get donors
      const [donors] = await pool.query(
        `SELECT user_id, donor_name as name, profile_photo, 
                total_donations as donations, completed_count, 
                total_quantity_donated as items, average_rating
         FROM top_donors
         ORDER BY completed_count DESC
         LIMIT 10`
      );

      // Get volunteers
      const [volunteers] = await pool.query(
        `SELECT user_id, volunteer_name as name, profile_photo, 
                total_pickups as pickups, completed_count, average_rating
         FROM top_volunteers
         ORDER BY completed_count DESC
         LIMIT 10`
      );

      const donorsWithKind = donors.map(d => ({
        ...d,
        area: 'Various areas',
        kind: 'Mixed donations',
      }));

      const volunteersWithKind = volunteers.map(v => ({
        ...v,
        area: 'Various zones',
        kind: 'Mixed pickups',
      }));

      ack(socketSuccess('Leaderboard retrieved.', {
        donors: donorsWithKind,
        volunteers: volunteersWithKind,
      }));
    } catch (err) {
      console.error('[Public Socket] Error fetching leaderboard:', err);
      ack(socketError('Failed to fetch leaderboard', 500));
    }
  });
}

module.exports = { registerPublicHandlers };
