const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { stripUseStatements } = require('../../scripts/migrate');

describe('migration runner database safety', () => {
  test('removes USE statements (any case, optional backticks/whitespace) but nothing else', () => {
    const out = stripUseStatements('CREATE TABLE a (id INT);\nUSE portionbridge;\n  use `other_db` ;\nINSERT INTO a VALUES (1);\n');
    assert.ok(!/^\s*use\s/im.test(out));
    assert.match(out, /CREATE TABLE a/);
    assert.match(out, /INSERT INTO a VALUES \(1\)/);
  });

  test('does not touch USE inside other text and leaves SQL without USE unchanged', () => {
    const sql = "SELECT 'USE portionbridge;' AS note;\nSELECT 1;";
    assert.equal(stripUseStatements(sql), sql);
  });

  test('every migration the runner can apply is free of USE once stripped, and files exist', () => {
    const dir = path.join(__dirname, '../../../database/migrations');
    const files = fs.readdirSync(dir).filter((f) => /^migration_\d+.*\.sql$/.test(f) && !f.endsWith('.down.sql'));
    assert.ok(files.length >= 20);
    files.forEach((f) => assert.ok(!/^\s*use\s+/im.test(stripUseStatements(fs.readFileSync(path.join(dir, f), 'utf8'))), f));
  });
});
