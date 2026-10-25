const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

const { pool, isDbAvailable, createVerifiedUser, cleanupTestData, setVolunteerLocation } = require('./setup');

/**
 * Disaster relief Phase 5 — admin operations dashboard & relief coordination. Real Express app over
 * HTTP and a real database. Dashboard numbers are always compared with independent SQL.
 */
describe('admin disaster operations: dashboard, incident management, coordination, delivery correction', () => {
  let dbReady = false;
  let server;
  let origin;
  let dispatcher;
  let admin; let vol1; let vol2; let farVol; let noBaseVol; let donorA; let donorB; let reporter;
  const incidentIds = [];

  async function call(prefix, method, path, { token, body, raw } = {}) {
    const res = await fetch(`${origin}${prefix}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (raw) return { status: res.status, headers: res.headers, text: await res.text() };
    return { status: res.status, body: await res.json().catch(() => null) };
  }
  const relief = (m, p, o) => call('/api/v1/relief', m, p, o);
  const ops = (m, p, o) => call('/api/v1/admin/ops', m, p, o);
  const alerts = (m, p, o) => call('/api/v1/alerts', m, p, o);
  const as = (u) => ({ token: u.accessToken });
  const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const pickup = () => ({
    pickupDate: tomorrow(), pickupTimeSlot: 'morning', contactPhone: '+8801711111111', additionalNotes: 'Ring twice',
    pickupAddress: { fullAddress: 'House 5, Road 3, Gulshan, Dhaka', area: 'Gulshan', district: 'Dhaka', latitude: 23.81, longitude: 90.41, contactPersonName: 'Donor Contact' },
  });

  async function newIncident(o = {}) {
    const inc = await relief('POST', '/incidents', { ...as(admin), body: { title: 'Ops scenario flood', disasterType: 'flood', district: 'Sylhet', severity: 'moderate', latitude: 24.9, longitude: 91.8, ...o } });
    assert.equal(inc.status, 201, JSON.stringify(inc.body));
    const id = inc.body.data.incident.id;
    incidentIds.push(id);
    return id;
  }
  async function verify(id) {
    await relief('PATCH', `/incidents/${id}/status`, { ...as(admin), body: { status: 'under_review' } });
    const v = await relief('PATCH', `/incidents/${id}/status`, { ...as(admin), body: { status: 'verified', notes: 'confirmed' } });
    assert.equal(v.status, 200, JSON.stringify(v.body));
    await dispatcher.drain();
  }
  async function scenario({ requested = 100, unit = 'packet', name = 'Dry food', category = 'dry_food', incidentOpts = {} } = {}) {
    const incidentId = await newIncident(incidentOpts);
    await verify(incidentId);
    const rq = await relief('POST', `/incidents/${incidentId}/requests`, {
      ...as(admin),
      body: { title: 'Shelter supplies', locationName: 'Govt School Shelter', address: 'PRIVATE Dropoff Road 9', deliveryInstructions: 'Ask the manager', items: [{ name, category, unit, quantity: requested }] },
    });
    assert.equal(rq.status, 201, JSON.stringify(rq.body));
    const requestId = rq.body.data.request.id;
    assert.equal((await relief('PATCH', `/requests/${requestId}/status`, { ...as(admin), body: { status: 'approved' } })).status, 200);
    const full = await relief('GET', `/requests/${requestId}`, as(admin));
    return { incidentId, requestId, itemId: full.body.data.request.items[0].id };
  }
  async function pledged(quantity = 40, opts = {}) {
    const sc = await scenario(opts);
    const r = await relief('POST', `/items/${sc.itemId}/pledges`, { ...as(donorA), body: { quantity, pickup: pickup() } });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    return { ...sc, pledgeId: r.body.data.pledge.id, donationId: r.body.data.pledge.donationRequestId };
  }
  async function viaPickup(volunteer, p, quantity) {
    assert.equal((await relief('POST', `/tasks/${p.pledgeId}/pickup`, { ...as(volunteer), body: { quantity } })).status, 200);
  }
  async function accepted(p, volunteer = vol1) {
    assert.equal((await relief('POST', `/tasks/${p.pledgeId}/accept`, as(volunteer))).status, 200);
    assert.equal((await relief('POST', `/tasks/${p.pledgeId}/schedule`, { ...as(volunteer), body: { scheduledAt: new Date(Date.now() + 7200000).toISOString() } })).status, 200);
    assert.equal((await relief('POST', `/tasks/${p.pledgeId}/on-the-way`, as(volunteer))).status, 200);
  }
  /** pledge -> accepted -> picked up -> delivery reported -> admin verified; returns the report id */
  async function delivered(quantity, { verifiedQuantity, reported = quantity } = {}) {
    const p = await pledged(quantity);
    await accepted(p);
    await viaPickup(vol1, p, quantity);
    assert.equal((await relief('POST', `/tasks/${p.pledgeId}/delivery`, { ...as(vol1), body: { quantity: reported } })).status, 200);
    const queue = await relief('GET', '/admin/reports?limit=200', as(admin));
    const report = queue.body.data.reports.find((r) => r.pledgeId === p.pledgeId && r.status === 'pending');
    const body = verifiedQuantity === undefined ? {} : { verifiedQuantity, notes: 'Counted on arrival' };
    const ver = await relief('POST', `/admin/reports/${report.id}/verify`, { ...as(admin), body });
    assert.equal(ver.status, 200, JSON.stringify(ver.body));
    return { ...p, reportId: report.id };
  }
  const summary = async (requestId, itemId) => (await relief('GET', `/requests/${requestId}/summary`, as(admin))).body.data.summary.items.find((i) => i.id === itemId).quantities;
  const dash = async (incidentId, extra = '') => (await ops('GET', `/dashboard?incidentId=${incidentId}${extra}`, as(admin))).body.data;

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;
    const app = require('../../app');
    dispatcher = require('../../services/alertDispatcher.service');
    server = http.createServer(app);
    await new Promise((r) => server.listen(0, r));
    origin = `http://127.0.0.1:${server.address().port}`;
    [admin, vol1, vol2, farVol, noBaseVol, donorA, donorB, reporter] = await Promise.all([
      createVerifiedUser({ role: 'admin' }), createVerifiedUser({ role: 'volunteer' }), createVerifiedUser({ role: 'volunteer' }),
      createVerifiedUser({ role: 'volunteer' }), createVerifiedUser({ role: 'volunteer' }),
      createVerifiedUser({ role: 'donor' }), createVerifiedUser({ role: 'donor' }), createVerifiedUser({ role: 'donor' }),
    ]);
    await pool.query('UPDATE volunteer_profiles SET latitude = NULL, longitude = NULL, coverage_radius = NULL, base_address = NULL WHERE user_id = ?', [noBaseVol.user.id]);
    await setVolunteerLocation(vol1.user.id);
    await setVolunteerLocation(vol2.user.id);
    await setVolunteerLocation(farVol.user.id, { latitude: 22.3569, longitude: 91.7832 });
  });

  after(async () => {
    if (!dbReady) return;
    await dispatcher.drain();
    if (server.closeAllConnections) server.closeAllConnections();
    await new Promise((r) => server.close(r));
    if (incidentIds.length) {
      await pool.query('DELETE p FROM relief_pledges p JOIN relief_request_items i ON i.id = p.relief_request_item_id JOIN relief_requests r ON r.id = i.relief_request_id WHERE r.incident_id IN (?)', [incidentIds]);
      await pool.query('DELETE FROM relief_requests WHERE incident_id IN (?)', [incidentIds]);
      await pool.query('UPDATE disaster_incidents SET merged_into_id = NULL WHERE id IN (?)', [incidentIds]);
      await pool.query('DELETE FROM disaster_incidents WHERE id IN (?)', [incidentIds]);
    }
    await cleanupTestData();
  });

  // ------------------------------------------------------------------ permissions
  test('every operations endpoint is admin-only: donors, volunteers and anonymous callers are refused', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const gets = ['/dashboard', '/incidents', '/incidents/1', '/requests', '/tasks', '/exceptions', '/volunteers', '/reports', '/export?dataset=incidents', '/requests/1/quantity-history', '/tasks/1/assignments'];
    const posts = ['/incidents/1/request-info', '/incidents/1/merge', '/incidents/1/reopen', '/requests/1/request-correction', '/requests/1/reassessment', '/tasks/1/assign', '/tasks/1/reassign', '/tasks/1/release', '/tasks/1/cancel', '/deliveries/1/correct'];
    for (const u of [donorA, vol1]) {
      for (const g of gets) assert.equal((await ops('GET', g, as(u))).status, 403, `GET ${g}`);
      for (const p of posts) assert.equal((await ops('POST', p, { ...as(u), body: { reason: 'attempt', note: 'attempt', volunteerId: 1, targetIncidentId: 2, verifiedQuantity: 1 } })).status, 403, `POST ${p}`);
      assert.equal((await ops('DELETE', '/requests/1/reassessment', as(u))).status, 403);
    }
    for (const g of gets) assert.equal((await ops('GET', g)).status, 401, `anon GET ${g}`);
    assert.equal((await ops('POST', '/tasks/1/assign', { body: {} })).status, 401);
  });

  test('filters are validated (no SQL reaches the database from a bad value)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    for (const q of ['disasterType=meteor', 'status=bogus', "district='; DROP TABLE users;--", 'division=Atlantis', 'from=2026-13-45', 'from=2026-02-01&to=2026-01-01', 'limit=1000', 'requestStatus=x']) {
      assert.equal((await ops('GET', `/dashboard?${q}`, as(admin))).status, 422, q);
    }
    assert.equal((await ops('GET', '/export?dataset=users', as(admin))).status, 422);
    assert.equal((await ops('GET', '/tasks?view=everything', as(admin))).status, 422);
  });

  // ------------------------------------------------------------------ dashboard
  test('dashboard totals equal independent SQL over the same records, and quantities never mix units', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await pledged(40, { requested: 100 });
    let d = await dash(p.incidentId);
    assert.equal(d.summary.incidents.totalReported, 1);
    assert.equal(d.summary.incidents.verifiedActive, 1);
    assert.equal(d.summary.requests.approved, 1);
    assert.equal(d.summary.requests.approvedUnfulfilled, 1);
    assert.equal(d.summary.tasks.unassigned, 1);
    assert.equal(d.summary.tasks.active, 0);
    let q = d.quantities.find((x) => x.name === 'Dry food' && x.unit === 'packet');
    assert.deepEqual([q.requested, q.pledged, q.collected, q.verifiedDelivered], [100, 40, 0, 0]);

    // independent SQL
    const [[sql]] = await pool.query(
      `SELECT i.quantity_requested AS requested, COALESCE(SUM(p.quantity_pledged - p.quantity_delivered), 0) AS pledged
         FROM relief_request_items i LEFT JOIN relief_pledges p ON p.relief_request_item_id = i.id AND p.status IN ('pledged','collected')
        WHERE i.id = ? GROUP BY i.id`, [p.itemId]);
    assert.equal(Number(sql.requested), q.requested);
    assert.equal(Number(sql.pledged), q.pledged);

    // a second item with another unit stays separate
    await relief('POST', `/requests/${p.requestId}/items`, { ...as(admin), body: { name: 'Dry food', unit: 'kg', quantity: 10, category: 'dry_food', reason: 'assessment update' } });
    d = await dash(p.incidentId);
    assert.equal(d.quantities.filter((x) => x.name === 'Dry food').length, 2);
    assert.deepEqual(d.quantities.map((x) => x.unit).sort(), ['kg', 'packet']);
  });

  test('dashboard filters (type, severity, division, district, request status, dates) narrow the same live data', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const a = await newIncident({ title: 'Filter flood Kurigram', district: 'Kurigram', disasterType: 'flood', severity: 'high' });
    const b = await newIncident({ title: 'Filter fire Dhaka', district: 'Dhaka', disasterType: 'fire', severity: 'low' });
    const count = async (q) => (await ops('GET', `/dashboard?${q}`, as(admin))).body.data.summary.incidents.totalReported;
    assert.equal(await count(`incidentId=${a}`), 1);
    assert.equal(await count(`incidentId=${a}&disasterType=fire`), 0);
    assert.equal(await count(`incidentId=${a}&division=Rangpur`), 1);
    assert.equal(await count(`incidentId=${a}&division=Dhaka`), 0);
    assert.equal(await count(`incidentId=${b}&district=Dhaka&severity=low`), 1);
    assert.equal(await count(`incidentId=${b}&severity=high`), 0);
    assert.equal(await count(`incidentId=${b}&verificationStatus=unverified`), 1);
    assert.equal(await count(`incidentId=${b}&status=reported`), 1);
    const today = new Date().toISOString().slice(0, 10);
    assert.equal(await count(`incidentId=${b}&from=${today}&to=${today}`), 1);
    assert.equal(await count(`incidentId=${b}&to=2000-01-01`), 0);
    const crit = (await ops('GET', `/dashboard?incidentId=${a}`, as(admin))).body.data.summary.incidents;
    assert.equal(crit.awaitingVerification, 1);
    assert.equal(crit.criticalOrHigh, 1);
    const lim = (await ops('GET', `/dashboard?incidentId=${a}`, as(admin))).body.data.limitations.join(' ');
    assert.match(lim, /[Uu]pazila/);
  });

  // ------------------------------------------------------------------ incident management
  test('incident review: verify/reject keep a history; rejection needs a reason; request-info; reopen needs justification', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const id = await newIncident({ title: 'Review me' });
    assert.equal((await ops('POST', `/incidents/${id}/request-info`, { ...as(admin), body: { note: 'x' } })).status, 422);
    assert.equal((await ops('POST', `/incidents/${id}/request-info`, { ...as(admin), body: { note: 'Please add the affected village name' } })).status, 200);
    assert.equal((await relief('PATCH', `/incidents/${id}/status`, { ...as(admin), body: { status: 'rejected' } })).status, 422);
    assert.equal((await relief('PATCH', `/incidents/${id}/status`, { ...as(admin), body: { status: 'rejected', notes: 'Duplicate media rumour' } })).status, 200);
    assert.equal((await ops('POST', `/incidents/${id}/reopen`, { ...as(admin), body: { reason: 'no' } })).status, 422);
    assert.equal((await ops('POST', `/incidents/${id}/reopen`, { ...as(admin), body: { reason: 'New evidence supplied by the district office' } })).status, 200);
    await verify(id);
    assert.equal((await relief('PATCH', `/incidents/${id}/status`, { ...as(admin), body: { status: 'resolved' } })).status, 200);
    assert.equal((await ops('POST', `/incidents/${id}/reopen`, { ...as(admin), body: { reason: 'Water levels rose again overnight' } })).status, 200);
    const detail = (await ops('GET', `/incidents/${id}`, as(admin))).body.data;
    const actions = detail.history.map((h) => h.action).reverse();
    assert.deepEqual(actions, ['info_requested', 'rejected', 'status_change', 'verified', 'resolved', 'reopened']);
    assert.ok(detail.history.every((h) => h.actorName));
    assert.equal(detail.incident.status, 'active');
    assert.equal((await ops('POST', `/incidents/${id}/request-info`, { ...as(admin), body: { note: 'Too late to ask now' } })).status, 409);
  });

  test('admin corrections to incident data are recorded with before/after values and a reason', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const id = await newIncident({ title: 'Correction target', severity: 'moderate', district: 'Sylhet' });
    const r = await relief('PATCH', `/incidents/${id}`, { ...as(admin), body: { severity: 'high', affectedArea: 'Companiganj', reason: 'Upazila assessment received' } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const h = (await ops('GET', `/incidents/${id}`, as(admin))).body.data.history.find((x) => x.action === 'corrected');
    assert.equal(h.reason, 'Upazila assessment received');
    assert.equal(h.details.before.severity, 'moderate');
    assert.equal(h.details.after.severity, 'high');
  });

  test('merging duplicates keeps every related record: requests move, pledges/tasks survive, the duplicate row stays', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const survivor = await newIncident({ title: 'Main flood', severity: 'moderate' });
    await verify(survivor);
    const dup = await pledged(30); // verified duplicate with a request, an approved item and a pledge+task
    const alertRes = await alerts('POST', '/', { ...as(admin), body: { incidentId: dup.incidentId, scope: 'local', severity: 'moderate' } });
    assert.equal(alertRes.status, 201, JSON.stringify(alertRes.body));
    await dispatcher.drain();

    assert.equal((await ops('POST', `/incidents/${dup.incidentId}/merge`, { ...as(admin), body: { targetIncidentId: dup.incidentId, reason: 'same event' } })).status, 422);
    assert.equal((await ops('POST', `/incidents/${dup.incidentId}/merge`, { ...as(admin), body: { targetIncidentId: survivor } })).status, 422); // reason required
    const bad = await newIncident({ title: 'Unverified target' });
    assert.equal((await ops('POST', `/incidents/${dup.incidentId}/merge`, { ...as(admin), body: { targetIncidentId: bad, reason: 'same event' } })).status, 409); // verified -> unverified blocked

    const m = await ops('POST', `/incidents/${dup.incidentId}/merge`, { ...as(admin), body: { targetIncidentId: survivor, reason: 'Same flood reported twice' } });
    assert.equal(m.status, 200, JSON.stringify(m.body));
    await dispatcher.drain();
    assert.deepEqual(m.body.data.movedRequestIds, [dup.requestId]);

    const [[req]] = await pool.query('SELECT incident_id FROM relief_requests WHERE id = ?', [dup.requestId]);
    assert.equal(req.incident_id, survivor);
    const [[pl]] = await pool.query('SELECT status, donation_request_id FROM relief_pledges WHERE id = ?', [dup.pledgeId]);
    assert.equal(pl.status, 'pledged');
    assert.equal(pl.donation_request_id, dup.donationId);
    const [[row]] = await pool.query('SELECT status, merged_into_id FROM disaster_incidents WHERE id = ?', [dup.incidentId]);
    assert.deepEqual([row.status, row.merged_into_id], ['merged', survivor]);
    const [[alert]] = await pool.query('SELECT status FROM disaster_alerts WHERE incident_id = ?', [dup.incidentId]);
    assert.equal(alert.status, 'cancelled', 'live alert of the duplicate is withdrawn through the Phase 4 hook');

    // the moved request still works end-to-end on the surviving incident
    assert.equal((await relief('POST', `/tasks/${dup.pledgeId}/accept`, as(vol1))).status, 200);
    assert.equal((await ops('POST', `/incidents/${dup.incidentId}/merge`, { ...as(admin), body: { targetIncidentId: survivor, reason: 'again' } })).status, 409);

    const detail = (await ops('GET', `/incidents/${survivor}`, as(admin))).body.data;
    assert.equal(detail.mergedFrom[0].id, dup.incidentId);
    assert.ok(detail.requests.some((r) => r.id === dup.requestId));
    assert.ok(detail.history.some((h) => h.action === 'merged_from'));
    const dupHistory = (await ops('GET', `/incidents/${dup.incidentId}`, as(admin))).body.data.history;
    assert.ok(dupHistory.some((h) => h.action === 'merged_into'));

    // dashboards ignore merged duplicates; the dedicated filter still finds them
    assert.equal((await dash(dup.incidentId)).summary.incidents.totalReported, 0);
    assert.equal((await dash(dup.incidentId, '&status=merged')).summary.incidents.totalReported, 1);
    // publicly hidden
    assert.equal((await relief('GET', `/incidents/${dup.incidentId}`, as(donorB))).status, 404);
  });

  // ------------------------------------------------------------------ relief request review
  test('relief request review: corrections, reassessment flags, reasons for approved quantity changes, history', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const incidentId = await newIncident({ title: 'Request review' });
    await verify(incidentId);
    const rq = await relief('POST', `/incidents/${incidentId}/requests`, {
      ...as(vol1), body: { title: 'Needs review', locationName: 'Shelter A', items: [{ name: 'Blanket', unit: 'piece', quantity: 50, category: 'blanket' }] },
    });
    const requestId = rq.body.data.request.id;
    assert.equal((await ops('POST', `/requests/${requestId}/request-correction`, { ...as(admin), body: { note: 'x' } })).status, 422);
    assert.equal((await ops('POST', `/requests/${requestId}/request-correction`, { ...as(admin), body: { note: 'Please give the shelter head count' } })).status, 200);
    let list = (await ops('GET', `/requests?incidentId=${incidentId}`, as(admin))).body.data.requests;
    assert.equal(list[0].correctionNote, 'Please give the shelter head count');
    assert.equal((await dash(incidentId)).summary.requests.awaitingCorrection, 1);
    assert.equal((await relief('PATCH', `/requests/${requestId}`, { ...as(vol1), body: { description: 'Shelter holds 200 people' } })).status, 200);
    list = (await ops('GET', `/requests?incidentId=${incidentId}`, as(admin))).body.data.requests;
    assert.equal(list[0].correctionRequestedAt, null, 'the requester resubmitting clears the correction request');

    assert.equal((await relief('PATCH', `/requests/${requestId}/status`, { ...as(admin), body: { status: 'approved' } })).status, 200);
    const item = (await relief('GET', `/requests/${requestId}`, as(admin))).body.data.request.items[0];
    // approved quantity change needs a reason and is kept in the history
    assert.equal((await relief('PATCH', `/requests/${requestId}/items/${item.id}`, { ...as(admin), body: { quantity: 80 } })).status, 422);
    assert.equal((await relief('PATCH', `/requests/${requestId}/items/${item.id}`, { ...as(admin), body: { quantity: 80, reason: 'Head count verified at 200' } })).status, 200);
    const hist = (await ops('GET', `/requests/${requestId}/quantity-history`, as(admin))).body.data.history;
    const change = hist.find((h) => h.changeType === 'quantity_changed');
    assert.deepEqual([change.oldQuantity, change.newQuantity, change.reason, change.requestStatus], [50, 80, 'Head count verified at 200', 'approved']);
    assert.ok(hist.some((h) => h.changeType === 'added' && h.newQuantity === 50), 'the original quantity was recorded when the item was created');

    // reassessment: manual flag, then computed once the incident is resolved
    assert.equal((await ops('POST', `/requests/${requestId}/reassessment`, { ...as(admin), body: { reason: 'Flood waters receding' } })).status, 200);
    assert.equal((await ops('DELETE', `/requests/${requestId}/reassessment`, as(admin))).status, 200);
    assert.equal((await ops('DELETE', `/requests/${requestId}/reassessment`, as(admin))).status, 409);
    assert.equal((await ops('GET', `/requests?incidentId=${incidentId}&needsReassessment=true`, as(admin))).body.data.requests.length, 0);
    await relief('PATCH', `/incidents/${incidentId}/status`, { ...as(admin), body: { status: 'resolved' } });
    const flagged = (await ops('GET', `/requests?incidentId=${incidentId}&needsReassessment=true`, as(admin))).body.data.requests;
    assert.equal(flagged.length, 1);
    assert.equal(flagged[0].reassessment[0].code, 'incident_closed');
  });

  // ------------------------------------------------------------------ volunteers & tasks
  test('volunteer assignment: eligibility, assign, reassign, release, cancel — all with reasons, history and audit', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await pledged(40);
    const vols = (await ops('GET', `/volunteers?pledgeId=${p.pledgeId}&limit=100`, as(admin))).body.data.volunteers;
    const byId = (u) => vols.find((v) => v.id === u.user.id);
    assert.equal(byId(vol1).eligible, true);
    assert.equal(byId(farVol).eligible, false);
    assert.match(byId(farVol).ineligibleReason, /coverage radius/);
    assert.equal(byId(noBaseVol).eligible, false);
    assert.equal(Object.keys(byId(vol1)).some((k) => /phone|email|address/i.test(k)), false);

    const assign = (u, reason = 'Closest available volunteer') => ops('POST', `/tasks/${p.pledgeId}/assign`, { ...as(admin), body: { volunteerId: u.user.id, reason } });
    assert.equal((await assign(vol1, 'x')).status, 422);
    assert.equal((await assign(farVol)).status, 403); // existing radius rule
    assert.equal((await assign(noBaseVol)).status, 403);
    assert.equal((await ops('POST', `/tasks/${p.pledgeId}/assign`, { ...as(admin), body: { volunteerId: donorB.user.id, reason: 'not a volunteer' } })).status, 422);
    assert.equal((await assign(vol1)).status, 200);
    assert.equal((await assign(vol2)).status, 409, 'an assigned task needs reassign, not assign');
    const [[d1]] = await pool.query('SELECT status, volunteer_id FROM donation_requests WHERE id = ?', [p.donationId]);
    assert.deepEqual([d1.status, d1.volunteer_id], ['accepted', vol1.user.id]);

    assert.equal((await ops('POST', `/tasks/${p.pledgeId}/reassign`, { ...as(admin), body: { volunteerId: vol1.user.id, reason: 'same person again' } })).status, 422);
    assert.equal((await ops('POST', `/tasks/${p.pledgeId}/reassign`, { ...as(admin), body: { volunteerId: farVol.user.id, reason: 'Vol 1 unavailable' } })).status, 403);
    const [[still]] = await pool.query('SELECT volunteer_id FROM donation_requests WHERE id = ?', [p.donationId]);
    assert.equal(still.volunteer_id, vol1.user.id, 'an ineligible target is rejected BEFORE the current volunteer is released');
    assert.equal((await ops('POST', `/tasks/${p.pledgeId}/reassign`, { ...as(admin), body: { volunteerId: vol2.user.id, reason: 'Vol 1 is unavailable' } })).status, 200);
    const [[d2]] = await pool.query('SELECT status, volunteer_id FROM donation_requests WHERE id = ?', [p.donationId]);
    assert.equal(d2.volunteer_id, vol2.user.id);

    // workload is visible
    const w = (await ops('GET', '/volunteers?limit=100', as(admin))).body.data.volunteers.find((v) => v.id === vol2.user.id);
    assert.ok(w.activeTasks >= 1);

    assert.equal((await ops('POST', `/tasks/${p.pledgeId}/release`, { ...as(admin), body: { reason: '' } })).status, 422);
    assert.equal((await ops('POST', `/tasks/${p.pledgeId}/release`, { ...as(admin), body: { reason: 'Volunteer fell ill' } })).status, 200);
    assert.equal((await dash(p.incidentId)).summary.tasks.unassigned, 1);
    assert.equal((await assign(vol1)).status, 200);

    // once the goods are picked up the volunteer can no longer be swapped
    await relief('POST', `/tasks/${p.pledgeId}/schedule`, { ...as(vol1), body: { scheduledAt: new Date(Date.now() + 7200000).toISOString() } });
    await relief('POST', `/tasks/${p.pledgeId}/on-the-way`, as(vol1));
    await viaPickup(vol1, p, 40);
    assert.equal((await ops('POST', `/tasks/${p.pledgeId}/reassign`, { ...as(admin), body: { volunteerId: vol2.user.id, reason: 'Too late to swap' } })).status, 409);

    const hist = (await ops('GET', `/tasks/${p.pledgeId}/assignments`, as(admin))).body.data.history.map((h) => h.action).reverse();
    assert.deepEqual(hist, ['assigned', 'reassigned', 'released', 'assigned']);

    const [audit] = await pool.query("SELECT action FROM audit_logs WHERE user_id = ? AND action LIKE 'ops_task_%'", [admin.user.id]);
    ['ops_task_assigned', 'ops_task_reassigned', 'ops_task_released'].forEach((a) => assert.ok(audit.some((r) => r.action === a), a));

    // cancel (nothing verified delivered yet) with a reason
    const c = await pledged(10);
    assert.equal((await ops('POST', `/tasks/${c.pledgeId}/cancel`, { ...as(admin), body: { reason: 'Donor withdrew the goods' } })).status, 200);
    assert.equal((await ops('GET', `/tasks/${c.pledgeId}/assignments`, as(admin))).body.data.history[0].action, 'cancelled');
    assert.equal((await ops('POST', `/tasks/${c.pledgeId}/cancel`, { ...as(admin), body: { reason: 'again' } })).status, 409);
  });

  test('task views: unassigned and delayed tasks are found from real timestamps', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await pledged(20);
    const view = async (v) => (await ops('GET', `/tasks?view=${v}&incidentId=${p.incidentId}`, as(admin))).body.data.tasks;
    assert.equal((await view('unassigned')).length, 1);
    assert.equal((await view('delayed')).length, 0);
    await pool.query('UPDATE relief_pledges SET created_at = NOW() - INTERVAL 3 DAY WHERE id = ?', [p.pledgeId]);
    const delayed = await view('delayed');
    assert.equal(delayed.length, 1, 'an unassigned task older than the threshold is delayed');
    assert.equal(delayed[0].unassigned, true);
    await accepted(p);
    assert.equal((await view('unassigned')).length, 0);
    assert.equal((await view('active')).length, 1);
    await pool.query('UPDATE donation_status_history SET changed_at = NOW() - INTERVAL 3 DAY WHERE donation_request_id = ?', [p.donationId]);
    assert.equal((await view('delayed')).length, 1);
    assert.equal((await dash(p.incidentId)).summary.tasks.delayed, 1);
  });

  // ------------------------------------------------------------------ delivery verification & correction
  test('delivery correction adjusts totals by the difference: no double counting, request state stays consistent', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await delivered(100, { requested: 100 });
    let q = await summary(p.requestId, p.itemId);
    assert.equal(q.delivered, 100);
    assert.equal((await relief('GET', `/requests/${p.requestId}`, as(admin))).body.data.request.status, 'completed');

    const correct = (verifiedQuantity, reason = 'Recount at the shelter') => ops('POST', `/deliveries/${p.reportId}/correct`, { ...as(admin), body: { verifiedQuantity, reason } });
    assert.equal((await correct(80, 'x')).status, 422);
    assert.equal((await correct(120)).status, 422, 'cannot exceed what the volunteer reported');
    assert.equal((await correct(100)).status, 422, 'no change');
    const c1 = await correct(80);
    assert.equal(c1.status, 200, JSON.stringify(c1.body));
    assert.equal(c1.body.data.pledgeStatus, 'partially_fulfilled');
    assert.equal(c1.body.data.requestStatus, 'approved', 'a completed request is reopened when it is no longer fully delivered');
    q = await summary(p.requestId, p.itemId);
    assert.equal(q.delivered, 80);
    assert.equal(q.remainingUnfulfilled, 20);
    const [[pl]] = await pool.query('SELECT quantity_delivered, quantity_collected FROM relief_pledges WHERE id = ?', [p.pledgeId]);
    assert.deepEqual([Number(pl.quantity_delivered), Number(pl.quantity_collected)], [80, 100]);

    assert.equal((await correct(80)).status, 422);
    const c2 = await correct(100, 'Shelter manager supplied the missing packets');
    assert.equal(c2.body.data.pledgeStatus, 'delivered');
    assert.equal(c2.body.data.requestStatus, 'completed');
    q = await summary(p.requestId, p.itemId);
    assert.equal(q.delivered, 100, 'back to the original total — never 180');
    assert.equal((await dash(p.incidentId)).quantities[0].verifiedDelivered, 100);

    const [corr] = await pool.query('SELECT old_verified, new_verified FROM relief_delivery_corrections WHERE report_id = ? ORDER BY id', [p.reportId]);
    assert.deepEqual(corr.map((c) => [Number(c.old_verified), Number(c.new_verified)]), [[100, 80], [80, 100]]);
    const [[a]] = await pool.query("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'ops_delivery_corrected' AND user_id = ?", [admin.user.id]);
    assert.ok(a.n >= 2);
    // an unverified / non-delivery report cannot be "corrected"
    assert.equal((await ops('POST', '/deliveries/999999999/correct', { ...as(admin), body: { verifiedQuantity: 1, reason: 'does not exist' } })).status, 404);
  });

  test('concurrent corrections queue behind the same locks and never double count', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await delivered(60, { requested: 60 });
    const results = await Promise.all([50, 40, 30, 20].map((n) => ops('POST', `/deliveries/${p.reportId}/correct`, { ...as(admin), body: { verifiedQuantity: n, reason: `Parallel recount ${n}` } })));
    assert.ok(results.every((r) => [200, 422].includes(r.status)), results.map((r) => r.status).join());
    const [[pl]] = await pool.query('SELECT quantity_delivered FROM relief_pledges WHERE id = ?', [p.pledgeId]);
    const [[rep]] = await pool.query('SELECT verified_quantity FROM relief_pledge_reports WHERE id = ?', [p.reportId]);
    assert.equal(Number(pl.quantity_delivered), Number(rep.verified_quantity), 'pledge total always equals the one verified delivery');
    const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM relief_delivery_corrections WHERE report_id = ?', [p.reportId]);
    assert.equal(n, results.filter((r) => r.status === 200).length);
  });

  test('exceptions list shows partial verification as a discrepancy and pending reports as awaiting verification; volunteer-reported is never verified automatically', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const d = await delivered(50, { verifiedQuantity: 45, reported: 50 });
    const p2 = await pledged(30);
    await accepted(p2);
    await viaPickup(vol1, p2, 30);
    assert.equal((await relief('POST', `/tasks/${p2.pledgeId}/delivery`, { ...as(vol1), body: { quantity: 30 } })).status, 200);
    let q = await summary(p2.requestId, p2.itemId);
    assert.equal(q.delivered, 0, 'reported delivery is not verified delivery');
    assert.equal(q.pendingVerification, 30);

    const disc = (await ops('GET', `/exceptions?type=discrepancy&incidentId=${d.incidentId}`, as(admin))).body.data.exceptions;
    assert.equal(disc.length, 1);
    assert.deepEqual([disc[0].reportedQuantity, disc[0].verifiedQuantity], [50, 45]);
    const pending = (await ops('GET', `/exceptions?type=pending_verification&incidentId=${p2.incidentId}`, as(admin))).body.data.exceptions;
    assert.equal(pending.length, 1);
    assert.equal(pending[0].verifiedQuantity, null);
    assert.equal((await dash(p2.incidentId)).summary.deliveryIssues.pendingVerification, 1);
    assert.equal((await dash(d.incidentId)).summary.deliveryIssues.discrepancies, 1);

    // a volunteer problem report appears as an open issue
    const p3 = await pledged(10);
    await accepted(p3);
    assert.equal((await relief('POST', `/tasks/${p3.pledgeId}/problem`, { ...as(vol1), body: { notes: 'Road flooded, unsafe to proceed' } })).status, 200);
    const open = (await ops('GET', `/exceptions?type=open_issue&incidentId=${p3.incidentId}`, as(admin))).body.data.exceptions;
    assert.equal(open.length, 1);
    assert.match(open[0].notes, /unsafe/);
    assert.equal((await dash(p3.incidentId)).summary.deliveryIssues.openIssues, 1);
  });

  // ------------------------------------------------------------------ detail, alerts, reports, export, privacy
  test('incident detail brings the operational picture together and shows Phase 4 alerts and delivery statistics', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await pledged(25);
    const a = await alerts('POST', '/', { ...as(admin), body: { incidentId: p.incidentId, scope: 'local', severity: 'high' } });
    assert.equal(a.status, 201);
    await dispatcher.drain();
    const detail = (await ops('GET', `/incidents/${p.incidentId}`, as(admin))).body.data;
    assert.equal(detail.requests.length, 1);
    assert.equal(detail.requests[0].items[0].quantities.activePledged, 25);
    assert.equal(detail.pledges.length, 1);
    assert.equal(detail.pledges[0].donorName, donorA.user.name);
    assert.equal(detail.alerts.items.length, 1);
    assert.equal(detail.alerts.items[0].severity, 'high');
    assert.ok(detail.history.some((h) => h.action === 'verified'));
    assert.ok(detail.quantityHistory.some((q) => q.changeType === 'added'));
    const board = (await ops('GET', `/dashboard?incidentId=${p.incidentId}`, as(admin))).body.data;
    assert.equal(board.alerts.active >= 1, true);
    assert.equal((await ops('GET', '/incidents/999999999', as(admin))).status, 404);
  });

  test('dashboard alert health matches the Phase 4 outbox (failed events are reported, not hidden)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const [[before]] = await pool.query("SELECT COUNT(*) AS n FROM disaster_alert_events WHERE status = 'failed'");
    const p = await pledged(5);
    const a = await alerts('POST', '/', { ...as(admin), body: { incidentId: p.incidentId, scope: 'local' } });
    await dispatcher.drain();
    await pool.query("UPDATE disaster_alert_events SET status = 'failed', attempts = 5, last_error = 'simulated' WHERE alert_id = ?", [a.body.data.alert.id]);
    const board = (await ops('GET', '/dashboard', as(admin))).body.data;
    const [[after]] = await pool.query("SELECT COUNT(*) AS n FROM disaster_alert_events WHERE status = 'failed'");
    assert.equal(board.alerts.failedEvents, Number(after.n));
    assert.ok(Number(after.n) >= Number(before.n) + 1);
    assert.ok(board.alerts.failed.some((e) => e.error === 'simulated'));
  });

  test('reports: counts match the database, units stay separate, timing metrics state their sample size', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const d = await delivered(100, { requested: 100 });
    const rep = (await ops('GET', `/reports?incidentId=${d.incidentId}&granularity=day`, as(admin))).body.data;
    assert.deepEqual(rep.incidents.byType, [{ key: 'flood', count: 1 }]);
    assert.equal(rep.incidents.verifiedVsRejected.verified, 1);
    assert.deepEqual(rep.requests.byStatus, [{ key: 'completed', count: 1 }]);
    const q = rep.quantities[0];
    assert.deepEqual([q.requested, q.pledged, q.verifiedDelivered, q.remainingUnfulfilled], [100, 100, 100, 0]);
    assert.equal(rep.fulfillmentByIncident[0].incidentId, d.incidentId);
    assert.equal(rep.deliveryTasks.fullyDelivered, 1);
    assert.equal(rep.trends.at(-1).deliveriesVerified, 1);
    const verifyTiming = rep.timings.find((m) => /verification$/.test(m.label) && /Incident/.test(m.label));
    assert.equal(verifyTiming.sampleSize, 1);
    assert.equal(verifyTiming.available, true);
    assert.ok(rep.limitations.some((l) => /sampleSize/.test(l)));
    const empty = (await ops('GET', '/reports?incidentId=999999999', as(admin))).body.data;
    assert.ok(empty.timings.every((m) => m.available === false && m.averageHours === null), 'no data -> "not available", never a made-up number');
  });

  test('CSV export: admin-only, validated, free of personal data, safe against spreadsheet formulas, and audited', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const id = await newIncident({ title: '=HYPERLINK("http://evil","x")', district: 'Sylhet' });
    const res = await ops('GET', `/export?dataset=incidents&incidentId=${id}`, { ...as(admin), raw: true });
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/csv/);
    assert.match(res.headers.get('content-disposition'), /attachment; filename="portionbridge-incidents-/);
    assert.ok(res.text.includes("'=HYPERLINK"), 'formula neutralised');
    assert.ok(!res.text.includes(admin.user.email));
    const p = await pledged(10);
    for (const ds of ['requests', 'quantities', 'tasks']) {
      const r = await ops('GET', `/export?dataset=${ds}&incidentId=${p.incidentId}`, { ...as(admin), raw: true });
      assert.equal(r.status, 200, ds);
      for (const secret of [donorA.user.email, donorA.user.name, vol1.user.email, '+8801711111111', 'PRIVATE Dropoff Road 9', 'House 5']) {
        assert.ok(!r.text.includes(secret), `${ds} export leaks ${secret}`);
      }
    }
    assert.equal((await ops('GET', `/export?dataset=incidents`, { ...as(donorA), raw: true })).status, 403);
    const [[a]] = await pool.query("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'ops_export_generated' AND user_id = ?", [admin.user.id]);
    assert.ok(a.n >= 4);
  });

  test('private donor and volunteer details never appear in operations responses', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await pledged(20);
    await accepted(p);
    const bodies = [
      (await ops('GET', `/dashboard?incidentId=${p.incidentId}`, as(admin))).body,
      (await ops('GET', `/tasks?incidentId=${p.incidentId}`, as(admin))).body,
      (await ops('GET', `/incidents/${p.incidentId}`, as(admin))).body,
      (await ops('GET', `/volunteers?pledgeId=${p.pledgeId}`, as(admin))).body,
      (await ops('GET', `/exceptions?incidentId=${p.incidentId}`, as(admin))).body,
      (await ops('GET', `/reports?incidentId=${p.incidentId}`, as(admin))).body,
      (await ops('GET', `/incidents?incidentId=${p.incidentId}`, as(admin))).body,
      (await ops('GET', `/requests?incidentId=${p.incidentId}`, as(admin))).body,
    ];
    const text = JSON.stringify(bodies);
    for (const secret of [donorA.user.email, vol1.user.email, '+8801711111111', 'PRIVATE Dropoff Road 9', 'House 5, Road 3', 'Ring twice', 'Donor Contact']) {
      assert.ok(!text.includes(secret), `leaked: ${secret}`);
    }
  });

  test('merge, assignment and correction endpoints reject mass-assignment of protected fields', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await pledged(10);
    const r = await ops('POST', `/tasks/${p.pledgeId}/assign`, { ...as(admin), body: { volunteerId: vol1.user.id, reason: 'Nearest volunteer', status: 'completed', donation_request_id: 1, quantity_delivered: 999 } });
    assert.equal(r.status, 200);
    const [[pl]] = await pool.query('SELECT quantity_delivered, status FROM relief_pledges WHERE id = ?', [p.pledgeId]);
    assert.deepEqual([Number(pl.quantity_delivered), pl.status], [0, 'pledged']);
    const [[d]] = await pool.query('SELECT status FROM donation_requests WHERE id = ?', [p.donationId]);
    assert.equal(d.status, 'accepted');
  });
});
