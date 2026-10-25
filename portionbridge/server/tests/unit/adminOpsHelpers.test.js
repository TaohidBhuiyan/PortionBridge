const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { csvCell, toCsv } = require('../../services/adminOpsReports.service');
const { divisionOf, districtsOfDivision, DIVISIONS } = require('../../config/bdDivisions');
const { BD_DISTRICTS } = require('../../config/bdDistricts');

describe('admin operations helpers', () => {
  test('csvCell neutralises spreadsheet formulas and escapes quotes, commas and newlines', () => {
    assert.equal(csvCell('=SUM(A1)'), "'=SUM(A1)");
    assert.equal(csvCell('+1'), "'+1");
    assert.equal(csvCell('-2'), "'-2");
    assert.equal(csvCell('@cmd'), "'@cmd");
    assert.equal(csvCell('a,b'), '"a,b"');
    assert.equal(csvCell('say "hi"'), '"say ""hi"""');
    assert.equal(csvCell('line1\nline2'), '"line1\nline2"');
    assert.equal(csvCell(null), '');
    assert.equal(csvCell(0), '0');
    assert.equal(csvCell(new Date('2026-10-20T00:00:00Z')), '2026-10-20T00:00:00.000Z');
  });

  test('toCsv writes a header and one line per row, with a BOM for spreadsheet apps', () => {
    const out = toCsv(['id', 'title'], [{ id: 1, title: 'A' }, { id: 2, title: '=x' }]);
    assert.ok(out.startsWith('\uFEFFid,title\r\n1,A\r\n2,\'=x\r\n'));
  });

  test('every district belongs to exactly one division', () => {
    const all = Object.values(DIVISIONS).flat();
    assert.equal(new Set(all).size, 64);
    BD_DISTRICTS.forEach((d) => assert.ok(divisionOf(d), d));
    assert.equal(divisionOf('sylhet'), 'Sylhet');
    assert.equal(divisionOf('Kurigram'), 'Rangpur');
    assert.equal(divisionOf('Nowhere'), null);
    assert.ok(districtsOfDivision('dhaka').includes('Gazipur'));
    assert.equal(districtsOfDivision('Atlantis'), null);
  });
});
