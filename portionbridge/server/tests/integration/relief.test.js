const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

const {
  pool, isDbAvailable, createVerifiedUser, cleanupTestData, validFoodDonationPayload,
} = require('./setup');

/**
 * Disaster Relief Phase 1 — runs the REAL Express app over HTTP on an ephemeral
 * port against a real database (no mocks). Concurrency tests call the service
 * layer directly with real parallel transactions.
 */
describe('disaster relief: incidents, requests, items, pledges', () => {
  let dbReady = false;
  let server;
  let base;
  let pledgeService;
  let donationService;
  let admin;
  let volunteer;
  let volunteer2;
  let reporter;
  let donor;
  let donor2;
  const incidentIds = [];

  async function api(method, path, { token, body, headers } = {}) {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  }

  const incidentPayload = (o = {}) => ({
    title: 'Flash flood in Sylhet', description: 'Rising water', disasterType: 'flash_flood',
    severity: 'high', district: 'Sylhet', affectedArea: 'Companiganj', address: '12 Secret Lane, Companiganj',
    latitude: 24.912345, longitude: 91.831234, ...o,
  });

  async function verifiedIncident(o = {}) {
    const r = await api('POST', '/incidents', { token: admin.accessToken, body: incidentPayload(o) });
    assert.equal(r.status, 201);
    const id = r.body.data.incident.id;
    incidentIds.push(id);
    await api('PATCH', `/incidents/${id}/status`, { token: admin.accessToken, body: { status: 'under_review' } });
    const v = await api('PATCH', `/incidents/${id}/status`, { token: admin.accessToken, body: { status: 'verified', notes: 'confirmed with district office' } });
    assert.equal(v.status, 200);
    return id;
  }

  const items = (...list) => list.map(([name, unit, quantity, category = 'other']) => ({ name, unit, quantity, category }));

  /** incident + request with items, approved by admin. Returns { incidentId, requestId, itemIds[] } */
  async function approvedRequest(itemList = items(['Rice', 'kg', 10, 'dry_food']), incidentId) {
    const inc = incidentId || (await verifiedIncident());
    const created = await api('POST', `/incidents/${inc}/requests`, {
      token: volunteer.accessToken,
      body: { title: 'Shelter needs', locationName: 'Govt Primary School', latitude: 24.9, longitude: 91.83, address: 'School road 5', items: itemList },
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const requestId = created.body.data.request.id;
    const ap = await api('PATCH', `/requests/${requestId}/status`, { token: admin.accessToken, body: { status: 'approved' } });
    assert.equal(ap.status, 200, JSON.stringify(ap.body));
    return { incidentId: inc, requestId, itemIds: ap.body.data.request.items.map((i) => i.id) };
  }

  const pledge = (user, itemId, quantity, extra = {}) =>
    api('POST', `/items/${itemId}/pledges`, { token: user.accessToken, body: { quantity, ...extra.body }, headers: extra.headers });
  const summaryOf = async (requestId) => (await api('GET', `/requests/${requestId}/summary`, { token: admin.accessToken })).body.data.summary;
  const itemQ = async (requestId, itemId) => (await summaryOf(requestId)).items.find((i) => i.id === itemId).quantities;

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;
    const app = require('../../app');
    pledgeService = require('../../services/reliefPledge.service');
    donationService = require('../../services/donation.service');
    server = http.createServer(app);
    await new Promise((r) => server.listen(0, r));
    base = `http://127.0.0.1:${server.address().port}/api/v1/relief`;
    [admin, volunteer, volunteer2, reporter, donor, donor2] = await Promise.all([
      createVerifiedUser({ role: 'admin' }), createVerifiedUser({ role: 'volunteer' }), createVerifiedUser({ role: 'volunteer' }),
      createVerifiedUser({ role: 'donor' }), createVerifiedUser({ role: 'donor' }), createVerifiedUser({ role: 'donor' }),
    ]);
  });

  after(async () => {
    if (!dbReady) return;
    await new Promise((r) => server.close(r));
    // FK-safe cleanup of everything the tests created (scoped to ids this run created)
    if (incidentIds.length) {
      await pool.query('DELETE p FROM relief_pledges p JOIN relief_request_items i ON i.id = p.relief_request_item_id JOIN relief_requests r ON r.id = i.relief_request_id WHERE r.incident_id IN (?)', [incidentIds]);
      await pool.query('DELETE FROM relief_requests WHERE incident_id IN (?)', [incidentIds]);
      await pool.query('DELETE FROM disaster_incidents WHERE id IN (?)', [incidentIds]);
    }
    await cleanupTestData();
  });

  // ---------------------------------------------------------------- incidents
  test('a signed-in user can report an incident; it starts reported/unverified and payload cannot set status or verification', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const r = await api('POST', '/incidents', {
      token: reporter.accessToken,
      body: incidentPayload({ status: 'verified', verificationStatus: 'verified', isVerified: true, verifiedBy: admin.user.id, sourceType: 'official_source', priority: 'urgent', reportedBy: 999999 }),
    });
    assert.equal(r.status, 201);
    const inc = r.body.data.incident;
    incidentIds.push(inc.id);
    assert.equal(inc.status, 'reported');
    assert.equal(inc.isVerified, false);
    assert.equal(inc.sourceType, 'user_report');
    assert.equal(inc.priority, 'normal');
    const [[row]] = await pool.query('SELECT verification_status, verified_by, reported_by FROM disaster_incidents WHERE id = ?', [inc.id]);
    assert.equal(row.verification_status, 'unverified');
    assert.equal(row.verified_by, null);
    assert.equal(row.reported_by, reporter.user.id);
  });

  test('an incident entered by an admin defaults to source type admin_entry (still starts reported/unverified)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const r = await api('POST', '/incidents', { token: admin.accessToken, body: incidentPayload() });
    incidentIds.push(r.body.data.incident.id);
    assert.equal(r.body.data.incident.sourceType, 'admin_entry');
    assert.equal(r.body.data.incident.status, 'reported');
    assert.equal(r.body.data.incident.isVerified, false);
    const explicit = await api('POST', '/incidents', { token: admin.accessToken, body: incidentPayload({ sourceType: 'official_source' }) });
    incidentIds.push(explicit.body.data.incident.id);
    assert.equal(explicit.body.data.incident.sourceType, 'official_source');
  });

  test('incident creation rejects invalid input and unauthenticated callers', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const bad = [
      { title: 'abc' }, { title: undefined }, { disasterType: 'meteor' }, { district: '' },
      { latitude: 24.9, longitude: undefined }, { latitude: 51.5, longitude: -0.12 }, { latitude: 'north' },
      { severity: 'apocalyptic' }, { title: 'x'.repeat(201) }, { description: 'd'.repeat(5001) }, { title: { $ne: 1 } },
    ];
    for (const o of bad) {
      const r = await api('POST', '/incidents', { token: reporter.accessToken, body: incidentPayload(o) });
      assert.equal(r.status, 422, `expected 422 for ${JSON.stringify(o)} got ${r.status}`);
    }
    assert.equal((await api('POST', '/incidents', { body: incidentPayload() })).status, 401);
    assert.equal((await api('POST', '/incidents', { token: 'garbage', body: incidentPayload() })).status, 401);
  });

  test('unverified incidents are hidden from the public and other users but visible to the reporter and admin', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const r = await api('POST', '/incidents', { token: reporter.accessToken, body: incidentPayload({ title: 'Hidden until verified' }) });
    const id = r.body.data.incident.id;
    incidentIds.push(id);
    assert.equal((await api('GET', `/incidents/${id}`)).status, 404);
    assert.equal((await api('GET', `/incidents/${id}`, { token: donor.accessToken })).status, 404);
    assert.equal((await api('GET', `/incidents/${id}`, { token: reporter.accessToken })).status, 200);
    assert.equal((await api('GET', `/incidents/${id}`, { token: admin.accessToken })).status, 200);
    const pub = await api('GET', '/incidents?limit=200');
    assert.ok(!pub.body.data.incidents.some((i) => i.id === id));
    const mine = await api('GET', '/incidents?mine=true', { token: reporter.accessToken });
    assert.ok(mine.body.data.incidents.some((i) => i.id === id));
    assert.equal((await api('GET', '/incidents?mine=true')).status, 401);
    // a non-admin asking for status=reported still gets nothing
    const sneaky = await api('GET', '/incidents?status=reported&limit=200', { token: donor.accessToken });
    assert.equal(sneaky.body.data.incidents.length, 0);
  });

  test('only an admin can change incident status; transitions are validated; rejection needs a reason', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const r = await api('POST', '/incidents', { token: reporter.accessToken, body: incidentPayload() });
    const id = r.body.data.incident.id;
    incidentIds.push(id);
    for (const user of [reporter, donor, volunteer]) {
      const x = await api('PATCH', `/incidents/${id}/status`, { token: user.accessToken, body: { status: 'verified' } });
      assert.equal(x.status, 403);
    }
    assert.equal((await api('PATCH', `/incidents/${id}/status`, { body: { status: 'verified' } })).status, 401);
    const skip = await api('PATCH', `/incidents/${id}/status`, { token: admin.accessToken, body: { status: 'verified' } });
    assert.equal(skip.status, 409);
    assert.equal(skip.body.code, 'INVALID_STATUS_TRANSITION');
    assert.equal((await api('PATCH', `/incidents/${id}/status`, { token: admin.accessToken, body: { status: 'nonsense' } })).status, 422);
    assert.equal((await api('PATCH', `/incidents/${id}/status`, { token: admin.accessToken, body: { status: 'under_review' } })).status, 200);
    assert.equal((await api('PATCH', `/incidents/${id}/status`, { token: admin.accessToken, body: { status: 'rejected' } })).status, 422);
    const ok = await api('PATCH', `/incidents/${id}/status`, { token: admin.accessToken, body: { status: 'verified', notes: 'confirmed' } });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.data.incident.isVerified, true);
    assert.equal(ok.body.data.incident.verifiedBy, admin.user.id);
    assert.equal((await api('PATCH', `/incidents/${id}/status`, { token: admin.accessToken, body: { status: 'verified' } })).status, 409);
    assert.equal((await api('PATCH', `/incidents/${id}/status`, { token: admin.accessToken, body: { status: 'resolved' } })).status, 200);
  });

  test('public incident responses hide precise location and moderation data; admin sees everything', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const id = await verifiedIncident();
    const pub = (await api('GET', `/incidents/${id}`)).body.data.incident;
    assert.equal(pub.coordinatesApproximate, true);
    assert.equal(pub.latitude, 24.91);
    assert.equal(pub.longitude, 91.83);
    for (const key of ['address', 'verificationNotes', 'verifiedBy', 'verifierName', 'reportedBy', 'reporterName', 'sourceReference']) {
      assert.ok(!(key in pub), `public response must not include ${key}`);
    }
    const adm = (await api('GET', `/incidents/${id}`, { token: admin.accessToken })).body.data.incident;
    assert.equal(adm.address, '12 Secret Lane, Companiganj');
    assert.equal(adm.latitude, 24.912345);
    assert.equal(adm.verificationNotes, 'confirmed with district office');
    assert.equal(adm.verifiedBy, admin.user.id);
  });

  test('incident listing supports pagination and filters', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const marker = `Marker${Date.now()}`;
    await verifiedIncident({ title: `${marker} A`, disasterType: 'fire', district: 'Dhaka' });
    await verifiedIncident({ title: `${marker} B`, disasterType: 'fire', district: 'Khulna' });
    await verifiedIncident({ title: `${marker} C`, disasterType: 'cyclone', district: 'Khulna' });
    const all = await api('GET', `/incidents?search=${marker}&limit=2&page=1`);
    assert.equal(all.body.meta.totalItems, 3);
    assert.equal(all.body.meta.totalPages, 2);
    assert.equal(all.body.data.incidents.length, 2);
    assert.equal((await api('GET', `/incidents?search=${marker}&limit=2&page=2`)).body.data.incidents.length, 1);
    assert.equal((await api('GET', `/incidents?search=${marker}&disasterType=fire`)).body.meta.totalItems, 2);
    assert.equal((await api('GET', `/incidents?search=${marker}&district=Khulna`)).body.meta.totalItems, 2);
    assert.equal((await api('GET', `/incidents?search=${marker}&disasterType=fire&district=Khulna`)).body.meta.totalItems, 1);
    assert.equal((await api('GET', '/incidents?limit=0')).status, 422);
    assert.equal((await api('GET', '/incidents?disasterType=bogus')).status, 422);
    // SQL-injection style input is treated as data
    const inj = await api('GET', `/incidents?search=${encodeURIComponent("' OR 1=1 --")}`);
    assert.equal(inj.status, 200);
    assert.equal(inj.body.data.incidents.length, 0);
  });

  test('incident list accepts a comma-separated status list and searches district; non-admins stay limited to public statuses', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const marker = `Multi${Date.now()}`;
    const a = await verifiedIncident({ title: `${marker} open`, district: 'Sunamganj' });
    const b = await verifiedIncident({ title: `${marker} done`, district: 'Sunamganj' });
    await api('PATCH', `/incidents/${b}/status`, { token: admin.accessToken, body: { status: 'resolved' } });
    const rep = await api('POST', '/incidents', { token: reporter.accessToken, body: incidentPayload({ title: `${marker} pending`, district: 'Sunamganj' }) });
    incidentIds.push(rep.body.data.incident.id);
    const q = (extra, token) => api('GET', `/incidents?search=${marker}&limit=50${extra}`, { token });
    assert.equal((await q('&status=verified,active')).body.meta.totalItems, 1);
    assert.equal((await q('&status=verified,active,resolved')).body.meta.totalItems, 2);
    assert.equal((await q('&status=resolved')).body.meta.totalItems, 1);
    // a non-admin asking for unverified statuses gets nothing, a mixed list is intersected with the public set
    assert.equal((await q('&status=reported,under_review', donor.accessToken)).body.meta.totalItems, 0);
    assert.equal((await q('&status=reported,verified', donor.accessToken)).body.meta.totalItems, 1);
    assert.equal((await q('&status=reported,under_review', admin.accessToken)).body.meta.totalItems, 1);
    assert.equal((await q('&status=bogus')).status, 422);
    assert.equal((await q('&status=verified,bogus')).status, 422);
    assert.equal((await api('GET', `/incidents?search=${encodeURIComponent('Sunamganj')}&limit=200`)).body.data.incidents.some((i) => i.id === a), true);
  });

  test('reporter may edit while reported, not after review; strangers cannot edit; admin can', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const r = await api('POST', '/incidents', { token: reporter.accessToken, body: incidentPayload() });
    const id = r.body.data.incident.id;
    incidentIds.push(id);
    assert.equal((await api('PATCH', `/incidents/${id}`, { token: reporter.accessToken, body: { title: 'Updated title ok', status: 'verified' } })).status, 200);
    assert.equal((await api('GET', `/incidents/${id}`, { token: reporter.accessToken })).body.data.incident.status, 'reported');
    assert.equal((await api('PATCH', `/incidents/${id}`, { token: donor.accessToken, body: { title: 'Hijack attempt' } })).status, 404);
    assert.equal((await api('PATCH', `/incidents/${id}`, { token: reporter.accessToken, body: { priority: 'urgent' } })).status, 400); // admin-only field ignored -> nothing to update
    await api('PATCH', `/incidents/${id}/status`, { token: admin.accessToken, body: { status: 'under_review' } });
    assert.equal((await api('PATCH', `/incidents/${id}`, { token: reporter.accessToken, body: { title: 'Too late to edit' } })).status, 409);
    const a = await api('PATCH', `/incidents/${id}`, { token: admin.accessToken, body: { priority: 'urgent' } });
    assert.equal(a.status, 200);
    assert.equal(a.body.data.incident.priority, 'urgent');
  });

  // ----------------------------------------------------------------- requests
  test('relief requests: only volunteers/admins create; start pending_review; payload cannot approve; need an open incident', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const id = await verifiedIncident();
    const body = { title: 'Shelter needs', locationName: 'School', items: items(['Water', 'liter', 100, 'drinking_water']) };
    assert.equal((await api('POST', `/incidents/${id}/requests`, { token: donor.accessToken, body })).status, 403);
    assert.equal((await api('POST', `/incidents/${id}/requests`, { body })).status, 401);
    const ok = await api('POST', `/incidents/${id}/requests`, {
      token: volunteer.accessToken, body: { ...body, status: 'approved', approvedBy: volunteer.user.id, approved_at: '2020-01-01' },
    });
    assert.equal(ok.status, 201);
    assert.equal(ok.body.data.request.status, 'pending_review');
    const [[row]] = await pool.query('SELECT approved_by, approved_at FROM relief_requests WHERE id = ?', [ok.body.data.request.id]);
    assert.equal(row.approved_by, null);
    assert.equal(row.approved_at, null);
    // not open: a reported (unverified) incident
    const rep = await api('POST', '/incidents', { token: reporter.accessToken, body: incidentPayload() });
    incidentIds.push(rep.body.data.incident.id);
    const closed = await api('POST', `/incidents/${rep.body.data.incident.id}/requests`, { token: admin.accessToken, body });
    assert.equal(closed.status, 409);
    assert.equal((await api('POST', '/incidents/999999999/requests', { token: admin.accessToken, body })).status, 404);
  });

  test('relief request validation: titles, quantities, units, duplicates in payload', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const id = await verifiedIncident();
    const mk = (extra) => api('POST', `/incidents/${id}/requests`, { token: volunteer.accessToken, body: { title: 'Valid title', locationName: 'School', ...extra } });
    const badItems = [
      items(['Rice', 'kg', 0]), items(['Rice', 'kg', -5]), items(['Rice', 'kg', 'abc']), items(['Rice', 'kg', 1.2345]),
      items(['Rice', 'sack', 5]), items(['Blanket', 'piece', 2.5]), items(['', 'kg', 5]),
    ];
    for (const list of badItems) {
      const r = await mk({ items: list });
      assert.ok([422].includes(r.status), `expected 422 for ${JSON.stringify(list)} got ${r.status}`);
    }
    assert.equal((await mk({ title: 'abc' })).status, 422);
    assert.equal((await mk({ latitude: 24.9 })).status, 422);
    assert.equal((await mk({ expiresAt: '2001-01-01T00:00:00Z' })).status, 422);
    assert.equal((await mk({ items: items(['Rice', 'kg', 5], ['  RICE ', 'kg', 7]) })).status, 422); // duplicate in payload
    const frac = await mk({ items: items(['Rice', 'kg', 2.5, 'dry_food']) });
    assert.equal(frac.status, 201); // fractional kg is fine
    const none = await mk({});
    assert.equal(none.status, 201); // a request may be created empty and filled later
  });

  test('approval is a separate admin action and needs items; public only sees approved requests', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const inc = await verifiedIncident();
    const c = await api('POST', `/incidents/${inc}/requests`, { token: volunteer.accessToken, body: { title: 'Empty request', locationName: 'School', address: 'Private address 9', latitude: 24.912345, longitude: 91.831234 } });
    const rid = c.body.data.request.id;
    assert.equal((await api('PATCH', `/requests/${rid}/status`, { token: volunteer.accessToken, body: { status: 'approved' } })).status, 403);
    assert.equal((await api('PATCH', `/requests/${rid}/status`, { token: admin.accessToken, body: { status: 'approved' } })).status, 409); // no items
    assert.equal((await api('GET', `/requests/${rid}`)).status, 404); // pending not public
    assert.equal((await api('GET', `/requests/${rid}`, { token: volunteer2.accessToken })).status, 404);
    assert.equal((await api('GET', `/requests/${rid}`, { token: volunteer.accessToken })).status, 200); // owner
    await api('POST', `/requests/${rid}/items`, { token: volunteer.accessToken, body: { name: 'Blanket', unit: 'piece', quantity: 20, category: 'blanket' } });
    assert.equal((await api('PATCH', `/requests/${rid}/status`, { token: admin.accessToken, body: { status: 'rejected' } })).status, 422);
    const ap = await api('PATCH', `/requests/${rid}/status`, { token: admin.accessToken, body: { status: 'approved' } });
    assert.equal(ap.status, 200);
    const pub = (await api('GET', `/requests/${rid}`)).body.data.request;
    assert.equal(pub.status, 'approved');
    assert.equal(pub.coordinatesApproximate, true);
    assert.equal(pub.latitude, 24.91);
    for (const key of ['address', 'reviewNotes', 'requestedBy', 'requesterName', 'approvedBy']) assert.ok(!(key in pub), `public must not include ${key}`);
    const adm = (await api('GET', `/requests/${rid}`, { token: admin.accessToken })).body.data.request;
    assert.equal(adm.address, 'Private address 9');
    const list = await api('GET', `/incidents/${inc}/requests`);
    assert.equal(list.body.data.requests.length, 1);
    assert.equal(list.body.data.requests[0].items[0].quantities.requested, 20);
    // approved -> approved is invalid
    assert.equal((await api('PATCH', `/requests/${rid}/status`, { token: admin.accessToken, body: { status: 'approved' } })).status, 409);
  });

  test('request edits: owner only while pending, other volunteers blocked, admin may edit approved', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const inc = await verifiedIncident();
    const c = await api('POST', `/incidents/${inc}/requests`, { token: volunteer.accessToken, body: { title: 'Original title', locationName: 'School', items: items(['Rice', 'kg', 5]) } });
    const rid = c.body.data.request.id;
    assert.equal((await api('PATCH', `/requests/${rid}`, { token: volunteer2.accessToken, body: { title: 'Hijacked title' } })).status, 404);
    assert.equal((await api('PATCH', `/requests/${rid}`, { token: volunteer.accessToken, body: { title: 'Better title' } })).status, 200);
    await api('PATCH', `/requests/${rid}/status`, { token: admin.accessToken, body: { status: 'approved' } });
    assert.equal((await api('PATCH', `/requests/${rid}`, { token: volunteer.accessToken, body: { title: 'Changed after approval' } })).status, 409);
    assert.equal((await api('PATCH', `/requests/${rid}`, { token: admin.accessToken, body: { priority: 'urgent' } })).status, 200);
    assert.equal((await api('PATCH', `/requests/${rid}`, { token: donor.accessToken, body: { priority: 'low' } })).status, 403);
  });

  // -------------------------------------------------------------------- items
  test('items: duplicates blocked, whole-number rule, quantity cannot drop below committed, removal rules', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const { requestId, itemIds } = await approvedRequest(items(['Rice', 'kg', 10, 'dry_food']));
    const riceId = itemIds[0];
    const dup = await api('POST', `/requests/${requestId}/items`, { token: admin.accessToken, body: { name: ' rice ', unit: 'kg', quantity: 3, category: 'dry_food' } });
    assert.equal(dup.status, 409);
    assert.equal(dup.body.code, 'DUPLICATE_ITEM');
    assert.equal((await api('POST', `/requests/${requestId}/items`, { token: admin.accessToken, body: { name: 'Rice', unit: 'packet', quantity: 3, category: 'dry_food' } })).status, 201); // different unit = different item
    assert.equal((await api('POST', `/requests/${requestId}/items`, { token: admin.accessToken, body: { name: 'Blanket', unit: 'piece', quantity: 2.5, category: 'blanket' } })).status, 422);
    assert.equal((await api('POST', `/requests/${requestId}/items`, { token: donor.accessToken, body: { name: 'X', unit: 'kg', quantity: 1, category: 'other' } })).status, 403);

    assert.equal((await pledge(donor, riceId, 6)).status, 201);
    const low = await api('PATCH', `/requests/${requestId}/items/${riceId}`, { token: admin.accessToken, body: { quantity: 5 } });
    assert.equal(low.status, 409);
    assert.equal(low.body.code, 'QUANTITY_BELOW_COMMITTED');
    assert.equal((await api('PATCH', `/requests/${requestId}/items/${riceId}`, { token: admin.accessToken, body: { quantity: 6 } })).status, 200);
    assert.equal((await api('PATCH', `/requests/${requestId}/items/${riceId}`, { token: admin.accessToken, body: { unit: 'liter' } })).status, 409); // identity locked once pledged
    assert.equal((await api('PATCH', `/requests/${requestId}/items/${riceId}`, { token: admin.accessToken, body: { quantity: 0 } })).status, 422);
    assert.equal((await api('DELETE', `/requests/${requestId}/items/${riceId}`, { token: admin.accessToken })).status, 409); // has an active pledge
    assert.equal((await api('PATCH', `/requests/${requestId}/items/999999999`, { token: admin.accessToken, body: { quantity: 6 } })).status, 404);
  });

  test('item removal: hard delete without history; soft-cancel with only cancelled pledges; re-adding reactivates', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const { requestId, itemIds } = await approvedRequest(items(['Rice', 'kg', 10], ['Dal', 'kg', 5]));
    const [rice, dal] = itemIds;
    const del = await api('DELETE', `/requests/${requestId}/items/${dal}`, { token: admin.accessToken });
    assert.equal(del.body.data.mode, 'deleted');
    const p = await pledge(donor, rice, 4);
    await api('POST', `/pledges/${p.body.data.pledge.id}/cancel`, { token: donor.accessToken, body: {} });
    const soft = await api('DELETE', `/requests/${requestId}/items/${rice}`, { token: admin.accessToken });
    assert.equal(soft.body.data.mode, 'cancelled');
    assert.equal((await summaryOf(requestId)).items.length, 0);
    const re = await api('POST', `/requests/${requestId}/items`, { token: admin.accessToken, body: { name: 'Rice', unit: 'kg', quantity: 8, category: 'dry_food' } });
    assert.equal(re.status, 201);
    assert.equal(re.body.data.item.id, rice);
    assert.equal(re.body.data.item.quantities.requested, 8);
    assert.equal(re.body.data.item.quantities.committed, 0); // cancelled pledge history is not counted
  });

  // ------------------------------------------------------------------ pledges
  test('pledge creation: auth/role, positive quantities, unit rules, over-pledge, open-request requirement', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const { requestId, itemIds } = await approvedRequest(items(['Rice', 'kg', 10, 'dry_food'], ['Blanket', 'piece', 5, 'blanket']));
    const [rice, blanket] = itemIds;
    assert.equal((await api('POST', `/items/${rice}/pledges`, { body: { quantity: 1 } })).status, 401);
    assert.equal((await pledge(volunteer, rice, 1)).status, 403);
    assert.equal((await pledge(admin, rice, 1)).status, 403);
    for (const q of [0, -3, 'abc', null, '1e2', 1.2345, undefined]) {
      assert.equal((await pledge(donor, rice, q)).status, 422, `quantity ${q}`);
    }
    assert.equal((await pledge(donor, blanket, 1.5)).status, 422);
    assert.equal((await pledge(donor, 999999999, 1)).status, 404);
    const tooMuch = await pledge(donor, rice, 10.001);
    assert.equal(tooMuch.status, 409);
    assert.equal(tooMuch.body.code, 'OVER_PLEDGE');
    const ok = await pledge(donor, rice, 7.25);
    assert.equal(ok.status, 201);
    assert.equal(ok.body.data.pledge.status, 'pledged');
    assert.equal(ok.body.data.item.quantities.activePledged, 7.25);
    assert.equal(ok.body.data.item.quantities.remainingToPledge, 2.75);
    assert.equal(ok.body.data.item.quantities.delivered, 0);
    assert.equal(ok.body.data.item.quantities.fulfillmentStage, 'partially_pledged');
    const over = await pledge(donor2, rice, 2.751);
    assert.equal(over.status, 409);
    const rest = await pledge(donor2, rice, 2.75);
    assert.equal(rest.status, 201);
    // fully pledged is NOT fulfilled
    const q = await itemQ(requestId, rice);
    assert.equal(q.fulfillmentStage, 'fully_pledged');
    assert.equal(q.remainingToPledge, 0);
    assert.equal(q.remainingUnfulfilled, 10);
    assert.equal((await summaryOf(requestId)).summary.isFullyFulfilled, false);
    assert.equal((await pledge(donor, rice, 1)).status, 409);
    // request must be approved
    const inc = await verifiedIncident();
    const pend = await api('POST', `/incidents/${inc}/requests`, { token: volunteer.accessToken, body: { title: 'Pending req', locationName: 'X', items: items(['Rice', 'kg', 5]) } });
    const pendItem = (await api('GET', `/requests/${pend.body.data.request.id}`, { token: admin.accessToken })).body.data.request.items[0].id;
    assert.equal((await pledge(donor, pendItem, 1)).status, 409);
  });

  test('a donor can hold only one open pledge per item; idempotency keys replay safely', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const { itemIds } = await approvedRequest(items(['Rice', 'kg', 100]));
    const item = itemIds[0];
    const key = `key-${Date.now()}-aaaa`;
    const first = await pledge(donor, item, 10, { headers: { 'Idempotency-Key': key } });
    assert.equal(first.status, 201);
    const replay = await pledge(donor, item, 10, { headers: { 'Idempotency-Key': key } });
    assert.equal(replay.status, 200);
    assert.equal(replay.body.data.idempotentReplay, true);
    assert.equal(replay.body.data.pledge.id, first.body.data.pledge.id);
    assert.equal(replay.body.data.item.quantities.activePledged, 10); // not 20
    const reused = await pledge(donor, item, 11, { headers: { 'Idempotency-Key': key } });
    assert.equal(reused.status, 409);
    assert.equal(reused.body.code, 'IDEMPOTENCY_KEY_REUSED');
    assert.equal((await pledge(donor, item, 1, { headers: { 'Idempotency-Key': 'short' } })).status, 422);
    const dup = await pledge(donor, item, 5);
    assert.equal(dup.status, 409);
    assert.equal(dup.body.code, 'DUPLICATE_PLEDGE');
    const [[{ n }]] = await pool.query('SELECT COUNT(*) n FROM relief_pledges WHERE relief_request_item_id = ? AND donor_id = ?', [item, donor.user.id]);
    assert.equal(Number(n), 1);
  });

  test('update and cancel: quantities re-checked, cancelled pledges stop counting, ownership enforced, invalid transitions rejected', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const { requestId, itemIds } = await approvedRequest(items(['Rice', 'kg', 10]));
    const item = itemIds[0];
    const a = (await pledge(donor, item, 4)).body.data.pledge;
    const b = (await pledge(donor2, item, 5)).body.data.pledge;
    // donor can raise to the room left (10 - 5 = 5) but not beyond
    assert.equal((await api('PATCH', `/pledges/${a.id}`, { token: donor.accessToken, body: { quantity: 5.001 } })).status, 409);
    assert.equal((await api('PATCH', `/pledges/${a.id}`, { token: donor.accessToken, body: { quantity: 5 } })).status, 200);
    assert.equal((await api('PATCH', `/pledges/${a.id}`, { token: donor.accessToken, body: { quantity: 0 } })).status, 422);
    assert.equal((await api('PATCH', `/pledges/${a.id}`, { token: donor2.accessToken, body: { quantity: 1 } })).status, 404); // not the owner
    assert.equal((await api('PATCH', `/pledges/${a.id}`, { token: admin.accessToken, body: { quantity: 1 } })).status, 403);
    assert.equal((await itemQ(requestId, item)).remainingToPledge, 0);
    // other donor cannot cancel it; the owner can; double-cancel is rejected
    assert.equal((await api('POST', `/pledges/${a.id}/cancel`, { token: donor2.accessToken, body: {} })).status, 404);
    const c = await api('POST', `/pledges/${a.id}/cancel`, { token: donor.accessToken, body: { reason: 'cannot make it' } });
    assert.equal(c.status, 200);
    assert.equal(c.body.data.pledge.status, 'cancelled');
    assert.equal(c.body.data.item.quantities.activePledged, 5); // only b remains
    assert.equal(c.body.data.item.quantities.remainingToPledge, 5);
    assert.equal((await api('POST', `/pledges/${a.id}/cancel`, { token: donor.accessToken, body: {} })).status, 409);
    assert.equal((await api('PATCH', `/pledges/${a.id}`, { token: donor.accessToken, body: { quantity: 1 } })).status, 409);
    // quantity freed by the cancellation is pledgeable again, by the same donor too
    assert.equal((await pledge(donor, item, 5)).status, 201);
    assert.equal(b.status, 'pledged');
    // privacy: pledges are not readable by strangers, and /mine lists only own
    assert.equal((await api('GET', `/pledges/${b.id}`, { token: donor.accessToken })).status, 404);
    assert.equal((await api('GET', `/pledges/${b.id}`, { token: donor2.accessToken })).status, 200);
    assert.equal((await api('GET', `/pledges/${b.id}`, { token: admin.accessToken })).status, 200);
    assert.equal((await api('GET', `/pledges/${b.id}`)).status, 401);
    const mine = await api('GET', '/pledges/mine?limit=200', { token: donor2.accessToken });
    assert.ok(mine.body.data.pledges.every((p) => !('donorId' in p)));
    assert.ok(mine.body.data.pledges.some((p) => p.id === b.id));
    assert.equal((await api('GET', '/pledges/mine', { token: volunteer.accessToken })).status, 403);
    assert.equal((await api('GET', `/requests/${requestId}/pledges`, { token: donor.accessToken })).status, 403);
    const adminList = await api('GET', `/requests/${requestId}/pledges`, { token: admin.accessToken });
    assert.equal(adminList.status, 200);
    assert.equal(adminList.body.meta.totalItems, 3);
  });

  test('fulfilment flow: collection -> delivery enforces order and limits; completion only after full delivery', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const { requestId, itemIds } = await approvedRequest(items(['Rice', 'kg', 10]));
    const item = itemIds[0];
    const p = (await pledge(donor, item, 10)).body.data.pledge;
    // delivery before collection, and by non-assigned volunteers, is refused
    assert.equal((await api('POST', `/pledges/${p.id}/delivery`, { token: admin.accessToken, body: { quantity: 1 } })).status, 409);
    assert.equal((await api('POST', `/pledges/${p.id}/collection`, { token: volunteer.accessToken, body: { quantity: 1 } })).status, 403); // volunteers never write quantities directly
    assert.equal((await api('POST', `/pledges/${p.id}/collection`, { token: donor.accessToken, body: { quantity: 1 } })).status, 403);
    assert.equal((await api('POST', `/pledges/${p.id}/collection`, { token: admin.accessToken, body: { quantity: 10.001 } })).status, 409);
    assert.equal((await api('POST', `/pledges/${p.id}/collection`, { token: admin.accessToken, body: { quantity: 0 } })).status, 422);
    const col = await api('POST', `/pledges/${p.id}/collection`, { token: admin.accessToken, body: { quantity: 6 } });
    assert.equal(col.status, 200);
    assert.equal(col.body.data.pledge.status, 'collected');
    assert.equal(col.body.data.item.quantities.collected, 6);
    assert.equal(col.body.data.item.quantities.delivered, 0);
    assert.equal(col.body.data.item.quantities.fulfillmentStage, 'fully_pledged');
    // the donor can no longer edit/cancel a collected pledge; admin cancel of one with nothing delivered is allowed elsewhere
    assert.equal((await api('PATCH', `/pledges/${p.id}`, { token: donor.accessToken, body: { quantity: 8 } })).status, 409);
    assert.equal((await api('POST', `/pledges/${p.id}/cancel`, { token: donor.accessToken, body: {} })).status, 409);
    // cannot deliver more than collected
    assert.equal((await api('POST', `/pledges/${p.id}/delivery`, { token: admin.accessToken, body: { quantity: 6.001 } })).status, 409);
    const d1 = await api('POST', `/pledges/${p.id}/delivery`, { token: admin.accessToken, body: { quantity: 6 } });
    assert.equal(d1.body.data.pledge.status, 'collected'); // not fully delivered yet
    assert.equal(d1.body.data.item.quantities.delivered, 6);
    assert.equal(d1.body.data.item.quantities.activePledged, 4); // 10 pledged - 6 delivered (no double count)
    assert.equal(d1.body.data.item.quantities.remainingToPledge, 0);
    assert.equal(d1.body.data.item.quantities.remainingUnfulfilled, 4);
    assert.equal((await api('GET', `/requests/${requestId}`, { token: admin.accessToken })).body.data.request.status, 'approved');
    // delivering more than collected is still refused even though pledged allows it
    assert.equal((await api('POST', `/pledges/${p.id}/delivery`, { token: admin.accessToken, body: { quantity: 1 } })).status, 409);
    await api('POST', `/pledges/${p.id}/collection`, { token: admin.accessToken, body: { quantity: 4 } });
    const d2 = await api('POST', `/pledges/${p.id}/delivery`, { token: admin.accessToken, body: { quantity: 4 } });
    assert.equal(d2.body.data.pledge.status, 'delivered');
    assert.equal(d2.body.data.item.quantities.fulfillmentStage, 'fulfilled');
    assert.equal(d2.body.data.item.quantities.remainingUnfulfilled, 0);
    assert.equal((await api('GET', `/requests/${requestId}`, { token: admin.accessToken })).body.data.request.status, 'completed');
    // terminal: no further collection / cancellation
    assert.equal((await api('POST', `/pledges/${p.id}/collection`, { token: admin.accessToken, body: { quantity: 1 } })).status, 409);
    assert.equal((await api('POST', `/pledges/${p.id}/cancel`, { token: admin.accessToken, body: {} })).status, 409);
    assert.equal((await pledge(donor2, item, 1)).status, 409); // request completed
  });

  test('partial fulfilment: closing a short pledge releases the shortfall and does not complete the request', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const { requestId, itemIds } = await approvedRequest(items(['Rice', 'kg', 10]));
    const item = itemIds[0];
    const p = (await pledge(donor, item, 10)).body.data.pledge;
    assert.equal((await api('POST', `/pledges/${p.id}/close-partial`, { token: admin.accessToken })).status, 409); // nothing collected yet
    await api('POST', `/pledges/${p.id}/collection`, { token: admin.accessToken, body: { quantity: 6 } });
    assert.equal((await api('POST', `/pledges/${p.id}/close-partial`, { token: admin.accessToken })).status, 409); // collected but not delivered
    await api('POST', `/pledges/${p.id}/delivery`, { token: admin.accessToken, body: { quantity: 6 } });
    const closed = await api('POST', `/pledges/${p.id}/close-partial`, { token: admin.accessToken });
    assert.equal(closed.status, 200);
    assert.equal(closed.body.data.pledge.status, 'partially_fulfilled');
    const q = closed.body.data.item.quantities;
    assert.equal(q.delivered, 6);
    assert.equal(q.activePledged, 0);
    assert.equal(q.committed, 6);
    assert.equal(q.remainingToPledge, 4); // shortfall released
    assert.equal(q.remainingUnfulfilled, 4);
    assert.equal(q.fulfillmentStage, 'partially_delivered');
    assert.equal((await api('GET', `/requests/${requestId}`, { token: admin.accessToken })).body.data.request.status, 'approved');
    assert.equal((await pledge(donor2, item, 4)).status, 201); // released quantity is pledgeable again
    assert.equal((await pledge(donor2, item, 1)).status, 409);
  });

  test('linking an existing donation is validated; direct quantity entry is admin-only and refused for pledges with a pickup task', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const { itemIds } = await approvedRequest(items(['Rice', 'kg', 50]));
    const item = itemIds[0];
    const donation = await donationService.createDonation(donor.user.id, validFoodDonationPayload());
    const foreign = await donationService.createDonation(donor2.user.id, validFoodDonationPayload());
    assert.equal((await pledge(donor, item, 5, { body: { donationRequestId: foreign.id } })).status, 422); // not the donor's donation
    assert.equal((await pledge(donor, item, 5, { body: { donationRequestId: 999999999 } })).status, 422);
    const p = await pledge(donor, item, 5, { body: { donationRequestId: donation.id } });
    assert.equal(p.status, 201);
    assert.equal(p.body.data.pledge.donationRequestId, donation.id);
    assert.equal((await pledge(donor2, item, 5, { body: { donationRequestId: donation.id } })).status, 422); // someone else's
    await donationService.acceptDonation(donation.id, volunteer.user.id);
    const id = p.body.data.pledge.id;
    // an assigned volunteer cannot write collected/delivered totals through the admin endpoints ...
    assert.equal((await api('POST', `/pledges/${id}/collection`, { token: volunteer.accessToken, body: { quantity: 5 } })).status, 403);
    assert.equal((await api('POST', `/pledges/${id}/delivery`, { token: volunteer.accessToken, body: { quantity: 5 } })).status, 403);
    // ... and even an admin must use the task flow when the pledge has a pickup task
    const direct = await api('POST', `/pledges/${id}/collection`, { token: admin.accessToken, body: { quantity: 5 } });
    assert.equal(direct.status, 409);
    assert.equal(direct.body.code, 'USE_TASK_FLOW');
    const [[d]] = await pool.query('SELECT status, volunteer_id FROM donation_requests WHERE id = ?', [donation.id]);
    assert.equal(d.status, 'accepted'); // the existing donation record was not modified by the pledge
    assert.equal(d.volunteer_id, volunteer.user.id);
  });

  test('cancelling a request releases plain pledges but is blocked while goods are in transit', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const a = await approvedRequest(items(['Rice', 'kg', 10]));
    const pa = (await pledge(donor, a.itemIds[0], 5)).body.data.pledge;
    assert.equal((await api('PATCH', `/requests/${a.requestId}/status`, { token: admin.accessToken, body: { status: 'cancelled' } })).status, 422); // reason required
    const c = await api('PATCH', `/requests/${a.requestId}/status`, { token: admin.accessToken, body: { status: 'cancelled', notes: 'duplicate request' } });
    assert.equal(c.status, 200);
    assert.equal((await api('GET', `/pledges/${pa.id}`, { token: donor.accessToken })).body.data.pledge.status, 'cancelled');
    assert.equal((await pledge(donor2, a.itemIds[0], 1)).status, 409);

    const b = await approvedRequest(items(['Rice', 'kg', 10]));
    const pb = (await pledge(donor, b.itemIds[0], 5)).body.data.pledge;
    await api('POST', `/pledges/${pb.id}/collection`, { token: admin.accessToken, body: { quantity: 2 } });
    const blocked = await api('PATCH', `/requests/${b.requestId}/status`, { token: admin.accessToken, body: { status: 'cancelled', notes: 'oops' } });
    assert.equal(blocked.status, 409);
    assert.equal(blocked.body.code, 'PLEDGES_IN_TRANSIT');
    // admin can cancel the collected pledge (nothing delivered), then the request
    assert.equal((await api('POST', `/pledges/${pb.id}/cancel`, { token: admin.accessToken, body: { reason: 'returned to donor' } })).status, 200);
    assert.equal((await api('PATCH', `/requests/${b.requestId}/status`, { token: admin.accessToken, body: { status: 'cancelled', notes: 'ok now' } })).status, 200);
    // expired requests do not accept pledges
    const e = await approvedRequest(items(['Rice', 'kg', 10]));
    await pool.query('UPDATE relief_requests SET expires_at = DATE_SUB(NOW(), INTERVAL 1 HOUR) WHERE id = ?', [e.requestId]);
    const exp = await pledge(donor, e.itemIds[0], 1);
    assert.equal(exp.status, 409);
    assert.equal(exp.body.code, 'REQUEST_EXPIRED');
  });

  test('pledging stops when the incident is resolved', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const r = await approvedRequest(items(['Rice', 'kg', 10]));
    await api('PATCH', `/incidents/${r.incidentId}/status`, { token: admin.accessToken, body: { status: 'resolved' } });
    const x = await pledge(donor, r.itemIds[0], 1);
    assert.equal(x.status, 409);
    assert.equal(x.body.code, 'INCIDENT_NOT_OPEN');
  });

  // -------------------------------------------------------------- concurrency
  test('CONCURRENCY: 8 donors race for the same item — total committed never exceeds the requirement', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const racers = await Promise.all(Array.from({ length: 8 }, () => createVerifiedUser({ role: 'donor' })));
    for (let round = 0; round < 2; round += 1) {
      const { requestId, itemIds } = await approvedRequest(items(['Rice', 'piece', 20]));
      const item = itemIds[0];
      // 8 x 3 = 24 requested against 20 available: at most 6 may succeed
      const results = await Promise.allSettled(racers.map((u) => pledgeService.createPledge(u.user, item, { quantity: 3 })));
      const won = results.filter((r) => r.status === 'fulfilled');
      const lost = results.filter((r) => r.status === 'rejected');
      assert.equal(won.length, 6, `round ${round}: expected exactly 6 winners, got ${won.length}`);
      assert.equal(lost.length, 2);
      lost.forEach((l) => assert.equal(l.reason.code, 'OVER_PLEDGE'));
      const q = await itemQ(requestId, item);
      assert.equal(q.activePledged, 18);
      assert.equal(q.remainingToPledge, 2);
      const [[{ s }]] = await pool.query("SELECT SUM(quantity_pledged) s FROM relief_pledges WHERE relief_request_item_id = ? AND status = 'pledged'", [item]);
      assert.equal(Number(s), 18);
    }
  });

  test('CONCURRENCY: exact fit — many donors, last unit goes to exactly one', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const racers = await Promise.all(Array.from({ length: 6 }, () => createVerifiedUser({ role: 'donor' })));
    const { requestId, itemIds } = await approvedRequest(items(['Water', 'liter', 1, 'drinking_water']));
    const results = await Promise.allSettled(racers.map((u) => pledgeService.createPledge(u.user, itemIds[0], { quantity: 1 })));
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    const q = await itemQ(requestId, itemIds[0]);
    assert.equal(q.remainingToPledge, 0);
    assert.ok(q.remainingToPledge >= 0 && q.committed <= q.requested);
  });

  test('CONCURRENCY: the same donor firing parallel pledges creates exactly one open pledge', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const { itemIds } = await approvedRequest(items(['Rice', 'kg', 100]));
    const results = await Promise.allSettled(Array.from({ length: 6 }, () => pledgeService.createPledge(donor.user, itemIds[0], { quantity: 5 })));
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    results.filter((r) => r.status === 'rejected').forEach((r) => assert.equal(r.reason.code, 'DUPLICATE_PLEDGE'));
    const [[{ n }]] = await pool.query("SELECT COUNT(*) n FROM relief_pledges WHERE relief_request_item_id = ? AND donor_id = ? AND status IN ('pledged','collected')", [itemIds[0], donor.user.id]);
    assert.equal(Number(n), 1);
  });

  test('CONCURRENCY: repeated submissions with the same Idempotency-Key create one pledge and all return it', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const { itemIds } = await approvedRequest(items(['Rice', 'kg', 100]));
    const key = `idem-${Date.now()}-parallel`;
    const results = await Promise.all(Array.from({ length: 6 }, () => pledgeService.createPledge(donor.user, itemIds[0], { quantity: 5 }, { idempotencyKey: key })));
    const ids = new Set(results.map((r) => r.pledge.id));
    assert.equal(ids.size, 1);
    assert.equal(results.filter((r) => !r.idempotentReplay).length, 1);
    const [[{ n }]] = await pool.query('SELECT COUNT(*) n FROM relief_pledges WHERE relief_request_item_id = ?', [itemIds[0]]);
    assert.equal(Number(n), 1);
  });

  test('CONCURRENCY: pledges racing an item quantity reduction never leave committed above requested', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const racers = await Promise.all(Array.from({ length: 5 }, () => createVerifiedUser({ role: 'donor' })));
    const { requestId, itemIds } = await approvedRequest(items(['Rice', 'piece', 20]));
    const item = itemIds[0];
    const adminUser = admin.user;
    const requestSvc = require('../../services/reliefRequest.service');
    const results = await Promise.allSettled([
      ...racers.map((u) => pledgeService.createPledge(u.user, item, { quantity: 4 })),
      requestSvc.updateItem(requestId, item, adminUser, { quantity: 10 }),
    ]);
    const q = await itemQ(requestId, item);
    assert.ok(q.committed <= q.requested, `committed ${q.committed} must not exceed requested ${q.requested}`);
    assert.ok(q.remainingToPledge >= 0);
    assert.ok(results.length === 6);
  });

  test('CONCURRENCY: simultaneous cancel + new pledge keep totals consistent with the pledge rows', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const racers = await Promise.all(Array.from({ length: 4 }, () => createVerifiedUser({ role: 'donor' })));
    const { requestId, itemIds } = await approvedRequest(items(['Rice', 'piece', 8]));
    const item = itemIds[0];
    const first = await pledgeService.createPledge(racers[0].user, item, { quantity: 8 });
    await Promise.allSettled([
      pledgeService.cancelPledge(racers[0].user, first.pledge.id, {}),
      ...racers.slice(1).map((u) => pledgeService.createPledge(u.user, item, { quantity: 4 })),
    ]);
    const q = await itemQ(requestId, item);
    const [[{ s }]] = await pool.query("SELECT COALESCE(SUM(quantity_pledged),0) s FROM relief_pledges WHERE relief_request_item_id = ? AND status = 'pledged'", [item]);
    assert.equal(q.activePledged, Number(s));
    assert.ok(q.committed <= 8 && q.remainingToPledge >= 0);
  });

  // -------------------------------------------------------------------- audit
  test('audit trail: verification, approval, quantity changes, pledges, cancellation and delivery are logged without secrets', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const { requestId, itemIds } = await approvedRequest(items(['Rice', 'kg', 10]));
    await api('PATCH', `/requests/${requestId}/items/${itemIds[0]}`, { token: admin.accessToken, body: { quantity: 12 } });
    const p = (await pledge(donor, itemIds[0], 3)).body.data.pledge;
    await api('POST', `/pledges/${p.id}/collection`, { token: admin.accessToken, body: { quantity: 3 } });
    await api('POST', `/pledges/${p.id}/delivery`, { token: admin.accessToken, body: { quantity: 3 } });
    const p2 = (await pledge(donor2, itemIds[0], 2)).body.data.pledge;
    await api('POST', `/pledges/${p2.id}/cancel`, { token: donor2.accessToken, body: { reason: 'changed mind' } });
    const [rows] = await pool.query(
      "SELECT action, user_id, metadata FROM audit_logs WHERE action LIKE 'disaster_%' OR action LIKE 'relief_%' ORDER BY id DESC LIMIT 200"
    );
    const actions = new Set(rows.map((r) => r.action));
    for (const a of ['disaster_incident_reported', 'disaster_incident_status_changed', 'relief_request_created', 'relief_request_status_changed',
      'relief_item_updated', 'relief_pledge_created', 'relief_pledge_collected', 'relief_pledge_delivered', 'relief_pledge_cancelled']) {
      assert.ok(actions.has(a), `missing audit action ${a}`);
    }
    const upd = rows.find((r) => r.action === 'relief_item_updated');
    const meta = JSON.parse(upd.metadata);
    assert.equal(meta.before.quantityRequested, 10);
    assert.equal(meta.after.quantity_requested, '12.000');
    assert.equal(upd.user_id, admin.user.id);
    const blob = JSON.stringify(rows).toLowerCase();
    for (const secret of ['password', 'token', 'authorization', 'secret']) assert.ok(!blob.includes(secret), `audit data must not contain "${secret}"`);
  });

  test('error responses never expose stack traces or internals (production error handling)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    // The shared errorHandler intentionally adds the stack in NODE_ENV=development (which this suite
    // requires for email-verification tokens). Exercise it in production mode for the duration of these requests.
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const r = await api('GET', '/incidents/abc');
      assert.equal(r.status, 422);
      const n = await api('GET', '/pledges/999999999', { token: admin.accessToken });
      assert.equal(n.status, 404);
      for (const res of [r, n]) {
        const text = JSON.stringify(res.body);
        assert.ok(!/node_modules|stack|at \w+ \(|ER_|sql/i.test(text), text);
      }
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});
