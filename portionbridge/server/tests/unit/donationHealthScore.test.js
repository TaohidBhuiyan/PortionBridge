const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { deriveDonationFlags, computeDonationHealthScore } = require('../../utils/donationHealthScore');

function baseDonation(overrides = {}) {
  return {
    status: 'accepted',
    scheduled_at: null,
    created_at: new Date().toISOString(),
    volunteer_id: 5,
    assigned_member_id: null,
    assignment_mode: 'individual',
    is_deleted: false,
    donor_verified: true,
    ...overrides,
  };
}

describe('donationHealthScore', () => {
  test('a healthy, on-track donation scores 100 with no reasons deducted', () => {
    const donation = baseDonation({
      status: 'scheduled',
      scheduled_at: new Date(Date.now() + 30 * 60000).toISOString(), // 30 min from now
    });
    const flags = deriveDonationFlags(donation, {});
    const { score, riskLevel, reasons } = computeDonationHealthScore(donation, flags);

    assert.equal(score, 100);
    assert.equal(riskLevel, 'low');
    assert.deepEqual(reasons, [{ label: 'No issues detected', impact: 0 }]);
  });

  test('flags an overdue scheduled pickup as delayed', () => {
    const donation = baseDonation({
      status: 'scheduled',
      scheduled_at: new Date(Date.now() - 30 * 60000).toISOString(), // 30 min ago
    });
    const flags = deriveDonationFlags(donation, {});

    assert.equal(flags.isDelayedPickup, true);
    const { score, reasons } = computeDonationHealthScore(donation, flags);
    assert.equal(score, 75); // 100 - 25
    assert.ok(reasons.some((r) => /overdue/i.test(r.label)));
  });

  test('does not flag a pickup only a few minutes late (grace period)', () => {
    const donation = baseDonation({
      status: 'accepted',
      scheduled_at: new Date(Date.now() - 5 * 60000).toISOString(), // 5 min ago
    });
    const flags = deriveDonationFlags(donation, {});
    assert.equal(flags.isDelayedPickup, false);
  });

  test('flags a long-pending, unassigned donation', () => {
    const donation = baseDonation({
      status: 'pending',
      volunteer_id: null,
      created_at: new Date(Date.now() - 3 * 60 * 60000).toISOString(), // 3 hours ago
    });
    const flags = deriveDonationFlags(donation, {});
    assert.equal(flags.isUnassigned, true);

    const { score, riskLevel } = computeDonationHealthScore(donation, flags);
    assert.equal(score, 80); // 100 - 20
    assert.equal(riskLevel, 'medium');
  });

  test('an open report drops the score into medium risk when nothing else is wrong', () => {
    const donation = baseDonation({ status: 'on_the_way' });
    // Explicitly signal "not stale, volunteer online" so only the report
    // deduction is being tested here (see deriveDonationFlags — a
    // missing lastLocationUpdateAt legitimately means "never shared",
    // which is correctly its OWN stale-location flag).
    const flags = deriveDonationFlags(donation, {
      hasOpenReport: true,
      assignedPersonOnline: true,
      lastLocationUpdateAt: Date.now(),
    });

    const { score, riskLevel, reasons } = computeDonationHealthScore(donation, flags);
    assert.equal(score, 70); // 100 - 30
    assert.equal(riskLevel, 'medium');
    assert.ok(reasons.some((r) => /report/i.test(r.label)));
  });

  test('multiple simultaneous issues stack deductions into high risk', () => {
    const donation = baseDonation({
      status: 'picked_up',
      donor_verified: false,
    });
    const flags = deriveDonationFlags(donation, {
      hasOpenReport: true,
      pickedUpAt: new Date(Date.now() - 120 * 60000).toISOString(), // 2 hours ago
      assignedPersonOnline: false,
      lastLocationUpdateAt: Date.now() - 20 * 60000, // 20 min ago, stale
    });

    assert.equal(flags.isDelayedDelivery, true);
    assert.equal(flags.isInactiveVolunteer, true);
    assert.equal(flags.isStaleLocation, true);

    const { score, riskLevel } = computeDonationHealthScore(donation, flags);
    // 100 - 10 (unverified) - 25 (delayed delivery) - 30 (report) - 15 (inactive) - 10 (stale) = 10
    assert.equal(score, 10);
    assert.equal(riskLevel, 'high');
  });

  test('score never drops below 0', () => {
    const donation = baseDonation({
      status: 'picked_up',
      donor_verified: false,
      volunteer_id: null,
    });
    const flags = deriveDonationFlags(donation, {
      hasOpenReport: true,
      pickedUpAt: new Date(Date.now() - 500 * 60000).toISOString(),
      assignedPersonOnline: false,
      lastLocationUpdateAt: null,
    });
    const { score } = computeDonationHealthScore(donation, flags);
    assert.ok(score >= 0);
  });

  test('a completed donation is not flagged as an active mission', () => {
    const donation = baseDonation({ status: 'completed' });
    const flags = deriveDonationFlags(donation, {});
    assert.equal(flags.isActiveMission, false);
    assert.equal(flags.isInactiveVolunteer, false);
    assert.equal(flags.isStaleLocation, false);
  });

  test('a soft-deleted (cancelled) donation is never flagged for anything', () => {
    const donation = baseDonation({
      status: 'accepted',
      scheduled_at: new Date(Date.now() - 60 * 60000).toISOString(),
      is_deleted: true,
    });
    const flags = deriveDonationFlags(donation, {});
    assert.equal(flags.isActiveMission, false);
    assert.equal(flags.isDelayedPickup, false);
  });
});