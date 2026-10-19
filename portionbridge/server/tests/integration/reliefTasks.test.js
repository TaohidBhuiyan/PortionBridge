const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

const {
  pool, isDbAvailable, createVerifiedUser, cleanupTestData, validFoodDonationPayload, setVolunteerLocation,
} = require('./setup');

/**
 * Disaster relief Phase 3 — donor pledges with pickup logistics, volunteer tasks, reported vs
 * verified delivery, admin oversight. Real Express app over HTTP, real database, no mocks.
 */
describe('disaster relief phase 3: pledge logistics, volunteer tasks, delivery verification', () => {
  let dbReady = false;
  let server;
  let base;
  let pledgeService;
  let donationService;
  let donationModel;
  let admin; let vol1; let vol2; let farVol; let noBaseVol; let donorA; let donorB;
  const incidentIds = [];

  async function api(method, path, { token, body, headers } = {}) {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  }
  const as = (u) => ({ token: u.accessToken });
  const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const pickup = (o = {}) => ({
    pickupDate: tomorrow(), pickupTimeSlot: 'morning', contactPhone: '+8801711111111', additionalNotes: 'Ring the bell twice',
    pickupAddress: { fullAddress: 'House 5, Road 3, Gulshan, Dhaka', area: 'Gulshan', district: 'Dhaka', latitude: 23.81, longitude: 90.41, contactPersonName: 'Donor Contact' },
    ...o,
  });

  async function newScenario({ unit = 'packet', requested = 100, name = 'Dry food', category = 'dry_food', extraItems = [] } = {}) {
    const inc = await api('POST', '/incidents', { ...as(admin), body: { title: 'Flood relief scenario', disasterType: 'flood', district: 'Sylhet', severity: 'high', latitude: 24.9, longitude: 91.8 } });
    const incidentId = inc.body.data.incident.id;
    incidentIds.push(incidentId);
    await api('PATCH', `/incidents/${incidentId}/status`, { ...as(admin), body: { status: 'under_review' } });
    await api('PATCH', `/incidents/${incidentId}/status`, { ...as(admin), body: { status: 'verified', notes: 'ok' } });
    const rq = await api('POST', `/incidents/${incidentId}/requests`, {
      ...as(admin),
      body: {
        title: 'Shelter supplies', locationName: 'Govt School Shelter', address: 'PRIVATE Dropoff Road 9', deliveryInstructions: 'Ask for the shelter manager',
        items: [{ name, category, unit, quantity: requested }, ...extraItems],
      },
    });
    assert.equal(rq.status, 201, JSON.stringify(rq.body));
    const requestId = rq.body.data.request.id;
    await api('PATCH', `/requests/${requestId}/status`, { ...as(admin), body: { status: 'approved' } });
    const full = await api('GET', `/requests/${requestId}`, { ...as(admin) });
    const itemIds = full.body.data.request.items.map((i) => i.id);
    return { incidentId, requestId, itemId: itemIds[0], itemIds };
  }

  const pledgeWithPickup = (user, itemId, quantity, extra = {}) =>
    api('POST', `/items/${itemId}/pledges`, { ...as(user), body: { quantity, pickup: pickup(), ...extra.body }, headers: extra.headers });

  /** scenario + a pledge with pickup, returns ids */
  async function pledged(quantity = 100, opts = {}, donor = donorA) {
    const sc = await newScenario(opts);
    const r = await pledgeWithPickup(donor, sc.itemId, quantity);
    assert.equal(r.status, 201, JSON.stringify(r.body));
    return { ...sc, pledgeId: r.body.data.pledge.id, donationId: r.body.data.pledge.donationRequestId };
  }
  /** pledged + accepted + on the way */
  async function inProgress(quantity = 100, opts = {}) {
    const p = await pledged(quantity, opts);
    assert.equal((await api('POST', `/tasks/${p.pledgeId}/accept`, as(vol1))).status, 200);
    // the existing lifecycle: accepted -> scheduled -> on_the_way
    assert.equal((await api('POST', `/tasks/${p.pledgeId}/schedule`, { ...as(vol1), body: { scheduledAt: new Date(Date.now() + 7200000).toISOString() } })).status, 200);
    assert.equal((await api('POST', `/tasks/${p.pledgeId}/on-the-way`, as(vol1))).status, 200);
    return p;
  }
  const qty = async (requestId, itemId) => (await api('GET', `/requests/${requestId}/summary`, as(admin))).body.data.summary.items.find((i) => i.id === itemId).quantities;
  const donationStatus = async (id) => (await pool.query('SELECT status, is_deleted, volunteer_id, quantity FROM donation_requests WHERE id = ?', [id]))[0][0];

  before(async () => {
    dbReady = await isDbAvailable();
    if (!dbReady) return;
    const app = require('../../app');
    pledgeService = require('../../services/reliefPledge.service');
    donationService = require('../../services/donation.service');
    donationModel = require('../../models/donation.model');
    server = http.createServer(app);
    await new Promise((r) => server.listen(0, r));
    base = `http://127.0.0.1:${server.address().port}/api/v1/relief`;
    [admin, vol1, vol2, farVol, noBaseVol, donorA, donorB] = await Promise.all([
      createVerifiedUser({ role: 'admin' }), createVerifiedUser({ role: 'volunteer' }), createVerifiedUser({ role: 'volunteer' }),
      createVerifiedUser({ role: 'volunteer' }), createVerifiedUser({ role: 'volunteer' }),
      createVerifiedUser({ role: 'donor' }), createVerifiedUser({ role: 'donor' }),
    ]);
    // the helper gives new volunteers a default Dhaka base; this one must genuinely have none
    await pool.query('UPDATE volunteer_profiles SET latitude = NULL, longitude = NULL, coverage_radius = NULL, base_address = NULL WHERE user_id = ?', [noBaseVol.user.id]);
    await setVolunteerLocation(vol1.user.id);
    await setVolunteerLocation(vol2.user.id);
    await setVolunteerLocation(farVol.user.id, { latitude: 22.3569, longitude: 91.7832 }); // Chattogram, ~215 km away
  });

  after(async () => {
    if (!dbReady) return;
    await new Promise((r) => server.close(r));
    delete process.env.RELIEF_REQUIRE_DELIVERY_VERIFICATION;
    if (incidentIds.length) {
      await pool.query('DELETE p FROM relief_pledges p JOIN relief_request_items i ON i.id = p.relief_request_item_id JOIN relief_requests r ON r.id = i.relief_request_id WHERE r.incident_id IN (?)', [incidentIds]);
      await pool.query('DELETE FROM relief_requests WHERE incident_id IN (?)', [incidentIds]);
      await pool.query('DELETE FROM disaster_incidents WHERE id IN (?)', [incidentIds]);
    }
    await cleanupTestData();
  });

  // ============================================================ donor pledge
  test('a donor pledges with pickup details: the pledge and its pickup task are created together and linked', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const sc = await newScenario({ unit: 'liter', requested: 100, name: 'Drinking water', category: 'drinking_water' });
    const r = await pledgeWithPickup(donorA, sc.itemId, 12.5);
    assert.equal(r.status, 201, JSON.stringify(r.body));
    const p = r.body.data.pledge;
    assert.equal(p.status, 'pledged');
    assert.equal(p.quantityPledged, 12.5);
    assert.equal(p.tracking.taskStatus, 'available');
    assert.equal(p.tracking.donationStatus, 'pending');
    assert.equal(p.tracking.destination.name, 'Govt School Shelter');
    const d = await donationStatus(p.donationRequestId);
    assert.equal(d.status, 'pending');
    assert.equal(d.quantity, 13); // logistics record rounds fractional quantities up; the pledge keeps 12.5
    const [[row]] = await pool.query('SELECT category, quantity_unit, title FROM donation_requests WHERE id = ?', [p.donationRequestId]);
    assert.equal(row.category, 'food');
    assert.equal(row.quantity_unit, 'liter');
    assert.match(row.title, /Drinking water/);
    // server-side quantities: remaining is computed from the database
    assert.equal(r.body.data.item.quantities.remainingToPledge, 87.5);
  });

  test('pickup details are validated; a pledge may not combine new pickup details with a linked donation', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const sc = await newScenario();
    const bad = [
      { pickupDate: undefined }, { pickupDate: '2020-01-01' }, { pickupDate: 'tomorrow' }, { pickupTimeSlot: 'midnight' },
      { contactPhone: 'call me' }, { contactPhone: '1'.repeat(30) },
      { pickupAddress: { fullAddress: 'x', latitude: 23.8, longitude: 90.4 } },
      { pickupAddress: { fullAddress: 'House 5 Road 3 Dhaka', latitude: 51.5, longitude: -0.1 } },
      { pickupAddress: { fullAddress: 'House 5 Road 3 Dhaka' } },
      { pickupAddress: undefined },
    ];
    for (const o of bad) {
      const r = await api('POST', `/items/${sc.itemId}/pledges`, { ...as(donorA), body: { quantity: 5, pickup: pickup(o) } });
      assert.equal(r.status, 422, `expected 422 for ${JSON.stringify(o)} got ${r.status} ${JSON.stringify(r.body)}`);
    }
    const donation = await donationService.createDonation(donorA.user.id, validFoodDonationPayload());
    const both = await api('POST', `/items/${sc.itemId}/pledges`, { ...as(donorA), body: { quantity: 5, pickup: pickup(), donationRequestId: donation.id } });
    assert.equal(both.status, 422);
    const [[{ n }]] = await pool.query("SELECT COUNT(*) n FROM relief_pledges WHERE relief_request_item_id = ?", [sc.itemId]);
    assert.equal(Number(n), 0);
  });

  test('invalid, excessive and badly formatted quantities are rejected and create no pickup task', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const sc = await newScenario({ requested: 10 });
    const before = (await pool.query("SELECT COUNT(*) n FROM donation_requests WHERE title LIKE 'Relief:%' AND donor_id IN (?, ?)", [donorA.user.id, donorB.user.id]))[0][0].n;
    for (const q of [0, -1, '1e2', 'abc', null, 1.5, 11]) {
      const r = await pledgeWithPickup(donorA, sc.itemId, q);
      assert.ok([409, 422].includes(r.status), `quantity ${q} -> ${r.status}`);
    }
    const after = (await pool.query("SELECT COUNT(*) n FROM donation_requests WHERE title LIKE 'Relief:%' AND donor_id IN (?, ?)", [donorA.user.id, donorB.user.id]))[0][0].n;
    assert.equal(Number(after), Number(before)); // atomic: a refused pledge leaves no orphan donation
  });

  test('repeated submissions with the same Idempotency-Key create one pledge and one pickup task', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const sc = await newScenario();
    const key = `p3-${Date.now()}-idem`;
    const a = await pledgeWithPickup(donorA, sc.itemId, 10, { headers: { 'Idempotency-Key': key } });
    const b = await pledgeWithPickup(donorA, sc.itemId, 10, { headers: { 'Idempotency-Key': key } });
    assert.equal(a.status, 201);
    assert.equal(b.status, 200);
    assert.equal(b.body.data.pledge.id, a.body.data.pledge.id);
    assert.equal(b.body.data.pledge.donationRequestId, a.body.data.pledge.donationRequestId);
    const [[{ n }]] = await pool.query('SELECT COUNT(*) n FROM donation_requests WHERE id = ?', [a.body.data.pledge.donationRequestId]);
    assert.equal(Number(n), 1);
    // and the same donor cannot open a second pledge for the same item
    assert.equal((await pledgeWithPickup(donorA, sc.itemId, 5)).status, 409);
  });

  test('CONCURRENCY: simultaneous pledges with pickup never exceed the requirement and leave no orphan donations', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const racers = await Promise.all(Array.from({ length: 6 }, () => createVerifiedUser({ role: 'donor' })));
    const sc = await newScenario({ requested: 20 });
    const results = await Promise.allSettled(racers.map((u) => pledgeService.createPledge(u.user, sc.itemId, { quantity: 6, pickup: pickup() })));
    const won = results.filter((r) => r.status === 'fulfilled');
    assert.equal(won.length, 3, `expected exactly 3 winners (3 x 6 = 18 <= 20), got ${won.length}`);
    results.filter((r) => r.status === 'rejected').forEach((r) => assert.equal(r.reason.code, 'OVER_PLEDGE'));
    const q = await qty(sc.requestId, sc.itemId);
    assert.equal(q.activePledged, 18);
    assert.equal(q.remainingToPledge, 2);
    const [[{ n }]] = await pool.query(
      "SELECT COUNT(*) n FROM donation_requests dr WHERE dr.id IN (SELECT donation_request_id FROM relief_pledges WHERE relief_request_item_id = ?)", [sc.itemId]);
    assert.equal(Number(n), 3);
    const [[{ orphans }]] = await pool.query("SELECT COUNT(*) orphans FROM donation_requests WHERE title LIKE 'Relief: Dry food for Shelter supplies' AND donor_id IN (?) AND id NOT IN (SELECT donation_request_id FROM relief_pledges WHERE donation_request_id IS NOT NULL)", [racers.map((u) => u.user.id)]);
    assert.equal(Number(orphans), 0);
  });

  // ================================================= donor ownership / privacy
  test('a donor cannot change or cancel another donor\'s pledge, and only sees their own', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await pledged(50);
    assert.equal((await api('PATCH', `/pledges/${p.pledgeId}`, { ...as(donorB), body: { quantity: 10 } })).status, 404);
    assert.equal((await api('POST', `/pledges/${p.pledgeId}/cancel`, { ...as(donorB), body: {} })).status, 404);
    assert.equal((await api('GET', `/pledges/${p.pledgeId}`, as(donorB))).status, 404);
    assert.equal((await api('GET', `/pledges/${p.pledgeId}/timeline`, as(donorB))).status, 404);
    assert.equal((await api('GET', `/pledges/${p.pledgeId}`)).status, 401);
    const mine = await api('GET', '/pledges/mine?limit=200', as(donorB));
    assert.ok(!mine.body.data.pledges.some((x) => x.id === p.pledgeId));
    const own = await api('GET', '/pledges/mine?limit=200', as(donorA));
    const found = own.body.data.pledges.find((x) => x.id === p.pledgeId);
    assert.ok(found && found.tracking && found.tracking.taskStatus === 'available');
  });

  test('before a volunteer accepts, the donor can edit the quantity (pickup task stays in sync); after, it is locked', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await pledged(50);
    const ok = await api('PATCH', `/pledges/${p.pledgeId}`, { ...as(donorA), body: { quantity: 30 } });
    assert.equal(ok.status, 200);
    assert.equal((await donationStatus(p.donationId)).quantity, 30);
    assert.equal((await api('PATCH', `/pledges/${p.pledgeId}`, { ...as(donorA), body: { quantity: 101 } })).status, 409);
    await api('POST', `/tasks/${p.pledgeId}/accept`, as(vol1));
    const locked = await api('PATCH', `/pledges/${p.pledgeId}`, { ...as(donorA), body: { quantity: 20 } });
    assert.equal(locked.status, 409);
    assert.equal(locked.body.code, 'PLEDGE_LOCKED');
    assert.equal((await api('PATCH', `/pledges/${p.pledgeId}`, { ...as(donorA), body: { notes: 'gate code 1234' } })).status, 200); // notes still editable
  });

  test('the donor can cancel after a volunteer accepted: pickup cancelled, quantity released, volunteer notified', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await pledged(60);
    await api('POST', `/tasks/${p.pledgeId}/accept`, as(vol1));
    assert.equal((await qty(p.requestId, p.itemId)).remainingToPledge, 40);
    const c = await api('POST', `/pledges/${p.pledgeId}/cancel`, { ...as(donorA), body: { reason: 'Plans changed' } });
    assert.equal(c.status, 200);
    assert.equal(c.body.data.pledge.status, 'cancelled');
    assert.equal(c.body.data.pledge.tracking.taskStatus, 'cancelled');
    const d = await donationStatus(p.donationId);
    assert.equal(d.status, 'cancelled');
    assert.equal(Number(d.is_deleted), 1);
    assert.equal((await qty(p.requestId, p.itemId)).remainingToPledge, 100);
    const hist = await api('GET', '/tasks/mine?group=history', as(vol1));
    assert.ok(hist.body.data.tasks.some((x) => x.pledgeId === p.pledgeId && x.taskStatus === 'cancelled'));
    assert.equal((await api('GET', '/tasks/mine?group=active', as(vol1))).body.data.tasks.some((x) => x.pledgeId === p.pledgeId), false);
    const [[{ n }]] = await pool.query("SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND title = 'Relief pickup cancelled'", [vol1.user.id]);
    assert.ok(Number(n) >= 1);
    // a cancelled task can no longer be actioned
    assert.equal((await api('POST', `/tasks/${p.pledgeId}/on-the-way`, as(vol1))).status >= 400, true);
  });

  // ==================================================== generic donation guards
  test('relief donations are managed only through relief endpoints; normal donations are unaffected', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await pledged(40);
    await assert.rejects(() => donationService.cancelDonation(p.donationId, donorA.user.id), (e) => e.code === 'RELIEF_MANAGED_DONATION');
    await assert.rejects(() => donationService.updateDonation(p.donationId, donorA.user.id, { title: 'Changed title here' }), (e) => e.code === 'RELIEF_MANAGED_DONATION');
    await api('POST', `/tasks/${p.pledgeId}/accept`, as(vol1));
    await api('POST', `/tasks/${p.pledgeId}/schedule`, { ...as(vol1), body: { scheduledAt: new Date(Date.now() + 7200000).toISOString() } });
    await api('POST', `/tasks/${p.pledgeId}/on-the-way`, as(vol1));
    const row = await donationModel.findById(p.donationId);
    await assert.rejects(() => donationService.markPickedUp(row, vol1.user.id), (e) => e.code === 'RELIEF_MANAGED_DONATION');
    await assert.rejects(() => donationService.completeDonation(p.donationId, vol1.user.id), (e) => e.code === 'RELIEF_MANAGED_DONATION');
    // the general browse feed does not list relief pickups
    const feed = await donationModel.findPendingList({ limit: 200, offset: 0 }, {});
    const q = await pledged(10);
    const feed2 = await donationModel.findPendingList({ limit: 200, offset: 0 }, {});
    assert.ok(!feed2.some((d) => d.id === q.donationId) && !feed.some((d) => d.id === p.donationId));
    // regression: an ordinary donation still goes through the full normal lifecycle and can be cancelled
    const normal = await donationService.createDonation(donorA.user.id, validFoodDonationPayload());
    const accepted = await donationService.acceptDonation(normal.id, vol1.user.id);
    const scheduled = await donationService.schedulePickup(accepted, vol1.user.id, new Date(Date.now() + 3600000).toISOString());
    const onWay = await donationService.markOnTheWay(scheduled, vol1.user.id);
    const picked = await donationService.markPickedUp(onWay, vol1.user.id);
    const done = await donationService.completeDonation(picked.id, vol1.user.id);
    assert.equal(done.status, 'completed');
    const other = await donationService.createDonation(donorB.user.id, validFoodDonationPayload());
    await donationService.cancelDonation(other.id, donorB.user.id);
  });

  // =================================================== volunteer queue + privacy
  test('the available queue: eligible volunteers see limited task info; out-of-range, no-base-address and wrong roles do not get it', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await pledged(70);
    const q = await api('GET', '/tasks/available?limit=200', as(vol1));
    assert.equal(q.status, 200);
    const task = q.body.data.tasks.find((x) => x.pledgeId === p.pledgeId);
    assert.ok(task, 'in-range volunteer sees the task');
    assert.equal(task.taskStatus, 'available');
    assert.equal(task.incident.title, 'Flood relief scenario');
    assert.equal(task.request.locationName, 'Govt School Shelter');
    assert.equal(task.item.name, 'Dry food');
    assert.equal(task.quantity.pledged, 70);
    assert.equal(task.pickup.area, 'Gulshan, Dhaka');
    assert.equal(typeof task.distanceKm, 'number');
    const blob = JSON.stringify(task);
    for (const secret of ['+8801711111111', 'House 5, Road 3', 'PRIVATE Dropoff', 'shelter manager', 'Ring the bell', 'donor']) {
      assert.ok(!blob.toLowerCase().includes(secret.toLowerCase()), `available task must not expose "${secret}"`);
    }
    assert.ok(!(await api('GET', '/tasks/available?limit=200', as(farVol))).body.data.tasks.some((x) => x.pledgeId === p.pledgeId));
    const nb = await api('GET', '/tasks/available', as(noBaseVol));
    assert.equal(nb.body.data.needsBaseAddress, true);
    assert.deepEqual(nb.body.data.tasks, []);
    assert.equal((await api('GET', '/tasks/available', as(donorA))).status, 403);
    assert.equal((await api('GET', '/tasks/available')).status, 401);
    // the limited view is also all an unaccepting volunteer gets from the detail endpoint
    const detail = await api('GET', `/tasks/${p.pledgeId}`, as(vol2));
    assert.equal(detail.status, 200);
    assert.ok(!JSON.stringify(detail.body).includes('+8801711111111'));
  });

  test('accepting follows the existing rules (radius, first come first served); only the assignee gets the full pickup/drop-off details', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await pledged(70);
    const far = await api('POST', `/tasks/${p.pledgeId}/accept`, as(farVol));
    assert.ok(far.status >= 400, 'a volunteer outside the coverage radius cannot accept');
    assert.equal((await api('POST', `/tasks/${p.pledgeId}/accept`, as(noBaseVol))).status >= 400, true);
    assert.equal((await api('POST', `/tasks/${p.pledgeId}/accept`, as(donorA))).status, 403);
    assert.equal((await api('GET', '/tasks/available?limit=200', as(vol1))).body.data.tasks.some((x) => x.pledgeId === p.pledgeId), true);

    const ok = await api('POST', `/tasks/${p.pledgeId}/accept`, as(vol1));
    assert.equal(ok.status, 200);
    assert.equal(ok.body.data.task.taskStatus, 'accepted');
    const lost = await api('POST', `/tasks/${p.pledgeId}/accept`, as(vol2));
    assert.ok([409, 422, 400].includes(lost.status) && lost.status !== 200);
    assert.equal((await api('GET', '/tasks/available?limit=200', as(vol2))).body.data.tasks.some((x) => x.pledgeId === p.pledgeId), false);

    const full = (await api('GET', `/tasks/${p.pledgeId}`, as(vol1))).body.data.task;
    assert.equal(full.pickup.address, 'House 5, Road 3, Gulshan, Dhaka');
    assert.equal(full.pickup.contactPhone, '+8801711111111');
    assert.equal(full.dropoff.name, 'Govt School Shelter');
    assert.equal(full.dropoff.address, 'PRIVATE Dropoff Road 9');
    assert.equal(full.dropoff.instructions, 'Ask for the shelter manager');
    // another volunteer's private task record: no read, no update
    assert.equal((await api('GET', `/tasks/${p.pledgeId}`, as(vol2))).status, 404);
    for (const [action, body] of [['schedule', { scheduledAt: new Date(Date.now() + 7200000).toISOString() }], ['on-the-way', {}], ['pickup', { quantity: 1 }],
      ['delivery', { quantity: 1 }], ['failure', { notes: 'trying to meddle' }], ['problem', { notes: 'trying to meddle' }], ['release', {}]]) {
      const r = await api('POST', `/tasks/${p.pledgeId}/${action}`, { ...as(vol2), body });
      assert.equal(r.status, 404, `${action} by a non-assigned volunteer must be 404, got ${r.status}`);
    }
    assert.equal((await api('GET', `/tasks/${p.pledgeId}`, as(admin))).status, 200);
    assert.equal((await donationStatus(p.donationId)).volunteer_id, vol1.user.id);
  });

  // ================================================ status order + quantities
  test('status changes are validated server-side: out-of-order and invalid transitions are rejected', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await pledged(100);
    await api('POST', `/tasks/${p.pledgeId}/accept`, as(vol1));
    const T = (action, body = {}) => api('POST', `/tasks/${p.pledgeId}/${action}`, { ...as(vol1), body });
    assert.equal((await T('pickup', { quantity: 100 })).status, 409); // not on the way yet
    assert.equal((await T('delivery', { quantity: 10 })).status, 409); // nothing collected
    assert.equal((await T('failure', { notes: 'cannot deliver' })).status, 409); // nothing collected
    assert.equal((await T('schedule', { scheduledAt: new Date(Date.now() - 3600000).toISOString() })).status, 422);
    assert.equal((await T('schedule', { scheduledAt: new Date(Date.now() + 7200000).toISOString() })).status, 200);
    assert.equal((await T('on-the-way')).status, 200);
    assert.equal((await T('on-the-way')).status, 409); // already on the way
    assert.equal((await T('pickup', { quantity: 0 })).status, 422);
    assert.equal((await T('pickup', { quantity: 101 })).status, 409);
    assert.equal((await T('pickup', { quantity: 2.5 })).status, 422); // whole-number unit
    assert.equal((await T('pickup', { quantity: 100 })).status, 200);
    assert.equal((await T('pickup', { quantity: 100 })).status, 409); // already picked up
    assert.equal((await T('release')).status, 409); // too late to release
    assert.equal((await T('delivery', { quantity: 101 })).status, 409);
    assert.equal((await T('delivery', { quantity: 0 })).status, 422);
    const hist = (await api('GET', `/pledges/${p.pledgeId}/timeline`, as(admin))).body.data.events.filter((e) => e.kind === 'status').map((e) => e.to);
    assert.deepEqual(hist, ['pending', 'accepted', 'scheduled', 'on_the_way', 'picked_up'].filter((s) => s !== 'pending' || hist[0] === 'pending'));
  });

  test('FULL FLOW: pickup -> delivery REPORT does not count as delivered until an admin verifies it', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await inProgress(100);
    const V = (action, body = {}) => api('POST', `/tasks/${p.pledgeId}/${action}`, { ...as(vol1), body });
    const pick = await V('pickup', { quantity: 100 });
    assert.equal(pick.body.data.task.taskStatus, 'picked_up');
    let q = await qty(p.requestId, p.itemId);
    assert.equal(q.collected, 100);
    assert.equal(q.delivered, 0);
    assert.equal(q.fulfillmentStage, 'fully_pledged'); // pledged/collected is not delivered

    const rep = await V('delivery', { quantity: 100 });
    assert.equal(rep.status, 200);
    assert.equal(rep.body.data.task.taskStatus, 'delivery_reported');
    assert.equal(rep.body.data.task.quantity.pendingVerification, 100);
    q = await qty(p.requestId, p.itemId);
    assert.equal(q.delivered, 0, 'reported delivery must not count as delivered');
    assert.equal(q.pendingVerification, 100);
    assert.equal(q.fulfillmentStage, 'fully_pledged');
    assert.notEqual((await donationStatus(p.donationId)).status, 'completed');
    assert.equal((await api('GET', `/requests/${p.requestId}`, as(admin))).body.data.request.status, 'approved'); // not completed by a report
    // awaiting verification is work for the admin, not a problem to alarm the donor or volunteer about
    assert.equal(rep.body.data.task.hasOpenIssue, false);
    assert.equal((await api('GET', `/pledges/${p.pledgeId}`, as(donorA))).body.data.pledge.tracking.hasOpenIssue, false);
    const adminRow = (await api('GET', '/admin/tasks?attention=true&limit=200', as(admin))).body.data.tasks.find((x) => x.pledgeId === p.pledgeId);
    assert.equal(adminRow.needsAttention, true);

    // only an authorised admin action verifies
    const queue = await api('GET', '/admin/reports', as(admin));
    const report = queue.body.data.reports.find((r) => r.pledgeId === p.pledgeId);
    assert.equal(report.type, 'delivery');
    assert.equal(report.status, 'pending');
    for (const u of [vol1, vol2, donorA]) assert.equal((await api('POST', `/admin/reports/${report.id}/verify`, { ...as(u), body: {} })).status, 403);
    assert.equal((await api('POST', `/admin/reports/${report.id}/verify`, { body: {} })).status, 401);
    assert.equal((await api('POST', `/pledges/${p.pledgeId}/delivery`, { ...as(vol1), body: { quantity: 100 } })).status, 403); // Phase 1 direct entry is closed to volunteers

    const ver = await api('POST', `/admin/reports/${report.id}/verify`, { ...as(admin), body: {} });
    assert.equal(ver.status, 200, JSON.stringify(ver.body));
    assert.equal(ver.body.data.report.status, 'verified');
    q = await qty(p.requestId, p.itemId);
    assert.equal(q.delivered, 100);
    assert.equal(q.pendingVerification, 0);
    assert.equal(q.fulfillmentStage, 'fulfilled');
    assert.equal((await donationStatus(p.donationId)).status, 'completed');
    const pl = (await api('GET', `/pledges/${p.pledgeId}`, as(donorA))).body.data.pledge;
    assert.equal(pl.status, 'delivered');
    assert.equal(pl.tracking.taskStatus, 'completed');
    // a fully delivered + verified request completes — and only now
    assert.equal((await api('GET', `/requests/${p.requestId}`, as(admin))).body.data.request.status, 'completed');
    assert.equal((await api('POST', `/admin/reports/${report.id}/verify`, { ...as(admin), body: {} })).status, 409); // not verifiable twice
  });

  test('PARTIAL: 80 of 100 collected and delivered -> verified 80, pledge partially_fulfilled, 20 released, never "100 delivered"', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await inProgress(100);
    const V = (action, body = {}) => api('POST', `/tasks/${p.pledgeId}/${action}`, { ...as(vol1), body });
    assert.equal((await V('pickup', { quantity: 80 })).status, 422); // a shortfall must be explained
    assert.equal((await V('pickup', { quantity: 80, notes: 'Donor only had 80 packets ready' })).status, 200);
    let q = await qty(p.requestId, p.itemId);
    assert.equal(q.collected, 80);
    assert.equal(q.delivered, 0);
    assert.equal(q.remainingToPledge, 0); // the full 100 stays committed until the task closes
    assert.equal((await V('delivery', { quantity: 81 })).status, 409); // cannot deliver more than collected
    assert.equal((await V('delivery', { quantity: 70 })).status, 422); // 70 != 80 collected: needs an explanation
    const rep = await V('delivery', { quantity: 80 });
    assert.equal(rep.status, 200);
    const report = (await api('GET', '/admin/reports', as(admin))).body.data.reports.find((r) => r.pledgeId === p.pledgeId);
    const ver = await api('POST', `/admin/reports/${report.id}/verify`, { ...as(admin), body: {} });
    assert.equal(ver.status, 200);
    q = await qty(p.requestId, p.itemId);
    assert.equal(q.delivered, 80);
    assert.equal(q.committed, 80);
    assert.equal(q.remainingToPledge, 20); // shortfall released
    assert.equal(q.remainingUnfulfilled, 20);
    assert.equal(q.fulfillmentStage, 'partially_delivered');
    const pl = (await api('GET', `/pledges/${p.pledgeId}`, as(donorA))).body.data.pledge;
    assert.equal(pl.status, 'partially_fulfilled');
    assert.equal(pl.quantityDelivered, 80);
    assert.equal(pl.tracking.taskStatus, 'completed_partial');
    assert.equal((await donationStatus(p.donationId)).status, 'completed');
    assert.equal((await api('GET', `/requests/${p.requestId}`, as(admin))).body.data.request.status, 'approved'); // not fulfilled
    assert.equal((await pledgeWithPickup(donorB, p.itemId, 20)).status, 201); // released quantity is pledgeable again
  });

  test('admin verification can correct a report down (with notes) but never up; rejection counts nothing and allows a corrected resubmission', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await inProgress(100);
    const V = (action, body = {}) => api('POST', `/tasks/${p.pledgeId}/${action}`, { ...as(vol1), body });
    await V('pickup', { quantity: 100 });
    await V('delivery', { quantity: 100 });
    const find = async () => (await api('GET', '/admin/reports', as(admin))).body.data.reports.find((r) => r.pledgeId === p.pledgeId && r.status === 'pending');
    let report = await find();
    assert.equal((await V('delivery', { quantity: 5 })).status, 409); // previous report still awaiting verification
    assert.equal((await api('POST', `/admin/reports/${report.id}/verify`, { ...as(admin), body: { verifiedQuantity: 120 } })).status, 422);
    assert.equal((await api('POST', `/admin/reports/${report.id}/verify`, { ...as(admin), body: { verifiedQuantity: 90 } })).status, 422); // discrepancy needs notes
    assert.equal((await api('POST', `/admin/reports/${report.id}/reject`, { ...as(admin), body: {} })).status, 422); // reason required
    const rej = await api('POST', `/admin/reports/${report.id}/reject`, { ...as(admin), body: { notes: 'Count does not match the shelter log' } });
    assert.equal(rej.status, 200);
    let q = await qty(p.requestId, p.itemId);
    assert.equal(q.delivered, 0);
    assert.equal(q.pendingVerification, 0);
    assert.equal((await api('POST', `/admin/reports/${report.id}/reject`, { ...as(admin), body: { notes: 'again' } })).status, 409);
    // the volunteer corrects and resubmits; the admin verifies a smaller quantity with an explanation
    assert.equal((await V('delivery', { quantity: 95, notes: '5 packets damaged in transit' })).status, 200);
    report = await find();
    const ver = await api('POST', `/admin/reports/${report.id}/verify`, { ...as(admin), body: { verifiedQuantity: 90, notes: 'Shelter log shows 90' } });
    assert.equal(ver.status, 200);
    q = await qty(p.requestId, p.itemId);
    assert.equal(q.delivered, 90);
    assert.equal((await api('GET', `/pledges/${p.pledgeId}`, as(donorA))).body.data.pledge.status, 'partially_fulfilled');
  });

  test('FAILED delivery: nothing counts as delivered; delivery is blocked until an admin resolves; failing the task releases the quantity', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await inProgress(100);
    const V = (action, body = {}) => api('POST', `/tasks/${p.pledgeId}/${action}`, { ...as(vol1), body });
    await V('pickup', { quantity: 100 });
    assert.equal((await V('failure', {})).status, 422); // notes required
    assert.equal((await V('failure', { notes: 'Shelter was closed and unreachable' })).status, 200);
    assert.equal((await V('failure', { notes: 'second report' })).status, 409);
    assert.equal((await V('delivery', { quantity: 100 })).status, 409); // blocked until resolved
    let q = await qty(p.requestId, p.itemId);
    assert.equal(q.delivered, 0);
    const queue = (await api('GET', '/admin/reports?type=failed_delivery', as(admin))).body.data.reports;
    const rep = queue.find((r) => r.pledgeId === p.pledgeId);
    assert.equal(rep.status, 'open');
    assert.equal(rep.notes, 'Shelter was closed and unreachable');
    assert.equal((await api('POST', `/admin/reports/${rep.id}/resolve`, { ...as(vol1), body: { action: 'fail' } })).status, 403);
    assert.equal((await api('POST', `/admin/reports/${rep.id}/resolve`, { ...as(admin), body: { action: 'explode' } })).status, 422);
    const res = await api('POST', `/admin/reports/${rep.id}/resolve`, { ...as(admin), body: { action: 'fail', notes: 'Closing the task' } });
    assert.equal(res.status, 200);
    q = await qty(p.requestId, p.itemId);
    assert.equal(q.delivered, 0);
    assert.equal(q.collected, 0); // failed pledges do not count as collected either
    assert.equal(q.remainingToPledge, 100);
    const pl = (await api('GET', `/pledges/${p.pledgeId}`, as(donorA))).body.data.pledge;
    assert.equal(pl.status, 'failed');
    assert.equal(pl.tracking.taskStatus, 'failed');
    assert.equal((await donationStatus(p.donationId)).status, 'cancelled');
    assert.equal((await api('GET', `/requests/${p.requestId}`, as(admin))).body.data.request.status, 'approved');
    assert.equal((await V('delivery', { quantity: 10 })).status >= 400, true);
  });

  test('a failed delivery can be reopened by an admin so the volunteer can try again', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await inProgress(40);
    const V = (action, body = {}) => api('POST', `/tasks/${p.pledgeId}/${action}`, { ...as(vol1), body });
    await V('pickup', { quantity: 40 });
    await V('failure', { notes: 'Nobody was at the drop-off point' });
    const rep = (await api('GET', '/admin/reports?type=failed_delivery', as(admin))).body.data.reports.find((r) => r.pledgeId === p.pledgeId);
    assert.equal((await api('POST', `/admin/reports/${rep.id}/resolve`, { ...as(admin), body: { action: 'reopen', notes: 'Contact the shelter manager' } })).status, 200);
    assert.equal((await V('delivery', { quantity: 40 })).status, 200);
  });

  test('problem reports reach admins; only the assigned volunteer can file them; admins resolve them', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await pledged(30);
    await api('POST', `/tasks/${p.pledgeId}/accept`, as(vol1));
    assert.equal((await api('POST', `/tasks/${p.pledgeId}/problem`, { ...as(vol2), body: { notes: 'not mine to report' } })).status, 404);
    assert.equal((await api('POST', `/tasks/${p.pledgeId}/problem`, { ...as(vol1), body: { notes: 'x' } })).status, 422);
    const r = await api('POST', `/tasks/${p.pledgeId}/problem`, { ...as(vol1), body: { notes: 'Donor phone is switched off' } });
    assert.equal(r.status, 200);
    assert.equal(r.body.data.task.hasOpenIssue, true);
    const attention = await api('GET', '/admin/tasks?attention=true&limit=200', as(admin));
    assert.ok(attention.body.data.tasks.some((x) => x.pledgeId === p.pledgeId));
    const rep = (await api('GET', '/admin/reports?type=problem', as(admin))).body.data.reports.find((x) => x.pledgeId === p.pledgeId);
    assert.equal((await api('POST', `/admin/reports/${rep.id}/resolve`, { ...as(admin), body: { action: 'close', notes: 'Donor reached' } })).status, 200);
    assert.equal((await api('GET', '/admin/tasks?attention=true&limit=200', as(admin))).body.data.tasks.some((x) => x.pledgeId === p.pledgeId), false);
    assert.equal((await api('GET', '/admin/tasks', as(vol1))).status, 403);
  });

  test('a volunteer can release a task before pickup; an admin can reassign; the pledge stays intact', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await pledged(50);
    await api('POST', `/tasks/${p.pledgeId}/accept`, as(vol1));
    assert.equal((await api('POST', `/tasks/${p.pledgeId}/release`, { ...as(vol2), body: {} })).status, 404);
    const rel = await api('POST', `/tasks/${p.pledgeId}/release`, { ...as(vol1), body: { reason: 'Vehicle broke down' } });
    assert.equal(rel.status, 200);
    const d = await donationStatus(p.donationId);
    assert.equal(d.status, 'pending');
    assert.equal(d.volunteer_id, null);
    assert.equal((await api('GET', `/pledges/${p.pledgeId}`, as(donorA))).body.data.pledge.status, 'pledged');
    assert.equal((await qty(p.requestId, p.itemId)).activePledged, 50); // commitment unchanged
    assert.equal((await api('GET', `/tasks/${p.pledgeId}`, as(vol1))).body.data.task.pickup?.address, undefined); // released -> limited view again
    assert.equal((await api('POST', `/tasks/${p.pledgeId}/accept`, as(vol2))).status, 200);
    const re = await api('POST', `/tasks/${p.pledgeId}/release`, { ...as(admin), body: { reason: 'Reassigning' } });
    assert.equal(re.status, 200);
    assert.equal((await donationStatus(p.donationId)).status, 'pending');
    assert.equal((await api('POST', `/tasks/${p.pledgeId}/release`, { ...as(admin), body: {} })).status, 409); // already pending
    assert.equal((await api('POST', `/tasks/${p.pledgeId}/accept`, as(vol1))).status, 200);
  });

  test('verification can be switched off by policy: reports then apply immediately and are recorded as verified', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    process.env.RELIEF_REQUIRE_DELIVERY_VERIFICATION = 'false';
    try {
      const p = await inProgress(30);
      await api('POST', `/tasks/${p.pledgeId}/pickup`, { ...as(vol1), body: { quantity: 30 } });
      const r = await api('POST', `/tasks/${p.pledgeId}/delivery`, { ...as(vol1), body: { quantity: 30 } });
      assert.equal(r.status, 200);
      const q = await qty(p.requestId, p.itemId);
      assert.equal(q.delivered, 30);
      assert.equal(q.pendingVerification, 0);
      assert.equal((await donationStatus(p.donationId)).status, 'completed');
      assert.equal((await api('GET', `/pledges/${p.pledgeId}`, as(donorA))).body.data.pledge.status, 'delivered');
    } finally {
      delete process.env.RELIEF_REQUIRE_DELIVERY_VERIFICATION;
    }
  });

  // ============================================== timeline, admin views, audit
  test('timeline: admins see internal notes and actors; donors and volunteers see their own task without reviewer details; strangers get 404', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await inProgress(100);
    await api('POST', `/tasks/${p.pledgeId}/pickup`, { ...as(vol1), body: { quantity: 100 } });
    await api('POST', `/tasks/${p.pledgeId}/delivery`, { ...as(vol1), body: { quantity: 100, notes: 'Handed to the shelter manager' } });
    const rep = (await api('GET', '/admin/reports', as(admin))).body.data.reports.find((r) => r.pledgeId === p.pledgeId);
    await api('POST', `/admin/reports/${rep.id}/verify`, { ...as(admin), body: { notes: 'Matches shelter log' } });
    const adm = (await api('GET', `/pledges/${p.pledgeId}/timeline`, as(admin))).body.data.events;
    const admDelivery = adm.find((e) => e.kind === 'report' && e.type === 'delivery');
    assert.equal(admDelivery.notes, 'Handed to the shelter manager');
    assert.equal(admDelivery.reviewNotes, 'Matches shelter log');
    assert.ok(adm.some((e) => e.kind === 'status' && e.to === 'completed'));
    const don = (await api('GET', `/pledges/${p.pledgeId}/timeline`, as(donorA))).body.data.events;
    const donDelivery = don.find((e) => e.kind === 'report' && e.type === 'delivery');
    assert.equal(donDelivery.quantity, 100);
    assert.ok(!('notes' in donDelivery) && !('reviewNotes' in donDelivery) && !('reviewerName' in donDelivery));
    assert.equal((await api('GET', `/pledges/${p.pledgeId}/timeline`, as(vol1))).status, 200);
    assert.equal((await api('GET', `/pledges/${p.pledgeId}/timeline`, as(vol2))).status, 404);
    assert.equal((await api('GET', `/pledges/${p.pledgeId}/timeline`, as(donorB))).status, 404);
  });

  test('the donor sees pickup progress and who is helping, but never the volunteer\'s contact details', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await inProgress(10);
    const tr = (await api('GET', `/pledges/${p.pledgeId}`, as(donorA))).body.data.pledge.tracking;
    assert.equal(tr.taskStatus, 'on_the_way');
    assert.equal(tr.volunteerName, vol1.user.name);
    const blob = JSON.stringify(tr);
    assert.ok(!blob.includes(vol1.user.email));
    assert.ok(!/phone/i.test(Object.keys(tr).join(',')));
  });

  test('audit trail records task events and verification without secrets; admin queue/task lists are paginated', async (t) => {
    if (!dbReady) return t.skip('no test database reachable');
    const p = await inProgress(20);
    await api('POST', `/tasks/${p.pledgeId}/pickup`, { ...as(vol1), body: { quantity: 20 } });
    await api('POST', `/tasks/${p.pledgeId}/delivery`, { ...as(vol1), body: { quantity: 20 } });
    const rep = (await api('GET', '/admin/reports', as(admin))).body.data.reports.find((r) => r.pledgeId === p.pledgeId);
    await api('POST', `/admin/reports/${rep.id}/verify`, { ...as(admin), body: {} });
    const [rows] = await pool.query("SELECT action, user_id, metadata FROM audit_logs WHERE action LIKE 'relief_%' ORDER BY id DESC LIMIT 300");
    const actions = new Set(rows.map((r) => r.action));
    for (const a of ['relief_task_accepted', 'relief_task_status_updated', 'relief_pickup_reported', 'relief_delivery_reported', 'relief_delivery_verified']) {
      assert.ok(actions.has(a), `missing audit action ${a}`);
    }
    const ver = rows.find((r) => r.action === 'relief_delivery_verified' && JSON.parse(r.metadata).pledgeId === p.pledgeId);
    assert.equal(ver.user_id, admin.user.id);
    assert.equal(JSON.parse(ver.metadata).verified, 20);
    const blob = JSON.stringify(rows).toLowerCase();
    for (const secret of ['password', 'authorization', 'secret']) assert.ok(!blob.includes(secret), `audit data must not contain "${secret}"`);
    const page = await api('GET', '/admin/reports?status=verified&limit=1&page=1', as(admin));
    assert.equal(page.body.data.reports.length, 1);
    assert.ok(page.body.meta.totalItems >= 1);
    assert.equal((await api('GET', '/admin/reports?type=bogus', as(admin))).status, 422);
  });
});
