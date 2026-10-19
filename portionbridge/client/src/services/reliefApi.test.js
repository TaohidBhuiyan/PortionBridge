import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios', () => ({ default: { request: vi.fn() } }));
import axios from 'axios';
import reliefApi from './reliefApi';

const lastCall = () => axios.request.mock.calls.at(-1)[0];

beforeEach(() => {
  vi.clearAllMocks();
  axios.request.mockResolvedValue({ data: { success: true, data: {} } });
  localStorage.setItem('accessToken', 'tok-123');
});

describe('reliefApi (Phase 3)', () => {
  it('createPledge posts to the item endpoint with the Bearer token and an Idempotency-Key header', async () => {
    await reliefApi.createPledge(11, { quantity: '5', pickup: { pickupDate: '2026-10-20' } }, 'pledge-abc12345');
    expect(lastCall()).toMatchObject({ method: 'post', withCredentials: true, data: { quantity: '5', pickup: { pickupDate: '2026-10-20' } } });
    expect(lastCall().url).toMatch(/\/relief\/items\/11\/pledges$/);
    expect(lastCall().headers).toMatchObject({ Authorization: 'Bearer tok-123', 'Idempotency-Key': 'pledge-abc12345' });
  });

  it('omits the Idempotency-Key header when none is given and sends no auth header when signed out', async () => {
    localStorage.removeItem('accessToken');
    await reliefApi.createPledge(11, { quantity: '5' });
    expect(lastCall().headers['Idempotency-Key']).toBeUndefined();
    expect(lastCall().headers.Authorization).toBeUndefined();
  });

  it('donor endpoints use the documented paths and verbs', async () => {
    await reliefApi.listMyPledges({ page: 2 });
    expect(lastCall()).toMatchObject({ method: 'get', params: { page: 2 } });
    expect(lastCall().url).toMatch(/\/relief\/pledges\/mine$/);
    await reliefApi.updatePledge(41, { quantity: '9' });
    expect(lastCall()).toMatchObject({ method: 'patch', data: { quantity: '9' } });
    expect(lastCall().url).toMatch(/\/pledges\/41$/);
    await reliefApi.cancelPledge(41, 'Plans changed');
    expect(lastCall()).toMatchObject({ method: 'post', data: { reason: 'Plans changed' } });
    await reliefApi.cancelPledge(41);
    expect(lastCall().data).toEqual({});
    await reliefApi.getPledgeTimeline(41);
    expect(lastCall().url).toMatch(/\/pledges\/41\/timeline$/);
  });

  it.each([
    ['listAvailableTasks', [{ page: 1 }], 'get', /\/tasks\/available$/],
    ['listMyTasks', [{ group: 'active' }], 'get', /\/tasks\/mine$/],
    ['getTask', [41], 'get', /\/tasks\/41$/],
    ['acceptTask', [41], 'post', /\/tasks\/41\/accept$/],
    ['markTaskOnTheWay', [41], 'post', /\/tasks\/41\/on-the-way$/],
    ['releaseTask', [41, 'why'], 'post', /\/tasks\/41\/release$/],
  ])('volunteer endpoint %s', async (fn, args, method, url) => {
    await reliefApi[fn](...args);
    expect(lastCall().method).toBe(method);
    expect(lastCall().url).toMatch(url);
  });

  it('task reports send exactly the documented bodies', async () => {
    await reliefApi.scheduleTask(41, '2026-10-21T05:00:00Z');
    expect(lastCall().data).toEqual({ scheduledAt: '2026-10-21T05:00:00Z' });
    await reliefApi.reportPickup(41, { quantity: '80', notes: 'short' });
    expect(lastCall().data).toEqual({ quantity: '80', notes: 'short' });
    await reliefApi.reportDelivery(41, { quantity: '80', final: true });
    expect(lastCall().url).toMatch(/\/tasks\/41\/delivery$/);
    await reliefApi.reportFailure(41, 'locked');
    expect(lastCall()).toMatchObject({ data: { notes: 'locked' } });
    await reliefApi.reportProblem(41, 'flooded');
    expect(lastCall().url).toMatch(/\/tasks\/41\/problem$/);
  });

  it('admin endpoints', async () => {
    await reliefApi.listReports({ type: 'problem' });
    expect(lastCall().url).toMatch(/\/admin\/reports$/);
    await reliefApi.listAdminTasks({ attention: 'true' });
    expect(lastCall().url).toMatch(/\/admin\/tasks$/);
    await reliefApi.verifyReport(301, { verifiedQuantity: '90', notes: 'log' });
    expect(lastCall().url).toMatch(/\/admin\/reports\/301\/verify$/);
    expect(lastCall().data).toEqual({ verifiedQuantity: '90', notes: 'log' });
    await reliefApi.rejectReport(301, 'bad count');
    expect(lastCall().data).toEqual({ notes: 'bad count' });
    await reliefApi.resolveReport(301, { action: 'fail', notes: 'closing' });
    expect(lastCall().data).toEqual({ action: 'fail', notes: 'closing' });
  });

  it('never sends client-side totals: no function accepts or forwards remaining/progress values', () => {
    const source = Object.values(reliefApi).map((f) => f.toString()).join('\n');
    expect(source).not.toMatch(/remaining|progress|percent/i);
  });
});
