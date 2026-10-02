require('dotenv').config();

const { pool } = require('../config/db');
const { USER_ROLES } = require('../constants');
const { hashPassword } = require('../utils/password');
const userModel = require('../models/user.model');
const passwordHistoryModel = require('../models/passwordHistory.model');

/**
 * Demo Users Seed Script
 * Creates donor and volunteer accounts with auto-verification for testing
 */

const DEMO_USERS = [
  {
    name: 'Taohid Donor',
    email: 'tauhidtbm2@gmail.com',
    password: 'Donor1@Taohid',
    role: USER_ROLES.DONOR,
    phone: '01939954398',
    address: 'Kurmitola, Dhaka',
  },
  {
    name: 'Mintu Volunteer',
    email: 'mintumohammad15678@gmail.com',
    password: 'Volunteer1@Taohid',
    role: USER_ROLES.VOLUNTEER,
    phone: '01700000000',
    address: 'Dhaka, Bangladesh',
  },
];

async function seedDemoUsers() {
  console.log('[SeedDemoUsers] Starting demo user creation...');
  
  for (const demoUser of DEMO_USERS) {
    const existing = await userModel.findByEmail(demoUser.email);
    
    if (existing) {
      console.log(`[SeedDemoUsers] ${demoUser.email} already exists (id=${existing.id}, role=${existing.role}); skipping.`);
      continue;
    }
    
    const hashedPassword = await hashPassword(demoUser.password);
    
    const newUserId = await userModel.createUser({
      name: demoUser.name,
      email: demoUser.email,
      hashedPassword,
      role: demoUser.role,
      phone: demoUser.phone,
      address: demoUser.address,
      profilePhotoPath: null,
      provider: null,
      googleId: null,
      profilePicture: null,
      emailVerified: true, // Auto-verify for demo
      phoneVerified: false,
    });
    
    await passwordHistoryModel.addPasswordToHistory(newUserId, hashedPassword);
    
    console.log(`[SeedDemoUsers] Created ${demoUser.role} account (id=${newUserId}): ${demoUser.email}`);
  }
  
  console.log('[SeedDemoUsers] Demo user creation completed.');
}

seedDemoUsers()
  .catch((error) => {
    console.error('[SeedDemoUsers] Failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });