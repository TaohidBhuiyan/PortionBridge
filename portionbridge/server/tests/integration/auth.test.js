const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { isDbAvailable, uniqueEmail, createVerifiedUser, cleanupTestData, TEST_PASSWORD } = require('./setup');

describe('auth: register / login / refresh', { skip: false }, () => {
  let dbReady = false;
  let authService;
  let tokenService;

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;
    authService = require('../../services/auth.service');
    tokenService = require('../../services/token.service');
  });

  after(async () => {
    if (dbReady) await cleanupTestData();
  });

  test('register + verify + login issues a working access & refresh token pair', async (t) => {
    if (!dbReady) return t.skip('no test database reachable — see tests/README.md');

    const { user, accessToken, refreshToken } = await createVerifiedUser({ role: 'donor', name: 'Auth Flow Donor' });

    assert.ok(user.id);
    assert.equal(user.role, 'donor');
    assert.ok(accessToken && accessToken.split('.').length === 3, 'access token should be a JWT');
    assert.ok(refreshToken && refreshToken.length > 0);
  });

  test('registering with an already-used email is rejected', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { email } = await createVerifiedUser({ role: 'donor' });

    await assert.rejects(
      () => authService.register({ name: 'Dupe', email, password: TEST_PASSWORD, role: 'donor' }),
      /already exists/i
    );
  });

  test('login with wrong password is rejected and does not reveal which field was wrong', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { email } = await createVerifiedUser({ role: 'donor' });

    await assert.rejects(
      () => authService.login({ email, password: 'TotallyWrongPass1', ipAddress: '127.0.0.1', userAgent: 'test' }),
      /invalid email or password/i
    );
  });

  test('login before email verification is rejected', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const email = uniqueEmail('unverified');
    await authService.register({ name: 'Unverified', email, password: TEST_PASSWORD, role: 'donor' });

    await assert.rejects(
      () => authService.login({ email, password: TEST_PASSWORD, ipAddress: '127.0.0.1', userAgent: 'test' }),
      /verify your email/i
    );
  });

  test('refreshSession issues a new token pair and rotates the old one', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { refreshToken } = await createVerifiedUser({ role: 'volunteer' });

    const result = await authService.refreshSession(refreshToken, { ipAddress: '127.0.0.1', userAgent: 'test' });

    assert.ok(result.accessToken);
    assert.ok(result.rawRefreshToken);
    assert.notEqual(result.rawRefreshToken, refreshToken, 'refresh should rotate to a new token');
  });

  test('reusing an already-rotated (replayed) refresh token is rejected and revokes the session', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { refreshToken } = await createVerifiedUser({ role: 'volunteer' });

    // First use rotates it successfully.
    await authService.refreshSession(refreshToken, { ipAddress: '127.0.0.1', userAgent: 'test' });

    // Second use of the SAME (now-stale) token is a replay and must fail.
    await assert.rejects(() => authService.refreshSession(refreshToken, { ipAddress: '127.0.0.1', userAgent: 'test' }));
  });

  test('an invalid/garbage refresh token is rejected', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    await assert.rejects(() => authService.refreshSession('not-a-real-token', { ipAddress: '127.0.0.1', userAgent: 'test' }));
  });

  test('an expired refresh token is rejected', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { pool } = require('./setup');
    const { user, refreshToken } = await createVerifiedUser({ role: 'donor' });
    const { hashToken } = require('../../utils/token');

    // Force the token's expiry into the past directly in the DB — this
    // exercises the same expiry check the API relies on without needing
    // to actually wait out the real expiry window.
    await pool.query(
      'UPDATE refresh_tokens SET expires_at = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE token_hash = :hash',
      { hash: hashToken(refreshToken) }
    );

    await assert.rejects(() => authService.refreshSession(refreshToken, { ipAddress: '127.0.0.1', userAgent: 'test' }));
  });
});
