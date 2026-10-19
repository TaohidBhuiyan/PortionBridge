import { describe, it, expect } from 'vitest';
import {
  isValidCoordinate, hasMapLocation, haversineKm, groupByPosition, buildIncidentParams,
  countActiveFilters, DEFAULT_FILTERS, computeProgress, formatQuantity, safeHttpUrl, formatDateTime,
  apiErrorMessage, toNumber, SCOPE_OPTIONS, validatePledgeQuantity, newIdempotencyKey, TASK_STATUS_LABELS,
  PLEDGE_STATUS_LABELS, ACTIVE_TASK_STATUSES,
} from './relief';
import { BD_DISTRICTS } from './bdDistricts';

describe('coordinate validation', () => {
  it('accepts real positions, including numeric strings from the API', () => {
    expect(isValidCoordinate(24.91, 91.83)).toBe(true);
    expect(isValidCoordinate('24.91', '91.83')).toBe(true);
  });
  it('rejects missing, non-numeric, out-of-range and (0,0) positions', () => {
    for (const [a, b] of [[null, 91], [24, undefined], ['x', 'y'], [91, 10], [10, 181], [NaN, 5], [0, 0], ['', '']]) {
      expect(isValidCoordinate(a, b)).toBe(false);
    }
  });
  it('hasMapLocation is false for incidents without coordinates', () => {
    expect(hasMapLocation({ latitude: null, longitude: null })).toBe(false);
    expect(hasMapLocation(undefined)).toBe(false);
    expect(hasMapLocation({ latitude: 23.8, longitude: 90.4 })).toBe(true);
  });
});

describe('distance and marker spreading', () => {
  it('haversine distance Dhaka -> Sylhet is roughly 200 km', () => {
    const km = haversineKm({ lat: 23.8103, lng: 90.4125 }, { lat: 24.8949, lng: 91.8687 });
    expect(km).toBeGreaterThan(170);
    expect(km).toBeLessThan(215);
    expect(haversineKm({ lat: 1, lng: 1 }, { lat: 1, lng: 1 })).toBe(0);
  });
  it('groups incidents that share one approximate position (most severe first) and keeps others separate', () => {
    const at = (id, severity, lat, lng) => ({ incident: { id, severity }, lat, lng });
    const groups = groupByPosition([at(1, 'low', 24.9, 91.8), at(2, 'critical', 24.9, 91.8), at(3, 'high', 24.9, 91.8), at(4, 'low', 22, 90)]);
    expect(groups).toHaveLength(2);
    const shared = groups.find((g) => g.incidents.length === 3);
    expect(shared.incidents.map((i) => i.id)).toEqual([2, 3, 1]);
    expect(shared.lat).toBe(24.9); // positions are never altered
    expect(groups.find((g) => g.incidents.length === 1).incidents[0].id).toBe(4);
  });
});

describe('incident query building (nationwide, no location restriction)', () => {
  it('default view = active + verified incidents, first page, with no location parameters', () => {
    const params = buildIncidentParams(DEFAULT_FILTERS);
    expect(params).toEqual({ page: 1, limit: 25, status: 'verified,active' });
    expect(Object.keys(params).some((k) => /lat|lng|radius|near/i.test(k))).toBe(false);
  });
  it('maps filters to the Phase 1 query parameters', () => {
    const params = buildIncidentParams({ search: '  flood ', scope: 'resolved', disasterType: 'flood', severity: 'high', district: 'Sylhet', mine: false }, { page: 3, limit: 50 });
    expect(params).toEqual({ page: 3, limit: 50, status: 'resolved', search: 'flood', disasterType: 'flood', severity: 'high', district: 'Sylhet' });
  });
  it('"all visible" sends no status, "mine" sends mine=true, long search is capped', () => {
    expect(buildIncidentParams({ ...DEFAULT_FILTERS, scope: 'all' }).status).toBeUndefined();
    expect(buildIncidentParams({ ...DEFAULT_FILTERS, mine: true }).mine).toBe('true');
    expect(buildIncidentParams({ ...DEFAULT_FILTERS, search: 'x'.repeat(300) }).search).toHaveLength(100);
  });
  it('admin-only scopes are flagged so non-admins are never offered them', () => {
    expect(SCOPE_OPTIONS.unverified.adminOnly).toBe(true);
    expect(SCOPE_OPTIONS.rejected.adminOnly).toBe(true);
    expect(SCOPE_OPTIONS.open.adminOnly).toBeUndefined();
  });
  it('counts active filters', () => {
    expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0);
    expect(countActiveFilters({ ...DEFAULT_FILTERS, district: 'Dhaka', scope: 'all', mine: true })).toBe(3);
  });
  it('district reference list has the 64 districts, no duplicates', () => {
    expect(BD_DISTRICTS).toHaveLength(64);
    expect(new Set(BD_DISTRICTS).size).toBe(64);
  });
});

describe('quantity presentation follows the backend definitions', () => {
  it('formats quantities with units and thousands separators; singular/plural', () => {
    expect(formatQuantity(1000, 'liter')).toBe('1,000 litres');
    expect(formatQuantity(1, 'liter')).toBe('1 litre');
    expect(formatQuantity(500, 'packet')).toBe('500 packets');
    expect(formatQuantity(200, 'piece')).toBe('200 units');
    expect(formatQuantity(2.5, 'kg')).toBe('2.5 kg');
    expect(formatQuantity('12.500', 'kg')).toBe('12.5 kg');
  });
  it('shows "Unavailable" when the backend gave no value — never 0 or a guess', () => {
    for (const v of [undefined, null, '', 'abc', NaN]) expect(formatQuantity(v, 'kg')).toBe('Unavailable');
  });
  it('pledged quantity is NOT counted as delivered in progress', () => {
    const p = computeProgress({ requested: 100, activePledged: 100, collected: 0, delivered: 0 });
    expect(p.deliveredPct).toBe(0);
    expect(p.pledgedPct).toBe(100);
    expect(p.openPct).toBe(0);
  });
  it('splits delivered / pledged-outstanding / open that always add to 100', () => {
    const p = computeProgress({ requested: 200, activePledged: 50, collected: 120, delivered: 100 });
    expect(p.deliveredPct).toBe(50);
    expect(p.pledgedPct).toBe(25);
    expect(p.openPct).toBe(25);
    expect(p.deliveredPct + p.pledgedPct + p.openPct).toBe(100);
  });
  it('clamps inconsistent data and returns null without a usable requirement', () => {
    const p = computeProgress({ requested: 10, activePledged: 50, delivered: 4 });
    expect(p.deliveredPct + p.pledgedPct).toBeLessThanOrEqual(100);
    expect(p.openPct).toBeGreaterThanOrEqual(0);
    expect(computeProgress({ requested: 0 })).toBeNull();
    expect(computeProgress({})).toBeNull();
    expect(computeProgress(undefined)).toBeNull();
  });
  it('toNumber only returns finite numbers', () => {
    expect(toNumber('5')).toBe(5);
    expect(toNumber(null)).toBeNull();
    expect(toNumber('x')).toBeNull();
  });
});

describe('safe rendering helpers', () => {
  it('only http(s) references become links', () => {
    expect(safeHttpUrl('https://example.org/report')).toBe('https://example.org/report');
    for (const bad of ['javascript:alert(1)', 'data:text/html,<b>', 'ftp://x', 'not a url', '', null, 42]) expect(safeHttpUrl(bad)).toBeNull();
  });
  it('invalid dates read as Unavailable', () => {
    expect(formatDateTime('nope')).toBe('Unavailable');
    expect(formatDateTime(null)).toBe('Unavailable');
    expect(formatDateTime('2026-10-12T08:00:00Z')).not.toBe('Unavailable');
  });
  it('error messages are friendly and never echo internals', () => {
    expect(apiErrorMessage({ response: { status: 404 } })).toMatch(/could not be found/i);
    expect(apiErrorMessage({ response: { status: 403 } })).toMatch(/permission/i);
    expect(apiErrorMessage({ response: { status: 500, data: { message: 'x'.repeat(500) } } })).toMatch(/something went wrong/i);
    expect(apiErrorMessage(new Error('boom'))).toMatch(/something went wrong/i);
  });
});

describe('pledge helpers (Phase 3)', () => {
  const rule = { unit: 'packet', remainingToPledge: 10 };
  it('quantity validation mirrors the server rules (the server stays the authority)', () => {
    expect(validatePledgeQuantity('5', rule)).toBeNull();
    expect(validatePledgeQuantity('10', rule)).toBeNull();
    for (const bad of ['', ' ', '0', '0.000', '-1', 'abc', '1e3', '1.2345', '1,5']) expect(validatePledgeQuantity(bad, rule), bad).toBeTruthy();
    expect(validatePledgeQuantity('11', rule)).toMatch(/Only 10 is still needed/);
    expect(validatePledgeQuantity('2.5', rule)).toMatch(/whole numbers/);
    expect(validatePledgeQuantity('2.5', { unit: 'kg', remainingToPledge: 10 })).toBeNull();
    expect(validatePledgeQuantity('2.5', { unit: 'liter', remainingToPledge: 2 })).toMatch(/Only 2 is still needed/);
  });

  it('does not block when the server gave no remaining value (the server will decide)', () => {
    expect(validatePledgeQuantity('500', { unit: 'packet', remainingToPledge: undefined })).toBeNull();
  });

  it('idempotency keys are unique, within the 64-char header limit and use only allowed characters', () => {
    const keys = new Set(Array.from({ length: 50 }, newIdempotencyKey));
    expect(keys.size).toBe(50);
    keys.forEach((k) => { expect(k).toMatch(/^[A-Za-z0-9_-]{8,64}$/); });
  });

  it('task status wording never claims delivery before verification', () => {
    expect(TASK_STATUS_LABELS.picked_up).not.toMatch(/delivered/i);
    expect(TASK_STATUS_LABELS.delivery_reported).toMatch(/awaiting verification/i);
    expect(TASK_STATUS_LABELS.completed).toMatch(/verified/i);
    expect(PLEDGE_STATUS_LABELS.pledged).toBe('Pledged');
    expect(ACTIVE_TASK_STATUSES).not.toContain('completed');
  });
});
