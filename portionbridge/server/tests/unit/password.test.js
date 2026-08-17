const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { validatePasswordPolicy, hashPassword, comparePassword } = require('../../utils/password');

describe('password policy', () => {
  test('rejects empty password', () => {
    const result = validatePasswordPolicy('');
    assert.equal(result.valid, false);
  });

  test('rejects passwords shorter than the minimum length', () => {
    const result = validatePasswordPolicy('Sh0rt1!');
    assert.equal(result.valid, false);
    assert.match(result.message, /at least/i);
  });

  test('rejects passwords longer than the maximum length', () => {
    const result = validatePasswordPolicy(`Aa1${'x'.repeat(65)}`);
    assert.equal(result.valid, false);
    assert.match(result.message, /exceed/i);
  });

  test('rejects passwords with leading/trailing whitespace', () => {
    const result = validatePasswordPolicy(' StrongPass123');
    assert.equal(result.valid, false);
    assert.match(result.message, /space/i);
  });

  test('rejects passwords missing an uppercase letter', () => {
    const result = validatePasswordPolicy('lowercase123');
    assert.equal(result.valid, false);
    assert.match(result.message, /uppercase/i);
  });

  test('rejects passwords missing a lowercase letter', () => {
    const result = validatePasswordPolicy('UPPERCASE123');
    assert.equal(result.valid, false);
    assert.match(result.message, /lowercase/i);
  });

  test('rejects passwords missing a number', () => {
    const result = validatePasswordPolicy('NoNumbersHere');
    assert.equal(result.valid, false);
    assert.match(result.message, /number/i);
  });

  test('rejects well-known common/weak passwords even if they satisfy the character rules', () => {
    // Password1 satisfies length/case/number rules but is a very common
    // weak password and must still be rejected.
    const result = validatePasswordPolicy('Password1');
    assert.equal(result.valid, false);
    assert.match(result.message, /common/i);
  });

  test('accepts a reasonably strong, non-common password', () => {
    const result = validatePasswordPolicy('Correct7Horse');
    assert.equal(result.valid, true);
  });

  test('hashPassword + comparePassword round-trip correctly', async () => {
    const plain = 'StrongPass123!';
    const hashed = await hashPassword(plain);
    assert.notEqual(hashed, plain);
    assert.equal(await comparePassword(plain, hashed), true);
    assert.equal(await comparePassword('WrongPassword1', hashed), false);
  });
});
