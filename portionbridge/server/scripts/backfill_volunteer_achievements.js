/**
 * backfill_volunteer_achievements.js
 * 
 * One-time script: retroactively check & unlock achievements for ALL volunteers
 * who have completed pickups but never had their achievements evaluated.
 * 
 * Run: node server/scripts/backfill_volunteer_achievements.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { pool } = require('../config/db');
const achievementService = require('../services/achievement.service');

async function main() {
  console.log('🏅 Backfilling volunteer achievements...\n');

  // Get all volunteers who have at least 1 completed pickup
  const [volunteers] = await pool.query(`
    SELECT DISTINCT volunteer_id AS id
    FROM donation_requests
    WHERE volunteer_id IS NOT NULL
      AND status = 'completed'
      AND is_deleted = 0
    ORDER BY volunteer_id
  `);

  console.log(`Found ${volunteers.length} volunteer(s) with completed pickups.\n`);

  let totalUnlocked = 0;

  for (const { id } of volunteers) {
    try {
      const newlyUnlocked = await achievementService.checkAndUnlockAchievements(id, 'volunteer');
      if (newlyUnlocked.length > 0) {
        console.log(`✅ Volunteer #${id}: unlocked ${newlyUnlocked.length} achievement(s) — ${newlyUnlocked.map(a => a.name).join(', ')}`);
        totalUnlocked += newlyUnlocked.length;
      } else {
        console.log(`   Volunteer #${id}: no new achievements`);
      }
    } catch (err) {
      console.error(`❌ Volunteer #${id}: error — ${err.message}`);
    }
  }

  console.log(`\n🎉 Done! ${totalUnlocked} achievement(s) unlocked across ${volunteers.length} volunteer(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
