const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { isDbAvailable, createVerifiedUser, cleanupTestData } = require('./setup');

describe('saved address: ownership, limits, and single-default invariant', () => {
  let dbReady = false;
  let savedAddressService;

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;
    savedAddressService = require('../../services/savedAddress.service');
  });

  after(async () => {
    if (dbReady) await cleanupTestData();
  });

  function addressPayload(overrides = {}) {
    return {
      label: 'home',
      fullAddress: '123 Test St, Gulshan',
      division: 'Dhaka',
      district: 'Dhaka',
      area: 'Gulshan',
      contactPersonName: 'Test Person',
      contactPhone: '+8801700000000',
      latitude: 23.78,
      longitude: 90.41,
      ...overrides,
    };
  }

  test('the first address a user creates is automatically made default', async (t) => {
    if (!dbReady) return t.skip('no test database reachable — see tests/README.md');

    const { user } = await createVerifiedUser({ role: 'donor' });
    const address = await savedAddressService.createAddress(user.id, addressPayload());

    assert.equal(address.is_default, 1);
  });

  test('Phase 3 regression: creating a 2nd address with isDefault=true correctly unsets the previous default (no two defaults at once)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user } = await createVerifiedUser({ role: 'donor' });
    const first = await savedAddressService.createAddress(user.id, addressPayload({ label: 'home' }));
    const second = await savedAddressService.createAddress(
      user.id,
      addressPayload({ label: 'office', isDefault: true })
    );

    const addresses = await savedAddressService.getUserAddresses(user.id);
    const defaults = addresses.filter((a) => a.is_default);

    assert.equal(defaults.length, 1, 'exactly one address should be marked default');
    assert.equal(defaults[0].id, second.id);

    const refreshedFirst = addresses.find((a) => a.id === first.id);
    assert.equal(refreshedFirst.is_default, 0);
  });

  test('a user cannot create more than 3 saved addresses', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user } = await createVerifiedUser({ role: 'donor' });
    await savedAddressService.createAddress(user.id, addressPayload({ label: 'home' }));
    await savedAddressService.createAddress(user.id, addressPayload({ label: 'office' }));
    await savedAddressService.createAddress(user.id, addressPayload({ label: 'other' }));

    await assert.rejects(
      () => savedAddressService.createAddress(user.id, addressPayload({ label: 'custom', customLabel: 'Gym' })),
      (err) => {
        assert.equal(err.statusCode, 409);
        return true;
      }
    );
  });

  test('label "custom" without a customLabel is rejected', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user } = await createVerifiedUser({ role: 'donor' });

    await assert.rejects(
      () => savedAddressService.createAddress(user.id, addressPayload({ label: 'custom' })),
      (err) => {
        assert.equal(err.statusCode, 400);
        return true;
      }
    );
  });

  test('user A cannot read, update, or delete user B\'s saved address (IDOR check)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user: userA } = await createVerifiedUser({ role: 'donor' });
    const { user: userB } = await createVerifiedUser({ role: 'donor' });

    const addressA = await savedAddressService.createAddress(userA.id, addressPayload());

    await assert.rejects(
      () => savedAddressService.getAddressById(addressA.id, userB.id),
      (err) => {
        assert.equal(err.statusCode, 403);
        return true;
      }
    );

    await assert.rejects(
      () => savedAddressService.updateAddress(addressA.id, userB.id, { fullAddress: 'hacked' }),
      (err) => {
        assert.equal(err.statusCode, 403);
        return true;
      }
    );

    await assert.rejects(
      () => savedAddressService.deleteAddress(addressA.id, userB.id),
      (err) => {
        assert.equal(err.statusCode, 403);
        return true;
      }
    );
  });

  test('deleting the default address promotes another remaining address to default', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user } = await createVerifiedUser({ role: 'donor' });
    const first = await savedAddressService.createAddress(user.id, addressPayload({ label: 'home' }));
    await savedAddressService.createAddress(user.id, addressPayload({ label: 'office' }));

    await savedAddressService.deleteAddress(first.id, user.id);

    const remaining = await savedAddressService.getUserAddresses(user.id);
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].is_default, 1);
  });

  test('setDefaultAddress switches the default cleanly between two existing addresses', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');

    const { user } = await createVerifiedUser({ role: 'donor' });
    const first = await savedAddressService.createAddress(user.id, addressPayload({ label: 'home' }));
    const second = await savedAddressService.createAddress(user.id, addressPayload({ label: 'office' }));

    await savedAddressService.setDefaultAddress(second.id, user.id);

    const addresses = await savedAddressService.getUserAddresses(user.id);
    const defaults = addresses.filter((a) => a.is_default);

    assert.equal(defaults.length, 1);
    assert.equal(defaults[0].id, second.id);
    assert.notEqual(defaults[0].id, first.id);
  });
});
