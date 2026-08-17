const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');

// Token generation reads secrets from env at call time, so set safe test
// values before requiring the module if they're not already present
// (e.g. when this file is run standalone rather than via `npm test`,
// which loads server/.env first).
before(() => {
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_access_secret_needs_to_be_at_least_32chars';
  process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
});

const {
  generateAccessToken,
  verifyAccessToken,
  generateOpaqueToken,
  hashToken,
  generateCsrfToken,
  timingSafeEqualHex,
} = require('../../utils/token');

describe('access tokens', () => {
  test('generates a verifiable token carrying the given payload', () => {
    const token = generateAccessToken({ userId: 42, role: 'donor' });
    const decoded = verifyAccessToken(token);
    assert.equal(decoded.userId, 42);
    assert.equal(decoded.role, 'donor');
  });

  test('rejects a tampered token', () => {
    const token = generateAccessToken({ userId: 42 });
    const tampered = token.slice(0, -2) + (token.slice(-2) === 'aa' ? 'bb' : 'aa');
    assert.throws(() => verifyAccessToken(tampered));
  });

  test('rejects a token signed with a different secret', () => {
    const jwt = require('jsonwebtoken');
    const foreignToken = jwt.sign({ userId: 42 }, 'a-completely-different-secret');
    assert.throws(() => verifyAccessToken(foreignToken));
  });
});

describe('opaque refresh tokens', () => {
  test('generates a random hex string of the expected length', () => {
    const token = generateOpaqueToken(48);
    assert.equal(token.length, 96); // 48 bytes -> 96 hex chars
    assert.match(token, /^[0-9a-f]+$/);
  });

  test('generates different tokens on each call', () => {
    const a = generateOpaqueToken();
    const b = generateOpaqueToken();
    assert.notEqual(a, b);
  });

  test('hashToken is deterministic and one-way', () => {
    const raw = 'some-raw-refresh-token';
    const hash1 = hashToken(raw);
    const hash2 = hashToken(raw);
    assert.equal(hash1, hash2);
    assert.notEqual(hash1, raw);
    assert.equal(hash1.length, 64); // sha256 hex digest length
  });

  test('different raw tokens hash to different values', () => {
    assert.notEqual(hashToken('token-a'), hashToken('token-b'));
  });
});

describe('CSRF token comparison', () => {
  test('generateCsrfToken produces a 64-char hex string', () => {
    const token = generateCsrfToken();
    assert.equal(token.length, 64);
    assert.match(token, /^[0-9a-f]+$/);
  });

  test('timingSafeEqualHex returns true for identical strings', () => {
    const token = generateCsrfToken();
    assert.equal(timingSafeEqualHex(token, token), true);
  });

  test('timingSafeEqualHex returns false for different strings of equal length', () => {
    const a = generateCsrfToken();
    const b = generateCsrfToken();
    assert.equal(timingSafeEqualHex(a, b), false);
  });

  test('timingSafeEqualHex returns false for mismatched lengths without throwing', () => {
    assert.equal(timingSafeEqualHex('abc', 'abcd'), false);
  });

  test('timingSafeEqualHex returns false for non-string input without throwing', () => {
    assert.equal(timingSafeEqualHex(null, undefined), false);
  });
});
