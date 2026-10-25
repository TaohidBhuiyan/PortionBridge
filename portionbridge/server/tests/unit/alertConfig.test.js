const { test, describe, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const alertConfig = require('../../config/alerts');
const { canonicalDistrict, BD_DISTRICTS } = require('../../config/bdDistricts');

describe('alert policy config', () => {
  const saved = process.env.ALERT_AUTO_LOCAL_MIN_SEVERITY;
  afterEach(() => { if (saved === undefined) delete process.env.ALERT_AUTO_LOCAL_MIN_SEVERITY; else process.env.ALERT_AUTO_LOCAL_MIN_SEVERITY = saved; });

  test('auto-local threshold defaults to high, can be raised/lowered, and can be switched off', () => {
    delete process.env.ALERT_AUTO_LOCAL_MIN_SEVERITY;
    assert.equal(alertConfig.autoLocalMinSeverity(), 'high');
    process.env.ALERT_AUTO_LOCAL_MIN_SEVERITY = 'critical';
    assert.equal(alertConfig.autoLocalMinSeverity(), 'critical');
    process.env.ALERT_AUTO_LOCAL_MIN_SEVERITY = 'off';
    assert.equal(alertConfig.autoLocalMinSeverity(), null);
    process.env.ALERT_AUTO_LOCAL_MIN_SEVERITY = 'nonsense';
    assert.equal(alertConfig.autoLocalMinSeverity(), 'high');
  });

  test('district list has 64 unique entries and normalises case/whitespace', () => {
    assert.equal(BD_DISTRICTS.length, 64);
    assert.equal(new Set(BD_DISTRICTS).size, 64);
    assert.equal(canonicalDistrict('  sylhet '), 'Sylhet');
    assert.equal(canonicalDistrict("cox's bazar"), "Cox's Bazar");
    assert.equal(canonicalDistrict('Atlantis'), null);
    assert.equal(canonicalDistrict(42), null);
  });
});
