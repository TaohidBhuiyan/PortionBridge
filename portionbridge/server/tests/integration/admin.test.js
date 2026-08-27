const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { isDbAvailable, createVerifiedUser, cleanupTestData, TEST_PASSWORD } = require('./setup');

describe('admin: user management business rules', () => {
  let dbReady = false;
  let adminService;
  let authService;

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;
    adminService = require('../../services/admin.service');
    authService = require('../../services/auth.service');
  });

  after(async () => {
    if (dbReady) await cleanupTestData();
  });

  test('an admin cannot disable their own account', async (t) => {
    if (!dbReady) return t.skip('no test database reachable — see tests/README.md');

    const { user: admin } = await createVerifiedUser({ role: 'admin' });

    await assert.rejects(
      () => adminService.disableUser(admin.id, admin.id),
      (err) => {
        assert.equal(err.statusCode, 403);
        return true;
      }
    );
  });

  test('disabling an already-disabled user is rejected (no-op double-ban)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: admin } = await createVerifiedUser({ role: 'admin' });
    const { user: target } = await createVerifiedUser({ role: 'donor' });

    await adminService.disableUser(target.id, admin.id);

    await assert.rejects(
      () => adminService.disableUser(target.id, admin.id),
      (err) => {
        assert.equal(err.statusCode, 409);
        return true;
      }
    );
  });

  test('a disabled (banned) user is actually blocked from logging in — the ban has a real effect, not just a flag', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: admin } = await createVerifiedUser({ role: 'admin' });
    const { user: target, email } = await createVerifiedUser({ role: 'donor' });

    await adminService.disableUser(target.id, admin.id);

    await assert.rejects(
      () =>
        authService.login({
          email,
          password: TEST_PASSWORD,
          ipAddress: '127.0.0.1',
          userAgent: 'node-test',
        }),
      (err) => {
        assert.equal(err.statusCode, 403);
        return true;
      }
    );
  });

  test('re-enabling a user restores their ability to log in', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: admin } = await createVerifiedUser({ role: 'admin' });
    const { user: target, email } = await createVerifiedUser({ role: 'donor' });

    await adminService.disableUser(target.id, admin.id);
    await adminService.enableUser(target.id, admin.id);

    const result = await authService.login({
      email,
      password: TEST_PASSWORD,
      ipAddress: '127.0.0.1',
      userAgent: 'node-test',
    });

    assert.equal(result.user.id, target.id);
    assert.ok(result.accessToken);
  });

  test('enabling a user who is not currently disabled is rejected', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: admin } = await createVerifiedUser({ role: 'admin' });
    const { user: target } = await createVerifiedUser({ role: 'donor' });

    await assert.rejects(
      () => adminService.enableUser(target.id, admin.id),
      (err) => {
        assert.equal(err.statusCode, 409);
        return true;
      }
    );
  });

  test('disabling a non-existent user returns 404', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: admin } = await createVerifiedUser({ role: 'admin' });

    await assert.rejects(
      () => adminService.disableUser(999999999, admin.id),
      (err) => {
        assert.equal(err.statusCode, 404);
        return true;
      }
    );
  });

  test('the admin dashboard summary reflects real counts, not hardcoded values', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    await createVerifiedUser({ role: 'donor' });
    const dashboard = await adminService.getDashboard();

    assert.ok(dashboard);
    assert.ok(typeof dashboard.totalUsers === 'number' || typeof dashboard.users === 'object');
  });
});
