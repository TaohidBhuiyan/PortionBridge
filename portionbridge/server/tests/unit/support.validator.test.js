const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { validationResult } = require('express-validator');

const {
  createTicketValidationRules,
  postMessageValidationRules,
  updateStatusValidationRules,
  adminUpdateTicketValidationRules,
} = require('../../validators/support.validator');

async function runRules(rules, req) {
  for (const rule of rules) {
    await rule.run(req);
  }
  return validationResult(req);
}

describe('Support Ticket Validators', () => {
  describe('createTicketValidationRules', () => {
    test('passes on valid input', async () => {
      const req = {
        body: {
          subject: 'Need help with pickup',
          category: 'pickup',
          priority: 'high',
          body: 'The volunteer did not arrive at the scheduled time.',
          donationId: 12,
        },
      };

      const result = await runRules(createTicketValidationRules, req);
      assert.equal(result.isEmpty(), true);
    });

    test('fails on empty subject or invalid category', async () => {
      const req = {
        body: {
          subject: '',
          category: 'invalid_category',
          body: 'Some details',
        },
      };

      const result = await runRules(createTicketValidationRules, req);
      assert.equal(result.isEmpty(), false);
      const errors = result.array();
      assert.equal(errors.some((e) => e.path === 'subject'), true);
      assert.equal(errors.some((e) => e.path === 'category'), true);
    });

    test('fails if subject exceeds 150 chars', async () => {
      const req = {
        body: {
          subject: 'a'.repeat(151),
          category: 'account',
          body: 'Account issue',
        },
      };

      const result = await runRules(createTicketValidationRules, req);
      assert.equal(result.isEmpty(), false);
      assert.equal(result.array().some((e) => e.path === 'subject'), true);
    });
  });

  describe('postMessageValidationRules', () => {
    test('rejects empty message body', async () => {
      const req = { body: { body: '   ' } };
      const result = await runRules(postMessageValidationRules, req);
      assert.equal(result.isEmpty(), false);
    });

    test('accepts valid message body', async () => {
      const req = { body: { body: 'Hello, here is more context.' } };
      const result = await runRules(postMessageValidationRules, req);
      assert.equal(result.isEmpty(), true);
    });
  });

  describe('updateStatusValidationRules', () => {
    test('allows user to set closed or open', async () => {
      const req1 = { body: { status: 'closed' } };
      const res1 = await runRules(updateStatusValidationRules, req1);
      assert.equal(res1.isEmpty(), true);

      const req2 = { body: { status: 'open' } };
      const res2 = await runRules(updateStatusValidationRules, req2);
      assert.equal(res2.isEmpty(), true);
    });

    test('rejects setting in_progress directly by user', async () => {
      const req = { body: { status: 'in_progress' } };
      const result = await runRules(updateStatusValidationRules, req);
      assert.equal(result.isEmpty(), false);
    });
  });
});
