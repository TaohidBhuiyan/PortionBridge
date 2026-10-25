const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/**
 * Source-integrity guard (Phase 6 repair): unresolved git merge-conflict markers silently shipped in three
 * scripts. Fail the suite if a marker appears anywhere in the application source, and make sure every server
 * JavaScript file at least parses (without executing it).
 */
const ROOT = path.join(__dirname, '../../..');                 // .../portionbridge
const SKIP = new Set(['node_modules', 'dist', 'coverage', '.git', 'uploads', 'backups']);
const TEXT = /\.(js|jsx|json|sql|md|yml|yaml|html|css|bat|example)$/;
const MARKER = /^(<{7}( .*)?|>{7}( .*)?|={7})\s*$/;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (TEXT.test(entry.name) || entry.name.startsWith('.env')) out.push(full);
  }
  return out;
}

describe('source integrity', () => {
  const files = walk(ROOT);

  test('no unresolved merge-conflict markers in any source, SQL, config or doc file', () => {
    assert.ok(files.length > 100);
    const offenders = [];
    for (const f of files) {
      fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
        // "=======" alone is also a Markdown/ASCII rule, so only count it in code/SQL/config files
        const isRule = /^={7}\s*$/.test(line) && /\.(md)$/.test(f);
        if (MARKER.test(line) && !isRule) offenders.push(`${path.relative(ROOT, f)}:${i + 1}`);
      });
    }
    assert.deepEqual(offenders.slice(0, 10), []);
  });

  test('every server JavaScript file parses (checked without executing it)', () => {
    const serverFiles = files.filter((f) => f.includes(`${path.sep}server${path.sep}`) && f.endsWith('.js'));
    assert.ok(serverFiles.length > 100);
    const broken = [];
    for (const f of serverFiles) {
      const source = fs.readFileSync(f, 'utf8').replace(/^#!.*/, '');
      try { new vm.Script(`(function (exports, require, module, __filename, __dirname) {${source}\n})`, { filename: f }); }
      catch (err) { broken.push(`${path.relative(ROOT, f)}: ${err.message}`); }
    }
    assert.deepEqual(broken, []);
  });
});
