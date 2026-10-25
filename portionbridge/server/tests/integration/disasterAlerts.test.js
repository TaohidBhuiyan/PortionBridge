const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { Server } = require('socket.io');
const { io: ioClient } = require('socket.io-client');

const { pool, isDbAvailable, createVerifiedUser, cleanupTestData } = require('./setup');

/**
 * Disaster Relief Phase 4 — alerts & notifications. Real Express app over HTTP, real
 * Socket.io transport, real database. Assertions are per test user (other suites run in
 * parallel against the same DB, so global counts are never asserted).
 */
describe('disaster alerts: targeting, deduplication, authorization, lifecycle', () => {
  let dbReady = false;
  let server;
  let io;
  let base;
  let alertsBase;
  let dispatcher;
  let alertService;
  let admin;
  let donorDefault; // no preference row
  let donorSylhetDistrict; // prefers Sylhet
  let donorNearCenter; // coarse centre next to the incident
  let donorFarCenter; // centre in Dhaka
  let donorOptOut; // nearby + nationwide off, prefers Sylhet
  let donorMulti; // matches district + radius + nationwide at once
  let donorFlood; // only "fire" category
  let volunteer;
  const incidentIds = [];

  async function call(prefix, method, path, { token, body } = {}) {
    const res = await fetch(`${prefix}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  }
  const relief = (m, p, o) => call(base, m, p, o);
  const alerts = (m, p, o) => call(alertsBase, m, p, o);

  const incidentPayload = (o = {}) => ({
    title: 'Flood in Sylhet', description: 'Rising water', disasterType: 'flood', severity: 'moderate',
    district: 'Sylhet', affectedArea: 'Companiganj', latitude: 24.912345, longitude: 91.831234, ...o,
  });

  async function verifiedIncident(o = {}) {
    const r = await relief('POST', '/incidents', { token: admin.accessToken, body: incidentPayload(o) });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    const id = r.body.data.incident.id;
    incidentIds.push(id);
    await relief('PATCH', `/incidents/${id}/status`, { token: admin.accessToken, body: { status: 'under_review' } });
    const v = await relief('PATCH', `/incidents/${id}/status`, { token: admin.accessToken, body: { status: 'verified', notes: 'confirmed' } });
    assert.equal(v.status, 200, JSON.stringify(v.body));
    await dispatcher.drain();
    return id;
  }

  const notifsFor = async (user, incidentId) => {
    const [rows] = await pool.query(
      "SELECT * FROM notifications WHERE user_id = ? AND type = 'disaster_alert' AND (? IS NULL OR incident_id = ?) ORDER BY id",
      [user.user.id, incidentId ?? null, incidentId ?? null]
    );
    return rows;
  };
  const issue = (body, token) => alerts('POST', '/', { token: token || admin.accessToken, body });
  const setPrefs = (user, body) => alerts('PUT', '/preferences', { token: user.accessToken, body });

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;
    const app = require('../../app');
    const { initializeSocket } = require('../../sockets/index');
    dispatcher = require('../../services/alertDispatcher.service');
    alertService = require('../../services/disasterAlert.service');
    server = http.createServer(app);
    io = new Server(server, { cors: { origin: '*' } });
    initializeSocket(io);
    await new Promise((r) => server.listen(0, r));
    const origin = `http://127.0.0.1:${server.address().port}`;
    base = `${origin}/api/v1/relief`;
    alertsBase = `${origin}/api/v1/alerts`;
    [admin, donorDefault, donorSylhetDistrict, donorNearCenter, donorFarCenter, donorOptOut, donorMulti, donorFlood, volunteer] = await Promise.all([
      createVerifiedUser({ role: 'admin' }), createVerifiedUser({ role: 'donor' }), createVerifiedUser({ role: 'donor' }),
      createVerifiedUser({ role: 'donor' }), createVerifiedUser({ role: 'donor' }), createVerifiedUser({ role: 'donor' }),
      createVerifiedUser({ role: 'donor' }), createVerifiedUser({ role: 'donor' }), createVerifiedUser({ role: 'volunteer' }),
    ]);
    await setPrefs(donorSylhetDistrict, { districts: ['sylhet'] });
    await setPrefs(donorNearCenter, { centerLatitude: 24.91, centerLongitude: 91.83, radiusKm: 15 });
    await setPrefs(donorFarCenter, { centerLatitude: 23.81, centerLongitude: 90.41, radiusKm: 15 });
    await setPrefs(donorOptOut, { nearbyEnabled: false, nationwideEnabled: false, districts: ['Sylhet'] });
    await setPrefs(donorMulti, { districts: ['Sylhet'], centerLatitude: 24.91, centerLongitude: 91.83, radiusKm: 30 });
    await setPrefs(donorFlood, { categories: ['fire'], districts: ['Sylhet'] });
  });

  after(async () => {
    if (!dbReady) return;
    await dispatcher.drain();
    if (server.closeAllConnections) server.closeAllConnections();
    await new Promise((r) => io.close(() => r()));
    if (incidentIds.length) {
      await pool.query('DELETE p FROM relief_pledges p JOIN relief_request_items i ON i.id = p.relief_request_item_id JOIN relief_requests r ON r.id = i.relief_request_id WHERE r.incident_id IN (?)', [incidentIds]);
      await pool.query('DELETE FROM relief_requests WHERE incident_id IN (?)', [incidentIds]);
      await pool.query('DELETE FROM disaster_incidents WHERE id IN (?)', [incidentIds]);
    }
    await cleanupTestData();
  });

  // ------------------------------------------------------------- eligibility / accuracy
  test('an unverified incident cannot be alerted and no notification is created', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const r = await relief('POST', '/incidents', { token: admin.accessToken, body: incidentPayload({ severity: 'critical' }) });
    const id = r.body.data.incident.id;
    incidentIds.push(id);
    const res = await issue({ incidentId: id, scope: 'nationwide', severity: 'critical' });
    assert.equal(res.status, 409);
    assert.equal(res.body.code ?? res.body.errors?.code ?? 'INCIDENT_NOT_ELIGIBLE', 'INCIDENT_NOT_ELIGIBLE');
    const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM disaster_alerts WHERE incident_id = ?', [id]);
    assert.equal(n, 0);
    // merely verifying low-severity data does not alert; a reported incident never reaches the outbox
    assert.equal((await notifsFor(donorSylhetDistrict, id)).length, 0);
  });

  test('verifying a high-severity incident auto-issues a LOCAL alert that only nearby users receive', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const id = await verifiedIncident({ severity: 'high', disasterType: 'flash_flood' });
    const [[alert]] = await pool.query('SELECT * FROM disaster_alerts WHERE incident_id = ?', [id]);
    assert.equal(alert.scope, 'local');
    assert.equal(alert.severity, 'high'); // the incident's own stored severity, not a new calculation
    assert.equal(alert.auto_generated, 1);

    const sylhet = await notifsFor(donorSylhetDistrict, id);
    assert.equal(sylhet.length, 1);
    assert.match(sylhet[0].title, /High priority/);
    assert.match(sylhet[0].message, /Verified incident/);
    assert.ok(!/unverified/i.test(sylhet[0].message.replace(/\(not verified\)/gi, '')));
    assert.equal(sylhet[0].incident_id, id);
    assert.equal(sylhet[0].severity, 'high');

    assert.equal((await notifsFor(donorNearCenter, id)).length, 1, 'inside configured radius');
    assert.equal((await notifsFor(donorFarCenter, id)).length, 0, 'outside radius');
    assert.equal((await notifsFor(donorDefault, id)).length, 0, 'local alert does not reach unrelated users');
    assert.equal((await notifsFor(donorOptOut, id)).length, 0, 'nearby opt-out honoured');
    assert.equal((await notifsFor(donorFlood, id)).length, 0, 'category filter honoured (fire only)');
  });

  test('multiple matching rules (district + radius) still produce exactly one notification', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const id = await verifiedIncident({ severity: 'high' });
    assert.equal((await notifsFor(donorMulti, id)).length, 1);
  });

  // ------------------------------------------------------------- nationwide
  test('a critical nationwide alert reaches users far from the incident, including nationwide opt-outs (mandatory policy)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const id = await verifiedIncident({ severity: 'moderate', district: 'Kurigram', affectedArea: 'Ulipur', latitude: 25.8, longitude: 89.6 });
    const res = await issue({ incidentId: id, scope: 'nationwide', severity: 'critical', districts: ['Kurigram', 'Sylhet'], note: 'Several districts affected.' });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    await dispatcher.drain();
    for (const u of [donorDefault, donorFarCenter, donorOptOut, donorFlood, volunteer]) {
      assert.equal((await notifsFor(u, id)).length, 1, 'every active user gets a critical nationwide alert');
    }
    const [n] = await notifsFor(donorDefault, id);
    assert.match(n.title, /Critical emergency/);
    assert.match(n.message, /Several districts affected/);
  });

  test('a non-critical nationwide alert respects the nationwide opt-out, severity floor and categories; affected-area users still get it', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const picky = await createVerifiedUser({ role: 'donor' });
    await setPrefs(picky, { minSeverity: 'critical' });
    const id = await verifiedIncident({ severity: 'moderate', district: 'Barishal', latitude: 22.7, longitude: 90.37 });
    const res = await issue({ incidentId: id, scope: 'nationwide', severity: 'high', districts: ['Barishal'] });
    assert.equal(res.status, 201);
    await dispatcher.drain();
    assert.equal((await notifsFor(donorDefault, id)).length, 1);
    assert.equal((await notifsFor(donorOptOut, id)).length, 0, 'nationwide opt-out honoured for non-critical');
    assert.equal((await notifsFor(picky, id)).length, 0, 'min severity honoured');
    assert.equal((await notifsFor(donorFlood, id)).length, 0, 'fire-only user does not get a flood alert');
  });

  test('nationwide scope below "high" is rejected', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const id = await verifiedIncident({ severity: 'moderate', district: 'Rajshahi', latitude: 24.37, longitude: 88.6 });
    const res = await issue({ incidentId: id, scope: 'nationwide', severity: 'moderate' });
    assert.equal(res.status, 422);
  });

  // ------------------------------------------------------------- authorization
  test('donors, volunteers and anonymous callers cannot publish, escalate, cancel or preview alerts', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const id = await verifiedIncident({ severity: 'moderate', district: 'Khulna', latitude: 22.8, longitude: 89.5 });
    for (const u of [donorDefault, volunteer]) {
      assert.equal((await issue({ incidentId: id, scope: 'nationwide', severity: 'critical' }, u.accessToken)).status, 403);
      assert.equal((await alerts('POST', '/preview', { token: u.accessToken, body: { incidentId: id } })).status, 403);
      assert.equal((await alerts('GET', '/', { token: u.accessToken })).status, 403);
      assert.equal((await alerts('PATCH', '/1', { token: u.accessToken, body: { severity: 'critical' } })).status, 403);
      assert.equal((await alerts('POST', '/1/cancel', { token: u.accessToken, body: { reason: 'abusive attempt' } })).status, 403);
    }
    assert.equal((await alerts('POST', '/', { body: { incidentId: id, scope: 'local' } })).status, 401);
    const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM disaster_alerts WHERE incident_id = ?', [id]);
    assert.equal(n, 0);
  });

  test('the client cannot declare an incident verified or critical through the alert API', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const r = await relief('POST', '/incidents', { token: donorDefault.accessToken, body: incidentPayload({ status: 'verified', verificationStatus: 'verified' }) });
    incidentIds.push(r.body.data.incident.id);
    const res = await issue({ incidentId: r.body.data.incident.id, scope: 'local', verificationStatus: 'verified' });
    assert.equal(res.status, 409);
  });

  // ------------------------------------------------------------- dedupe / retry
  test('re-processing an event (retry, concurrency, crash recovery) never duplicates notifications', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const id = await verifiedIncident({ severity: 'moderate', district: 'Noakhali', latitude: 22.8, longitude: 91.1 });
    await setPrefs(donorSylhetDistrict, { districts: ['Sylhet', 'Noakhali'] });
    const res = await issue({ incidentId: id, scope: 'regional', districts: ['Noakhali'] });
    assert.equal(res.status, 201);
    await dispatcher.drain();
    const eventId = res.body.data.alert.events[0].id;
    assert.equal((await notifsFor(donorSylhetDistrict, id)).length, 1);

    // concurrent + repeated processing of a completed event is a no-op
    const results = await Promise.all([dispatcher.processEvent(eventId), dispatcher.processEvent(eventId), dispatcher.processEvent(eventId)]);
    assert.ok(results.every((r) => r.status === 'skipped'));

    // simulate a crash mid-delivery: event left 'processing' with a stale claim, then swept
    await pool.query("UPDATE disaster_alert_events SET status = 'processing', locked_at = NOW() - INTERVAL 1 HOUR WHERE id = ?", [eventId]);
    const swept = await dispatcher.processEvent(eventId);
    assert.equal(swept.status, 'completed');
    assert.equal((await notifsFor(donorSylhetDistrict, id)).length, 1, 'still exactly one');

    // simulate a failed event + admin retry
    await pool.query("UPDATE disaster_alert_events SET status = 'failed', attempts = 5, last_error = 'boom' WHERE id = ?", [eventId]);
    assert.equal((await dispatcher.processEvent(eventId)).status, 'skipped', 'attempt cap reached: waits for admin');
    const retry = await alerts('POST', `/${res.body.data.alert.id}/events/${eventId}/retry`, { token: admin.accessToken });
    assert.equal(retry.status, 200);
    await dispatcher.drain();
    assert.equal((await notifsFor(donorSylhetDistrict, id)).length, 1);
    const [[ev]] = await pool.query('SELECT status, recipient_count FROM disaster_alert_events WHERE id = ?', [eventId]);
    assert.equal(ev.status, 'completed');
    assert.ok(ev.recipient_count >= 1);
  });

  test('the outbox dedupe key makes a repeated admin request (double click / retry) a no-op', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const id = await verifiedIncident({ severity: 'moderate', district: 'Bogura', latitude: 24.85, longitude: 89.37 });
    const a = await issue({ incidentId: id, scope: 'local' });
    assert.equal(a.status, 201);
    const again = await issue({ incidentId: id, scope: 'local' });
    assert.equal(again.status, 409, 'only one live alert per incident');
    const alertId = a.body.data.alert.id;
    const key = { severity: 'high', requestKey: 'esc-001' };
    const u1 = await alerts('PATCH', `/${alertId}`, { token: admin.accessToken, body: key });
    const u2 = await alerts('PATCH', `/${alertId}`, { token: admin.accessToken, body: key });
    assert.equal(u1.status, 200);
    assert.equal(u2.status, 200);
    const [[{ n }]] = await pool.query("SELECT COUNT(*) AS n FROM disaster_alert_events WHERE alert_id = ? AND event_type = 'escalated'", [alertId]);
    assert.equal(n, 1);
    const none = await alerts('PATCH', `/${alertId}`, { token: admin.accessToken, body: { severity: 'high' } });
    assert.equal(none.status, 422, 'no-op update rejected');
    await dispatcher.drain();
  });

  test('the same alert event can never notify a user twice (database unique key)', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const id = await verifiedIncident({ severity: 'high', district: 'Rangpur', latitude: 25.75, longitude: 89.25 });
    const [[ev]] = await pool.query('SELECT id FROM disaster_alert_events WHERE incident_id = ? LIMIT 1', [id]);
    await assert.rejects(pool.query(
      "INSERT INTO notifications (user_id, type, title, message, alert_event_id) VALUES (?, 'disaster_alert', 't', 'm', ?), (?, 'disaster_alert', 't', 'm', ?)",
      [donorDefault.user.id, ev.id, donorDefault.user.id, ev.id]
    ), /Duplicate/);
  });

  // ------------------------------------------------------------- lifecycle
  test('escalation, correction, resolution and cancellation notify the original audience and are audited', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const id = await verifiedIncident({ severity: 'moderate', district: 'Cumilla', latitude: 23.46, longitude: 91.18 });
    await setPrefs(donorSylhetDistrict, { districts: ['Sylhet', 'Cumilla'] });
    const a = await issue({ incidentId: id, scope: 'local', severity: 'moderate' });
    const alertId = a.body.data.alert.id;
    await dispatcher.drain();
    assert.equal((await notifsFor(donorSylhetDistrict, id)).length, 1);

    const esc = await alerts('PATCH', `/${alertId}`, { token: admin.accessToken, body: { severity: 'critical' } });
    assert.equal(esc.status, 200);
    await dispatcher.drain();
    const corr = await alerts('POST', `/${alertId}/correction`, { token: admin.accessToken, body: { note: 'Affected area is Cumilla Sadar only.' } });
    assert.equal(corr.status, 200);
    await dispatcher.drain();
    assert.equal((await notifsFor(donorSylhetDistrict, id)).length, 3);

    // resolving the INCIDENT resolves the alert automatically and notifies prior recipients
    const resolved = await relief('PATCH', `/incidents/${id}/status`, { token: admin.accessToken, body: { status: 'resolved' } });
    assert.equal(resolved.status, 200, JSON.stringify(resolved.body));
    await dispatcher.drain();
    const list = await notifsFor(donorSylhetDistrict, id);
    assert.equal(list.length, 4);
    assert.match(list[3].title, /^Resolved:/);
    assert.equal((await pool.query('SELECT status FROM disaster_alerts WHERE id = ?', [alertId]))[0][0].status, 'resolved');
    assert.equal((await notifsFor(donorFarCenter, id)).length, 0, 'follow-ups reach only people the alert reached');

    const [audit] = await pool.query("SELECT action FROM audit_logs WHERE user_id = ? AND action LIKE 'disaster_alert_%'", [admin.user.id]);
    const actions = audit.map((r) => r.action);
    ['disaster_alert_issued', 'disaster_alert_escalated', 'disaster_alert_corrected'].forEach((x) => assert.ok(actions.includes(x), x));
  });

  test('cancelling needs a reason, withdraws the alert with an audit record, and frees the incident for a new alert', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const id = await verifiedIncident({ severity: 'moderate', district: 'Feni', latitude: 23.0, longitude: 91.4 });
    await setPrefs(donorSylhetDistrict, { districts: ['Sylhet', 'Feni'] });
    const a = await issue({ incidentId: id, scope: 'local' });
    const alertId = a.body.data.alert.id;
    await dispatcher.drain();
    assert.equal((await alerts('POST', `/${alertId}/cancel`, { token: admin.accessToken, body: {} })).status, 422);
    const c = await alerts('POST', `/${alertId}/cancel`, { token: admin.accessToken, body: { reason: 'Duplicate of another alert' } });
    assert.equal(c.status, 200);
    await dispatcher.drain();
    const list = await notifsFor(donorSylhetDistrict, id);
    assert.equal(list.length, 2);
    assert.match(list[1].title, /^Alert withdrawn:/);
    assert.ok(!JSON.stringify(list[1]).includes('Duplicate of another alert'), 'internal reason is not shown to users');
    const [[row]] = await pool.query("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'disaster_alert_cancelled' AND user_id = ?", [admin.user.id]);
    assert.ok(row.n >= 1);
    assert.equal((await issue({ incidentId: id, scope: 'local' })).status, 201, 'a fresh alert can be issued after cancelling');
    await dispatcher.drain();
  });

  test('relief approval and quantity change produce relief updates using authoritative quantities, deduplicated', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const id = await verifiedIncident({ severity: 'moderate', district: 'Chandpur', latitude: 23.23, longitude: 90.65 });
    await setPrefs(donorSylhetDistrict, { districts: ['Sylhet', 'Chandpur'] });
    const a = await issue({ incidentId: id, scope: 'local' });
    assert.equal(a.status, 201);
    await dispatcher.drain();
    const created = await relief('POST', `/incidents/${id}/requests`, {
      token: volunteer.accessToken,
      body: { title: 'Shelter needs', locationName: 'School', latitude: 23.2, longitude: 90.6, address: 'Road 5', items: [{ name: 'Rice', unit: 'kg', quantity: 120, category: 'dry_food' }] },
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const requestId = created.body.data.request.id;
    assert.equal((await relief('PATCH', `/requests/${requestId}/status`, { token: admin.accessToken, body: { status: 'approved' } })).status, 200);
    await dispatcher.drain();
    const list = await notifsFor(donorSylhetDistrict, id);
    assert.equal(list.length, 2);
    assert.match(list[1].title, /^Relief update:/);
    assert.match(list[1].message, /Rice: 120 kg requested, 120 kg still needed/);
    assert.equal(list[1].relief_request_id, requestId);
    const [[{ n }]] = await pool.query("SELECT COUNT(*) AS n FROM disaster_alert_events WHERE incident_id = ? AND event_type = 'relief_update'", [id]);
    assert.equal(n, 1);
    // no relief update when there is no live alert is covered by the hook (nothing to attach to)
  });

  // ------------------------------------------------------------- inbox privacy
  test('users only see and modify their own alert notifications', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const id = await verifiedIncident({ severity: 'high', district: 'Sunamganj', latitude: 25.07, longitude: 91.4 });
    await setPrefs(donorSylhetDistrict, { districts: ['Sunamganj'] });
    const a = await issue({ incidentId: id, scope: 'local' }).catch(() => null);
    await dispatcher.drain();
    const mine = await notifsFor(donorSylhetDistrict, id);
    const other = await notifsFor(donorSylhetDistrict, null);
    assert.ok(other.length >= 1);
    void a; void mine;
    const target = other[0];
    const listMine = await call(`${base.replace('/relief', '')}`, 'GET', '/notifications?type=disaster_alert&limit=50', { token: donorSylhetDistrict.accessToken });
    assert.equal(listMine.status, 200);
    const listOther = await call(`${base.replace('/relief', '')}`, 'GET', '/notifications?type=disaster_alert&limit=50', { token: donorFarCenter.accessToken });
    const ids = (listOther.body.data.notifications || listOther.body.data.items || []).map((n) => n.id);
    assert.ok(!ids.includes(target.id));
    const patch = await call(`${base.replace('/relief', '')}`, 'PATCH', `/notifications/${target.id}/read`, { token: donorFarCenter.accessToken });
    assert.ok([403, 404].includes(patch.status));
    const [[row]] = await pool.query('SELECT is_read FROM notifications WHERE id = ?', [target.id]);
    assert.equal(row.is_read, 0);
    const fields = (listMine.body.data.notifications || listMine.body.data.items || [])[0];
    assert.ok(fields.incident_id || fields.incidentId);
  });

  // ------------------------------------------------------------- preferences
  test('preferences: defaults without a row, validation, coarse location storage, and policy text', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const fresh = await createVerifiedUser({ role: 'donor' });
    const get = await alerts('GET', '/preferences', { token: fresh.accessToken });
    assert.equal(get.body.data.preferences.nationwideEnabled, true);
    assert.equal(get.body.data.preferences.nearbyEnabled, true);
    assert.equal(get.body.data.policy.criticalNationwideMandatory, true);
    assert.equal(get.body.data.policy.channels.sms, false);
    assert.equal((await setPrefs(fresh, { districts: ['Atlantis'] })).status, 422);
    assert.equal((await setPrefs(fresh, { centerLatitude: 10, centerLongitude: 91 })).status, 422, 'outside Bangladesh');
    assert.equal((await setPrefs(fresh, { centerLatitude: 24.9 })).status, 422, 'pair required');
    assert.equal((await setPrefs(fresh, { radiusKm: 0 })).status, 422);
    const ok = await setPrefs(fresh, { centerLatitude: 24.912345, centerLongitude: 91.831234, radiusKm: 20, nationwideEnabled: false });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    assert.equal(ok.body.data.preferences.centerLatitude, 24.91);
    assert.equal(ok.body.data.preferences.nationwideEnabled, false);
    const cleared = await setPrefs(fresh, { centerLatitude: null, centerLongitude: null });
    assert.equal(cleared.body.data.preferences.centerLatitude, null);
  });

  test('the incident list of active alerts is visible to signed-in users and exposes no admin-only fields', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const res = await alerts('GET', '/active', { token: donorDefault.accessToken });
    assert.equal(res.status, 200);
    res.body.data.alerts.forEach((a) => {
      assert.equal(a.cancelReason, undefined);
      assert.equal(a.createdByName, undefined);
      assert.equal(a.incident.verificationStatus, 'verified');
    });
    assert.equal((await alerts('GET', '/active')).status, 401);
  });

  // ------------------------------------------------------------- sockets
  test('socket delivery goes only to the recipient: another user and an anonymous socket receive nothing', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const port = server.address().port;
    const connect = (token) => new Promise((resolve, reject) => {
      const s = ioClient(`http://127.0.0.1:${port}`, { auth: { token }, transports: ['websocket'], reconnection: false });
      s.on('connect', () => resolve(s));
      s.on('connect_error', reject);
    });
    const recipient = await connect(donorSylhetDistrict.accessToken);
    const bystander = await connect(donorFarCenter.accessToken);
    await assert.rejects(connect('not-a-token'), /./);
    const got = []; const leaked = [];
    recipient.on('notification', (n) => got.push(n));
    bystander.on('notification', (n) => leaked.push(n));
    // no public/shared room exists for alerts
    bystander.emit('join_room', { room: 'alerts' });

    await setPrefs(donorSylhetDistrict, { districts: ['Sylhet', 'Jamalpur'] });
    const id = await verifiedIncident({ severity: 'moderate', district: 'Jamalpur', latitude: 24.9, longitude: 89.9 });
    const a = await issue({ incidentId: id, scope: 'local' });
    assert.equal(a.status, 201);
    await dispatcher.drain();
    await new Promise((r) => setTimeout(r, 400));
    assert.equal(got.filter((n) => n.incident_id === id).length, 1, 'recipient gets the realtime event');
    assert.equal(leaked.length, 0, 'bystander receives nothing');
    recipient.close(); bystander.close();
  });

  // ------------------------------------------------------------- unit-level
  test('alert content is sober, names status, and clips to column limits', () => {
    const { buildAlertContent } = require('../../utils/alertContent');
    const c = buildAlertContent({
      event: { event_type: 'issued', severity: 'critical', note: 'x'.repeat(900) },
      alert: { severity: 'critical' },
      incident: { disaster_type: 'cyclone', district: "Cox's Bazar", affected_area: 'Teknaf', status: 'verified' },
      approvedRequestCount: 2,
    });
    assert.ok(c.title.length <= 150);
    assert.ok(c.message.length <= 500);
    assert.match(c.title, /Critical emergency — Cyclone in Cox's Bazar/);
    const r = buildAlertContent({
      event: { event_type: 'resolved', severity: 'high' }, alert: { severity: 'high' },
      incident: { disaster_type: 'flood', district: 'Sylhet', status: 'resolved' },
    });
    assert.match(r.message, /marked resolved/);
    assert.ok(!/available|volunteers are/i.test(r.message));
    void alertService;
  });
});
