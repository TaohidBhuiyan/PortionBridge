const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

const { pool, isDbAvailable, createVerifiedUser, cleanupTestData, setVolunteerLocation } = require('./setup');
const { RELIEF, NOTIFICATION_TYPES } = require('../../constants');

/**
 * Phase 6 — final integration. Cross-cutting checks that no single earlier phase owns:
 * schema <-> constants agreement, the whole incident -> delivery workflow seen from every surface,
 * unit separation, race/idempotency on verification, merged-incident edge cases, coordinate validation
 * and notification-failure isolation.
 */
describe('final integration: workflow, consistency and data integrity', () => {
  let dbReady = false; let server; let origin; let dispatcher;
  let admin; let vol; let donor; let donor2; let reporter;
  const incidentIds = [];

  async function call(prefix, method, path, { token, body } = {}) {
    const res = await fetch(`${origin}${prefix}${path}`, {
      method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  }
  const relief = (m, p, o) => call('/api/v1/relief', m, p, o);
  const ops = (m, p, o) => call('/api/v1/admin/ops', m, p, o);
  const api = (m, p, o) => call('/api/v1', m, p, o);
  const as = (u) => ({ token: u.accessToken });
  const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const pickup = () => ({ pickupDate: tomorrow(), pickupTimeSlot: 'morning', contactPhone: '+8801700000000',
    pickupAddress: { fullAddress: 'House 9, Road 2, Gulshan, Dhaka', area: 'Gulshan', district: 'Dhaka', latitude: 23.81, longitude: 90.41, contactPersonName: 'Donor' } });

  async function enumValues(table, column) {
    const [[r]] = await pool.query('SELECT COLUMN_TYPE AS ct FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?', [table, column]);
    assert.ok(r, `${table}.${column} must exist`);
    return [...r.ct.matchAll(/'([^']*)'/g)].map((m) => m[1]).sort();
  }
  const sorted = (a) => [...a].sort();

  async function newVerifiedIncident(o = {}) {
    const inc = await relief('POST', '/incidents', { ...as(o.reportedBy || admin), body: { title: 'Integration flood', disasterType: 'flood', district: 'Sylhet', severity: 'moderate', latitude: 24.9, longitude: 91.8, ...o.body } });
    assert.equal(inc.status, 201, JSON.stringify(inc.body));
    const id = inc.body.data.incident.id;
    incidentIds.push(id);
    await relief('PATCH', `/incidents/${id}/status`, { ...as(admin), body: { status: 'under_review' } });
    assert.equal((await relief('PATCH', `/incidents/${id}/status`, { ...as(admin), body: { status: 'verified', notes: 'confirmed' } })).status, 200);
    await dispatcher.drain();
    return id;
  }
  async function requestWith(incidentId, items) {
    const rq = await relief('POST', `/incidents/${incidentId}/requests`, { ...as(admin), body: { title: 'Relief needs', locationName: 'Shelter', items } });
    assert.equal(rq.status, 201, JSON.stringify(rq.body));
    const requestId = rq.body.data.request.id;
    assert.equal((await relief('PATCH', `/requests/${requestId}/status`, { ...as(admin), body: { status: 'approved' } })).status, 200);
    const full = await relief('GET', `/requests/${requestId}`, as(admin));
    return { requestId, items: full.body.data.request.items };
  }
  async function pledgeAndDeliver(item, quantity, { verifyQuantity } = {}) {
    const p = await relief('POST', `/items/${item.id}/pledges`, { ...as(donor), body: { quantity, pickup: pickup() } });
    assert.equal(p.status, 201, JSON.stringify(p.body));
    const pledgeId = p.body.data.pledge.id;
    assert.equal((await relief('POST', `/tasks/${pledgeId}/accept`, as(vol))).status, 200);
    assert.equal((await relief('POST', `/tasks/${pledgeId}/schedule`, { ...as(vol), body: { scheduledAt: new Date(Date.now() + 7200000).toISOString() } })).status, 200);
    assert.equal((await relief('POST', `/tasks/${pledgeId}/on-the-way`, as(vol))).status, 200);
    assert.equal((await relief('POST', `/tasks/${pledgeId}/pickup`, { ...as(vol), body: { quantity } })).status, 200);
    assert.equal((await relief('POST', `/tasks/${pledgeId}/delivery`, { ...as(vol), body: { quantity } })).status, 200);
    const queue = await relief('GET', '/admin/reports?limit=200', as(admin));
    const report = queue.body.data.reports.find((r) => r.pledgeId === pledgeId && r.status === 'pending');
    return { pledgeId, reportId: report.id, verify: (body) => relief('POST', `/admin/reports/${report.id}/verify`, { ...as(admin), body: body ?? (verifyQuantity === undefined ? {} : { verifiedQuantity: verifyQuantity, notes: 'short count' }) }) };
  }

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;
    const app = require('../../app');
    dispatcher = require('../../services/alertDispatcher.service');
    server = http.createServer(app);
    await new Promise((r) => server.listen(0, r));
    origin = `http://127.0.0.1:${server.address().port}`;
    [admin, vol, donor, donor2, reporter] = await Promise.all([
      createVerifiedUser({ role: 'admin' }), createVerifiedUser({ role: 'volunteer' }), createVerifiedUser({ role: 'donor' }), createVerifiedUser({ role: 'donor' }), createVerifiedUser({ role: 'donor' }),
    ]);
    await setVolunteerLocation(vol.user.id);
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

  // ------------------------------------------------------------------ schema <-> code
  test('database enums and application constants agree (no drifting status vocabularies)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const pairs = [
      ['disaster_incidents', 'status', Object.values(RELIEF.INCIDENT_STATUS)],
      ['disaster_incidents', 'disaster_type', RELIEF.DISASTER_TYPES],
      ['disaster_incidents', 'severity', RELIEF.SEVERITIES],
      ['disaster_incidents', 'priority', RELIEF.PRIORITIES],
      ['disaster_incidents', 'source_type', RELIEF.INCIDENT_SOURCE_TYPES],
      ['relief_requests', 'status', Object.values(RELIEF.REQUEST_STATUS)],
      ['relief_requests', 'priority', RELIEF.PRIORITIES],
      ['relief_request_items', 'item_category', RELIEF.ITEM_CATEGORIES],
      ['relief_request_items', 'unit', RELIEF.ITEM_UNITS],
      ['relief_pledges', 'status', Object.values(RELIEF.PLEDGE_STATUS)],
      ['relief_pledge_reports', 'report_type', RELIEF.REPORT_TYPES],
      ['relief_item_quantity_history', 'unit', RELIEF.ITEM_UNITS],
      ['disaster_alerts', 'scope', RELIEF.ALERT.SCOPES],
      ['disaster_alerts', 'severity', RELIEF.ALERT.SEVERITY_ORDER],
      ['disaster_alerts', 'status', Object.values(RELIEF.ALERT.STATUS)],
      ['disaster_alert_events', 'event_type', RELIEF.ALERT.EVENT_TYPES],
      ['disaster_alert_events', 'severity', RELIEF.ALERT.SEVERITY_ORDER],
      ['disaster_alert_preferences', 'min_severity', RELIEF.ALERT.SEVERITY_ORDER],
      ['disaster_alert_pref_categories', 'disaster_type', RELIEF.DISASTER_TYPES],
      ['notifications', 'type', Object.values(NOTIFICATION_TYPES)],
      ['notifications', 'severity', RELIEF.SEVERITIES],
    ];
    for (const [table, column, expected] of pairs) {
      assert.deepEqual(await enumValues(table, column), sorted(expected), `${table}.${column}`);
    }
  });

  test('the incident status graph is enforced: merged, rejected and resolved behave as terminal/guarded states', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const { TRANSITIONS } = require('../../services/disasterIncident.service');
    assert.deepEqual(TRANSITIONS.reported.sort(), ['rejected', 'under_review']);
    assert.equal(TRANSITIONS.merged, undefined, 'merged has no outgoing transition');
    // every transition target is a real status and nothing transitions to itself
    const all = Object.values(RELIEF.INCIDENT_STATUS);
    Object.entries(TRANSITIONS).forEach(([from, tos]) => tos.forEach((to) => { assert.ok(all.includes(to)); assert.notEqual(from, to); }));
    const { TRANSITIONS: reqT } = require('../../services/reliefRequest.service');
    assert.equal(reqT.completed, undefined, 'completed requests are terminal (reopened only by a delivery correction)');
    assert.equal(reqT.rejected, undefined);
    assert.ok(!reqT.approved.includes('completed'), 'completion is automatic only');
  });

  // ------------------------------------------------------------------ workflow, all surfaces
  test('FULL WORKFLOW: report -> verify -> map -> approve -> pledge -> deliver (partial) -> verify -> resolve, consistent on every surface; units never mixed', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    // 1-2. a donor reports; nothing is public or verified yet
    const rep = await relief('POST', '/incidents', { ...as(reporter), body: { title: 'Cyclone landfall Barguna', disasterType: 'cyclone', district: 'Barguna', severity: 'high', latitude: 22.15, longitude: 90.12, status: 'verified', verificationStatus: 'verified' } });
    assert.equal(rep.status, 201);
    const id = rep.body.data.incident.id; incidentIds.push(id);
    assert.equal(rep.body.data.incident.status, 'reported');
    assert.equal(rep.body.data.incident.isVerified, false);
    assert.equal((await relief('GET', `/incidents/${id}`)).status, 404);
    const mapFilter = '/incidents?status=verified,active,resolved&limit=100';
    assert.ok(!(await relief('GET', mapFilter)).body.data.incidents.some((i) => i.id === id), 'unverified report is not on the public map');
    assert.equal((await relief('PATCH', `/incidents/${id}/status`, { ...as(reporter), body: { status: 'verified' } })).status, 403);

    // 3. admin verifies -> appears with approximate coordinates and real status
    await relief('PATCH', `/incidents/${id}/status`, { ...as(admin), body: { status: 'under_review' } });
    assert.equal((await relief('PATCH', `/incidents/${id}/status`, { ...as(admin), body: { status: 'verified', notes: 'DDM confirmed' } })).status, 200);
    const onMap = (await relief('GET', mapFilter)).body.data.incidents.find((i) => i.id === id);
    assert.ok(onMap, 'verified incident is on the public map');
    assert.equal(onMap.isVerified, true);
    assert.equal(onMap.coordinatesApproximate, true);
    assert.equal(onMap.latitude, 22.15);
    assert.equal(onMap.address, undefined);

    // 4. two items with DIFFERENT units/categories (water in bottles-as-pieces, food in packets)
    const { requestId, items } = await requestWith(id, [
      { name: 'Drinking water', category: 'drinking_water', unit: 'piece', quantity: 50 },
      { name: 'Dry food', category: 'dry_food', unit: 'packet', quantity: 50 },
    ]);
    const water = items.find((i) => i.name === 'Drinking water');
    const food = items.find((i) => i.name === 'Dry food');
    let sum = (await relief('GET', `/requests/${requestId}/summary`)).body.data.summary;
    assert.equal(sum.items.length, 2);
    assert.ok(!JSON.stringify(sum).includes('"requested":100'), 'water pieces and food packets are never added together');

    // 5-9. food: full pledge delivered fully; water: 30 pledged, 30 collected, only 25 verified delivered
    const f = await pledgeAndDeliver(food, 50);
    const w = await pledgeAndDeliver(water, 30, { verifyQuantity: 25 });
    sum = (await relief('GET', `/requests/${requestId}/summary`)).body.data.summary;
    let q = (name) => sum.items.find((i) => i.name === name).quantities;
    assert.equal(q('Dry food').delivered, 0, 'reported delivery is not verified delivery');
    assert.equal(q('Dry food').pendingVerification, 50);
    assert.equal((await f.verify()).status, 200);
    assert.equal((await w.verify()).status, 200);
    sum = (await relief('GET', `/requests/${requestId}/summary`)).body.data.summary;
    q = (name) => sum.items.find((i) => i.name === name).quantities;
    assert.equal(q('Dry food').delivered, 50);
    assert.equal(q('Drinking water').delivered, 25);
    assert.equal(q('Drinking water').collected, 30);
    assert.equal(q('Drinking water').remainingToPledge, 25, 'the 5 short pieces are released back to the need');

    // 10. every surface agrees
    const mine = (await relief('GET', '/pledges/mine?limit=50', as(donor))).body.data.pledges;
    const mineWater = mine.find((p) => p.id === w.pledgeId);
    assert.equal(mineWater.status, 'partially_fulfilled');
    assert.equal(mineWater.quantityDelivered, 25);
    const tasks = (await relief('GET', '/tasks/mine?limit=50', as(vol))).body.data.tasks;
    assert.ok(tasks.some((t2) => t2.pledgeId === w.pledgeId));
    const dash = (await ops('GET', `/dashboard?incidentId=${id}`, as(admin))).body.data;
    const dWater = dash.quantities.find((x) => x.name === 'Drinking water');
    const dFood = dash.quantities.find((x) => x.name === 'Dry food');
    assert.deepEqual([dWater.requested, dWater.pledged, dWater.collected, dWater.verifiedDelivered, dWater.unit], [50, 25, 30, 25, 'piece']);
    assert.deepEqual([dFood.requested, dFood.pledged, dFood.verifiedDelivered, dFood.remainingUnfulfilled, dFood.unit], [50, 50, 50, 0, 'packet']);
    assert.equal(dash.summary.requests.approvedUnfulfilled, 1, 'water still needs 25');
    const rep2 = (await ops('GET', `/reports?incidentId=${id}`, as(admin))).body.data;
    assert.equal(rep2.quantities.length, 2);

    // finish the water need -> request completes automatically; incident resolved -> alert/notices consistent
    const w2 = await pledgeAndDeliver(water, 25);
    assert.equal((await w2.verify()).status, 200);
    assert.equal((await relief('GET', `/requests/${requestId}`, as(admin))).body.data.request.status, 'completed');
    assert.equal((await relief('PATCH', `/incidents/${id}/status`, { ...as(admin), body: { status: 'resolved' } })).status, 200);
    const resolved = (await relief('GET', mapFilter)).body.data.incidents.find((i) => i.id === id);
    assert.equal(resolved.status, 'resolved');
    assert.equal((await relief('POST', `/items/${water.id}/pledges`, { ...as(donor2), body: { quantity: 1, pickup: pickup() } })).status >= 400, true, 'no pledging on a resolved incident / completed need');
    const fin = (await ops('GET', `/dashboard?incidentId=${id}`, as(admin))).body.data;
    assert.equal(fin.summary.requests.approvedUnfulfilled, 0);
    assert.equal(fin.summary.incidents.verifiedActive, 0);
    assert.equal(fin.summary.tasks.active, 0);
  });

  test('verification races and repeats cannot double count: parallel verifies yield exactly one success', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const id = await newVerifiedIncident({ body: { district: 'Noakhali', latitude: 22.8, longitude: 91.1 } });
    const { requestId, items } = await requestWith(id, [{ name: 'Blanket', category: 'blanket', unit: 'piece', quantity: 40 }]);
    const d = await pledgeAndDeliver(items[0], 40);
    const results = await Promise.all([d.verify(), d.verify(), d.verify()]);
    assert.equal(results.filter((r) => r.status === 200).length, 1, results.map((r) => r.status).join());
    assert.ok(results.filter((r) => r.status !== 200).every((r) => [409, 422].includes(r.status)));
    const [[pl]] = await pool.query('SELECT quantity_delivered FROM relief_pledges WHERE id = ?', [d.pledgeId]);
    assert.equal(Number(pl.quantity_delivered), 40);
    assert.equal((await relief('POST', `/admin/reports/${d.reportId}/verify`, { ...as(admin), body: {} })).status >= 400, true);
    const sum = (await relief('GET', `/requests/${requestId}/summary`)).body.data.summary;
    assert.equal(sum.items[0].quantities.delivered, 40);
  });

  // ------------------------------------------------------------------ merged-incident edge cases
  test('a merged incident is read-only: no status change, no edits, no new requests, no alerts', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const survivor = await newVerifiedIncident({ body: { title: 'Survivor' } });
    const dup = await newVerifiedIncident({ body: { title: 'Duplicate' } });
    assert.equal((await ops('POST', `/incidents/${dup}/merge`, { ...as(admin), body: { targetIncidentId: survivor, reason: 'Same event' } })).status, 200);
    assert.equal((await relief('PATCH', `/incidents/${dup}/status`, { ...as(admin), body: { status: 'active' } })).status, 409);
    assert.equal((await relief('PATCH', `/incidents/${dup}`, { ...as(admin), body: { severity: 'critical', reason: 'edit a merged record' } })).status, 409);
    assert.equal((await relief('POST', `/incidents/${dup}/requests`, { ...as(admin), body: { title: 'New request', locationName: 'X', items: [{ name: 'Rice', category: 'dry_food', unit: 'kg', quantity: 5 }] } })).status >= 400, true);
    assert.equal((await api('POST', '/alerts', { ...as(admin), body: { incidentId: dup, scope: 'local' } })).status, 409);
    assert.equal((await ops('POST', `/incidents/${dup}/request-info`, { ...as(admin), body: { note: 'Please clarify the location' } })).status, 409);
    assert.equal((await ops('POST', `/incidents/${dup}/reopen`, { ...as(admin), body: { reason: 'Trying to reopen a merged record' } })).status, 409);
    assert.equal((await relief('GET', `/incidents/${dup}`, as(donor))).status, 404, 'hidden from non-admins');
    assert.equal((await relief('GET', `/incidents/${dup}`, as(admin))).status, 200, 'admins can still read it');
  });

  // ------------------------------------------------------------------ geographic validation
  test('coordinates are validated on the server: out-of-range, outside Bangladesh, half-pairs and non-numbers are refused', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const post = (extra) => relief('POST', '/incidents', { ...as(reporter), body: { title: 'Coordinate check', disasterType: 'flood', district: 'Sylhet', severity: 'low', ...extra } });
    for (const bad of [{ latitude: 95, longitude: 91 }, { latitude: 24, longitude: 200 }, { latitude: 51.5, longitude: -0.12 }, { latitude: 24.9 }, { longitude: 91.8 }, { latitude: 'abc', longitude: 91.8 }]) {
      assert.equal((await post(bad)).status, 422, JSON.stringify(bad));
    }
    const ok = await post({});
    assert.equal(ok.status, 201, 'coordinates are optional');
    incidentIds.push(ok.body.data.incident.id);
    assert.equal(ok.body.data.incident.latitude, null);
  });

  // ------------------------------------------------------------------ notification failure isolation
  test('a failing notification never rolls back or corrupts delivery verification, assignment or alerts', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const notificationService = require('../../services/notification.service');
    const original = notificationService.createNotification;
    const id = await newVerifiedIncident({ body: { district: 'Feni', latitude: 23.0, longitude: 91.4 } });
    const { items } = await requestWith(id, [{ name: 'Rice', category: 'dry_food', unit: 'kg', quantity: 100 }]);
    const p = await relief('POST', `/items/${items[0].id}/pledges`, { ...as(donor), body: { quantity: 60, pickup: pickup() } });
    assert.equal(p.status, 201);
    const pledgeId = p.body.data.pledge.id;
    notificationService.createNotification = async () => { throw new Error('simulated notification outage'); };
    try {
      assert.equal((await ops('POST', `/tasks/${pledgeId}/assign`, { ...as(admin), body: { volunteerId: vol.user.id, reason: 'Nearest volunteer' } })).status, 200);
      await relief('POST', `/tasks/${pledgeId}/schedule`, { ...as(vol), body: { scheduledAt: new Date(Date.now() + 7200000).toISOString() } });
      await relief('POST', `/tasks/${pledgeId}/on-the-way`, as(vol));
      await relief('POST', `/tasks/${pledgeId}/pickup`, { ...as(vol), body: { quantity: 60 } });
      assert.equal((await relief('POST', `/tasks/${pledgeId}/delivery`, { ...as(vol), body: { quantity: 60 } })).status, 200);
      const queue = await relief('GET', '/admin/reports?limit=200', as(admin));
      const report = queue.body.data.reports.find((r) => r.pledgeId === pledgeId && r.status === 'pending');
      assert.equal((await relief('POST', `/admin/reports/${report.id}/verify`, { ...as(admin), body: {} })).status, 200);
    } finally { notificationService.createNotification = original; }
    const [[pl]] = await pool.query('SELECT status, quantity_delivered FROM relief_pledges WHERE id = ?', [pledgeId]);
    assert.deepEqual([pl.status, Number(pl.quantity_delivered)], ['delivered', 60]);
  });

  test('repeated alert-relevant triggers do not multiply notifications for the same user and event', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const prefs = await api('PUT', '/alerts/preferences', { ...as(donor2), body: { districts: ['Sunamganj'] } });
    assert.equal(prefs.status, 200);
    const id = await newVerifiedIncident({ body: { district: 'Sunamganj', severity: 'high', latitude: 25.07, longitude: 91.4 } });
    await dispatcher.drain();
    await dispatcher.sweep();
    await dispatcher.sweep();
    const [rows] = await pool.query("SELECT alert_event_id, COUNT(*) AS n FROM notifications WHERE user_id = ? AND incident_id = ? AND type = 'disaster_alert' GROUP BY alert_event_id", [donor2.user.id, id]);
    assert.equal(rows.length, 1);
    assert.equal(Number(rows[0].n), 1);
  });
});
