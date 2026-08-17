/**
 * Shared helpers for integration tests.
 *
 * These tests exercise the real service/model layer against a real MySQL
 * database — see tests/README.md for how to point them at a test database.
 * If no database is reachable, `requireDb()` throws a clearly-labeled
 * error that individual test files catch to skip gracefully, so `npm test`
 * doesn't hard-fail in an environment with no DB configured (only the
 * DB-independent unit tests will run).
 */
require('dotenv').config();
const { pool } = require('../../config/db');

let dbChecked = false;
let dbAvailable = false;

async function isDbAvailable() {
  if (dbChecked) return dbAvailable;
  try {
    await pool.query('SELECT 1');
    dbAvailable = true;
  } catch (err) {
    dbAvailable = false;
  }
  dbChecked = true;
  return dbAvailable;
}

let userCounter = 0;
function uniqueEmail(prefix = 'test') {
  userCounter += 1;
  return `${prefix}_${Date.now()}_${userCounter}@example.test`;
}

const TEST_PASSWORD = 'StrongPass123!';

/**
 * Registers + verifies + logs in a user via the real service layer
 * (not raw SQL), returning { user, accessToken }.
 */
async function createVerifiedUser({ role = 'donor', name = 'Test User' } = {}) {
  const authService = require('../../services/auth.service');
  const email = uniqueEmail(role);

  const registerResult = await authService.register({
    name,
    email,
    password: TEST_PASSWORD,
    role,
  });

  // In non-production, register() returns a dev verification token so
  // tests don't need a real mailbox — mirrors how the API itself exposes
  // it for local development (see services/email.service.js).
  await authService.verifyEmail(registerResult.devVerificationToken);

  const loginResult = await authService.login({
    email,
    password: TEST_PASSWORD,
    ipAddress: '127.0.0.1',
    userAgent: 'node-test',
  });

  return { user: loginResult.user, accessToken: loginResult.accessToken, refreshToken: loginResult.rawRefreshToken, email };
}

/**
 * Deletes everything the tests created, in FK-safe order. Scoped to rows
 * created by test users (identified by the '@example.test' email suffix)
 * so this never touches real data even if pointed at a shared DB by
 * mistake.
 */
async function cleanupTestData() {
  const testDomain = '%@example.test';
  await pool.query(
    `DELETE dr FROM donation_requests dr
     JOIN users u ON dr.donor_id = u.id
     WHERE u.email LIKE :domain`,
    { domain: testDomain }
  );
  await pool.query(
    `DELETE tm FROM team_members tm
     JOIN users u ON tm.user_id = u.id
     WHERE u.email LIKE :domain`,
    { domain: testDomain }
  );
  await pool.query(
    `DELETE t FROM teams t
     JOIN users u ON t.leader_id = u.id
     WHERE u.email LIKE :domain`,
    { domain: testDomain }
  );
  await pool.query('DELETE FROM users WHERE email LIKE :domain', { domain: testDomain });
}

function validFoodDonationPayload(overrides = {}) {
  return {
    title: 'Test food donation',
    category: 'food',
    foodType: 'cooked',
    foodName: 'Rice and lentils',
    quantity: 10,
    quantityUnit: 'plate',
    pickupDate: '2027-01-01',
    pickupTime: '2027-01-01T10:00:00Z',
    pickupTimeSlot: 'morning',
    contactPhone: '+8801700000000',
    pickupAddress: {
      fullAddress: '123 Test St, Dhaka',
      division: 'Dhaka',
      district: 'Dhaka',
      area: 'Gulshan',
      contactPersonName: 'Test Donor',
      contactPhone: '+8801700000000',
      latitude: 23.8103,
      longitude: 90.4125,
    },
    ...overrides,
  };
}

module.exports = {
  pool,
  isDbAvailable,
  uniqueEmail,
  createVerifiedUser,
  cleanupTestData,
  validFoodDonationPayload,
  TEST_PASSWORD,
};
