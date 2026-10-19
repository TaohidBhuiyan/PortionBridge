const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  parseQuantity, dbToMilli, milliToDb, milliToNumber, isValidForUnit, normalizeItemKey,
  buildQuantitySummary, buildRequestSummary,
} = require('../../utils/reliefQuantity');

describe('relief quantity: parsing and exact arithmetic', () => {
  test('parseQuantity accepts positive decimals with up to 3 places', () => {
    assert.equal(parseQuantity(5), 5000);
    assert.equal(parseQuantity('12.5'), 12500);
    assert.equal(parseQuantity('0.001'), 1);
    assert.equal(parseQuantity(0.1), 100);
    assert.equal(parseQuantity('999999999.999'), 999999999999);
  });

  test('parseQuantity rejects zero, negatives, NaN, exponent, >3 decimals, non-numeric types', () => {
    for (const bad of [0, '0', '0.000', -1, '-5', NaN, Infinity, '1e3', 1e21, '1.2345', 'abc', '', ' ', null, undefined, true, [], {}, '1,5', '1000000000']) {
      assert.equal(parseQuantity(bad), null, `should reject ${JSON.stringify(bad)}`);
    }
    assert.equal(parseQuantity(0, { allowZero: true }), 0);
  });

  test('milli arithmetic is exact where floats are not (0.1 + 0.2)', () => {
    assert.notEqual(0.1 + 0.2, 0.3);
    assert.equal(parseQuantity(0.1) + parseQuantity(0.2), parseQuantity(0.3));
    assert.equal(milliToNumber(parseQuantity(0.1) + parseQuantity(0.2)), 0.3);
  });

  test('db <-> milli round trips', () => {
    assert.equal(dbToMilli('10.500'), 10500);
    assert.equal(dbToMilli(null), 0);
    assert.equal(milliToDb(10500), '10.500');
    assert.equal(milliToDb(7), '0.007');
    assert.equal(milliToDb(3000), '3.000');
  });

  test('indivisible units must be whole; kg and liter may be fractional', () => {
    assert.equal(isValidForUnit(2500, 'piece'), false);
    assert.equal(isValidForUnit(2000, 'packet'), true);
    assert.equal(isValidForUnit(2500, 'kg'), true);
    assert.equal(isValidForUnit(500, 'liter'), true);
    assert.equal(isValidForUnit(1500, 'box'), false);
    assert.equal(isValidForUnit(1500, 'set'), false);
  });

  test('normalizeItemKey collapses case and whitespace', () => {
    assert.equal(normalizeItemKey('  Dry   FOOD '), 'dry food');
  });
});

describe('relief quantity: summary rules', () => {
  const base = { requested: '100.000', activePledged: '0', collected: '0', delivered: '0' };

  test('open item', () => {
    const s = buildQuantitySummary(base);
    assert.equal(s.fulfillmentStage, 'open');
    assert.equal(s.remainingToPledge, 100);
    assert.equal(s.remainingUnfulfilled, 100);
  });

  test('fully pledged is NOT fulfilled', () => {
    const s = buildQuantitySummary({ ...base, activePledged: '100' });
    assert.equal(s.fulfillmentStage, 'fully_pledged');
    assert.equal(s.remainingToPledge, 0);
    assert.equal(s.remainingUnfulfilled, 100);
  });

  test('delivered part of an active pledge is not double counted', () => {
    // one pledge of 100: outstanding (pledged - delivered) = 60, delivered = 40
    const s = buildQuantitySummary({ ...base, activePledged: '60', collected: '40', delivered: '40' });
    assert.equal(s.committed, 100);
    assert.equal(s.remainingToPledge, 0);
    assert.equal(s.remainingUnfulfilled, 60);
    assert.equal(s.fulfillmentStage, 'partially_delivered');
  });

  test('fulfilled only when delivered >= requested', () => {
    assert.equal(buildQuantitySummary({ ...base, delivered: '100', collected: '100' }).fulfillmentStage, 'fulfilled');
  });

  test('remaining never negative, even with inconsistent input', () => {
    const s = buildQuantitySummary({ ...base, activePledged: '150' });
    assert.equal(s.remainingToPledge, 0);
  });

  test('cancelled item stage', () => {
    assert.equal(buildQuantitySummary({ ...base, itemStatus: 'cancelled' }).fulfillmentStage, 'cancelled');
  });

  test('request roll-up counts only active items and requires >= 1 item', () => {
    assert.equal(buildRequestSummary([]).isFullyFulfilled, false);
    const done = buildQuantitySummary({ ...base, delivered: '100', collected: '100' });
    const open = buildQuantitySummary(base);
    const gone = buildQuantitySummary({ ...base, itemStatus: 'cancelled' });
    assert.equal(buildRequestSummary([done, gone]).isFullyFulfilled, true);
    assert.equal(buildRequestSummary([done, open]).isFullyFulfilled, false);
    assert.equal(buildRequestSummary([done, open, gone]).totalItems, 2);
  });
});
