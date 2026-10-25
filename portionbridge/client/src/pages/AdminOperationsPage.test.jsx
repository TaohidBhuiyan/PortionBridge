import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/adminOpsApi', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      dashboard: vi.fn(), incidents: vi.fn(), requests: vi.fn(), tasks: vi.fn(), exceptions: vi.fn(), reports: vi.fn(), volunteers: vi.fn(),
      quantityHistory: vi.fn(), exportCsv: vi.fn(), assignTask: vi.fn(), reassignTask: vi.fn(), releaseTask: vi.fn(), cancelTask: vi.fn(),
      requestCorrection: vi.fn(), flagReassessment: vi.fn(), clearReassessment: vi.fn(), setRequestStatus: vi.fn(),
      verifyReport: vi.fn(), rejectReport: vi.fn(), resolveReport: vi.fn(), correctDelivery: vi.fn(),
    },
  };
});
vi.mock('react-hot-toast', () => ({ default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
vi.mock('../components/dashboard', async (importOriginal) => ({ ...(await importOriginal()), DashboardLayout: ({ children }) => <div>{children}</div> }));

import api from '../services/adminOpsApi';
import { AdminOperationsPage } from './AdminOperationsPage';

const dashboard = (o = {}) => ({
  data: {
    summary: {
      incidents: { totalReported: 14, awaitingVerification: 3, verifiedActive: 6, criticalOrHigh: 2, resolved: 4, rejected: 1 },
      requests: { total: 9, awaitingReview: 2, approved: 5, approvedUnfulfilled: 4, needsReassessment: 1, awaitingCorrection: 0 },
      tasks: { active: 7, unassigned: 3, delayed: 2, failed: 1, needingAttention: 2, delayThresholdHours: 24 },
      deliveryIssues: { openIssues: 2, pendingVerification: 5, discrepancies: 1, failedTasks: 1 },
    },
    quantities: [{ key: 'dry food', name: 'Dry food', unit: 'packet', requested: 500, pledged: 320, collected: 200, verifiedDelivered: 150, pendingVerification: 20, remainingUnfulfilled: 350 },
      { key: 'dry food', name: 'Dry food', unit: 'kg', requested: 40, pledged: 10, collected: 10, verifiedDelivered: 10, pendingVerification: 0, remainingUnfulfilled: 30 }],
    recentIncidents: [{ id: 7, title: 'Sylhet flood', disasterType: 'flood', severity: 'high', status: 'active', district: 'Sylhet', updatedAt: '2026-10-19T10:00:00Z' }],
    recentRequests: [{ id: 3, title: 'Shelter supplies', status: 'approved', incidentId: 7, incidentTitle: 'Sylhet flood', updatedAt: '2026-10-19T10:00:00Z' }],
    alerts: { active: 2, activeNationwide: 1, failedEvents: 1, pendingEvents: 0, stuckEvents: 0, failed: [{ id: 4, alertId: 9, type: 'issued', attempts: 5, error: 'db down' }] },
    limitations: ['Upazila is not stored on incidents, requests or users, so upazila filtering and grouping are not available.'],
    ...o,
  },
});
const page = (items, key, extra = {}) => ({ data: { [key]: items, ...extra }, meta: { page: 1, limit: 15, totalItems: items.length, totalPages: 1 } });
const renderPage = () => render(<MemoryRouter><AdminOperationsPage /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  api.dashboard.mockResolvedValue(dashboard());
  api.incidents.mockResolvedValue(page([], 'incidents'));
  api.requests.mockResolvedValue(page([], 'requests'));
  api.tasks.mockResolvedValue(page([], 'tasks', { view: 'all' }));
  api.exceptions.mockResolvedValue(page([], 'exceptions'));
});

describe('AdminOperationsPage', () => {
  it('shows the live summary exactly as returned by the server, with units kept separate', async () => {
    renderPage();
    expect(screen.getByRole('status', { name: /loading operations summary/i })).toBeTruthy();
    expect((await screen.findByTestId('stat-Total reported')).textContent).toMatch(/14/);
    expect(screen.getByTestId('stat-Awaiting verification').textContent).toMatch(/3/);
    expect(screen.getByTestId('stat-Delayed tasks').textContent).toMatch(/2/);
    expect(screen.getByTestId('stat-Delayed tasks').textContent).toMatch(/24h/);
    const rows = screen.getAllByRole('row').filter((r) => /Dry food/.test(r.textContent));
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toMatch(/500/);
    expect(rows[1].textContent).toMatch(/kg/);
    expect(screen.getByTestId('alert-health').textContent).toMatch(/2 active alerts \(1 nationwide\) · 1 failed delivery/);
    expect(screen.getByText(/Upazila is not stored/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Sylhet flood/ }).getAttribute('href')).toBe('/admin/operations/incidents/7');
  });

  it('filters are sent to the server as real parameters and can be reset', async () => {
    renderPage();
    await screen.findByTestId('stat-Total reported');
    fireEvent.change(screen.getByLabelText('Division'), { target: { value: 'Sylhet' } });
    fireEvent.change(screen.getByLabelText('Severity'), { target: { value: 'high' } });
    fireEvent.change(screen.getByLabelText('Reported from'), { target: { value: '2026-10-01' } });
    await waitFor(() => expect(api.dashboard).toHaveBeenLastCalledWith(expect.objectContaining({ division: 'Sylhet', severity: 'high', from: '2026-10-01' })));
    fireEvent.click(screen.getByRole('button', { name: /reset filters/i }));
    await waitFor(() => expect(api.dashboard).toHaveBeenLastCalledWith(expect.objectContaining({ division: '', severity: '', from: '' })));
    fireEvent.change(screen.getByLabelText('Reported from'), { target: { value: '2026-10-10' } });
    fireEvent.change(screen.getByLabelText('Reported to'), { target: { value: '2026-10-01' } });
    expect((await screen.findByRole('alert')).textContent).toMatch(/must not be before/);
  });

  it('summary cards open the matching list with the right preset', async () => {
    api.tasks.mockResolvedValue(page([{
      pledgeId: 11, pledgeStatus: 'pledged', itemName: 'Rice', unit: 'kg', quantities: { pledged: 40, collected: 0, verifiedDelivered: 0, pendingVerification: 0 },
      requestId: 3, requestTitle: 'Shelter supplies', incidentId: 7, incidentTitle: 'Sylhet flood', district: 'Sylhet', taskStatus: 'pending', assignmentMode: 'individual',
      volunteerId: null, volunteerName: null, openReports: 0, hoursSinceChange: 30, unassigned: true, delayed: true,
    }], 'tasks', { view: 'unassigned' }));
    renderPage();
    fireEvent.click(await screen.findByTestId('stat-Unassigned tasks'));
    await waitFor(() => expect(api.tasks).toHaveBeenCalledWith(expect.objectContaining({ view: 'unassigned' })));
    const row = await screen.findByTestId('task-row');
    expect(row.textContent).toMatch(/Unassigned/);
    expect(row.textContent).toMatch(/Delayed/);
    expect(within(row).getByRole('button', { name: /assign volunteer/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /overview/i }));
    fireEvent.click(await screen.findByTestId('stat-Awaiting verification'));
    await waitFor(() => expect(api.incidents).toHaveBeenCalledWith(expect.objectContaining({ queue: 'awaiting' })));
    expect(await screen.findByText(/no incidents match/i)).toBeTruthy();
  });

  it('shows an error state with retry when the summary cannot load', async () => {
    api.dashboard.mockRejectedValueOnce({ response: { status: 500, data: { message: 'db down' } } });
    renderPage();
    expect(await screen.findByText(/could not load the operations summary/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /try again|retry/i }));
    expect(await screen.findByTestId('stat-Total reported')).toBeTruthy();
  });

  it('assigning a volunteer needs an eligible choice and a reason, then calls the server', async () => {
    api.tasks.mockResolvedValue(page([{
      pledgeId: 11, pledgeStatus: 'pledged', itemName: 'Rice', unit: 'kg', quantities: { pledged: 40, collected: 0, verifiedDelivered: 0, pendingVerification: 0 },
      requestId: 3, requestTitle: 'Shelter supplies', incidentId: 7, incidentTitle: 'Sylhet flood', district: 'Sylhet', taskStatus: 'pending', assignmentMode: 'individual',
      volunteerId: null, volunteerName: null, openReports: 0, hoursSinceChange: 1, unassigned: true, delayed: false,
    }], 'tasks', { view: 'all' }));
    api.volunteers.mockResolvedValue({ data: { volunteers: [
      { id: 21, name: 'Near Volunteer', activeTasks: 1, distanceKm: 4.2, eligible: true, isOnline: true },
      { id: 22, name: 'Far Volunteer', activeTasks: 0, distanceKm: 215, eligible: false, ineligibleReason: 'Outside coverage radius (215 km > 25 km)' },
    ] } });
    api.assignTask.mockResolvedValue({});
    renderPage();
    fireEvent.click(await screen.findByRole('tab', { name: /tasks & volunteers/i }));
    fireEvent.click(await screen.findByRole('button', { name: /assign volunteer/i }));
    expect(await screen.findByText(/Outside coverage radius/)).toBeTruthy();
    expect(screen.getByLabelText('Far Volunteer').disabled).toBe(true);
    const confirm = screen.getByRole('button', { name: /^confirm$/i });
    expect(confirm.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Near Volunteer'));
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Closest available' } });
    expect(confirm.disabled).toBe(false);
    fireEvent.click(confirm);
    await waitFor(() => expect(api.assignTask).toHaveBeenCalledWith(11, 21, 'Closest available'));
  });

  it('delivery verification and correction enforce the same rules as the server', async () => {
    api.exceptions.mockResolvedValue(page([
      { kind: 'pending_verification', reportId: 5, reportType: 'delivery', status: 'pending', reportedQuantity: 50, verifiedQuantity: null, pledgeId: 11, pledgedQuantity: 50, verifiedDeliveredTotal: 0, itemName: 'Rice', unit: 'kg', incidentId: 7, incidentTitle: 'Sylhet flood', district: 'Sylhet', createdAt: '2026-10-19T10:00:00Z', reporterName: 'Vol', corrections: 0 },
      { kind: 'discrepancy', reportId: 6, reportType: 'delivery', status: 'verified', reportedQuantity: 50, verifiedQuantity: 45, pledgeId: 12, pledgedQuantity: 50, verifiedDeliveredTotal: 45, itemName: 'Oil', unit: 'liter', incidentId: 7, incidentTitle: 'Sylhet flood', district: 'Sylhet', createdAt: '2026-10-19T10:00:00Z', reporterName: 'Vol', corrections: 1 },
    ], 'exceptions'));
    api.verifyReport.mockResolvedValue({});
    api.correctDelivery.mockResolvedValue({});
    renderPage();
    fireEvent.click(await screen.findByRole('tab', { name: /delivery issues/i }));
    const rows = await screen.findAllByTestId('exception-row');
    fireEvent.click(within(rows[0]).getByRole('button', { name: /verify delivery/i }));
    fireEvent.change(screen.getByLabelText('Verified quantity'), { target: { value: '40' } });
    const verifyButtons = screen.getAllByRole('button', { name: /^verify delivery$/i });
    const submit = verifyButtons[verifyButtons.length - 1];
    expect(submit.disabled).toBe(true); // a lower quantity needs an explanation
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Ten bags were damaged' } });
    fireEvent.click(submit);
    await waitFor(() => expect(api.verifyReport).toHaveBeenCalledWith(5, { verifiedQuantity: 40, notes: 'Ten bags were damaged' }));

    fireEvent.click(within((await screen.findAllByTestId('exception-row'))[1]).getByRole('button', { name: /correct verified quantity/i }));
    fireEvent.change(screen.getByLabelText('Verified quantity'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Recount found all cartons' } });
    fireEvent.click(screen.getByRole('button', { name: /save correction/i }));
    await waitFor(() => expect(api.correctDelivery).toHaveBeenCalledWith(6, '50', 'Recount found all cartons'));
  });

  it('reports show real figures, flag unavailable timing metrics and offer CSV exports', async () => {
    api.reports.mockResolvedValue({ data: {
      incidents: { byType: [{ key: 'flood', count: 3 }], bySeverity: [{ key: 'high', count: 2 }], byDivision: [{ key: 'Sylhet', count: 3 }], byDistrict: [{ key: 'Sylhet', count: 3 }], verifiedVsRejected: { verified: 2, rejected: 1, unverified: 0 } },
      requests: { byStatus: [{ key: 'approved', count: 2 }] }, quantities: [], fulfillmentByIncident: [],
      deliveryTasks: { completed: 4, fullyDelivered: 3, partiallyFulfilled: 1, failed: 1, cancelled: 2, inProgress: 5, delayedNow: 1 },
      trends: [{ period: '2026-W42', incidentsReported: 3, incidentsVerified: 2, deliveriesVerified: 1 }],
      timings: [{ label: 'Incident report → verification', averageHours: 5.5, sampleSize: 2, available: true }, { label: 'Pledge → first volunteer acceptance', averageHours: null, sampleSize: 0, available: false }],
      limitations: ['Timing metrics use only records that carry the needed timestamps (see sampleSize).'],
    } });
    api.exportCsv.mockResolvedValue({ data: new Blob(['id\n1']), headers: {} });
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:x');
    globalThis.URL.revokeObjectURL = vi.fn();
    renderPage();
    fireEvent.click(await screen.findByRole('tab', { name: /reports/i }));
    expect((await screen.findByTestId('verified-vs-rejected')).textContent).toMatch(/Verified 2 · Rejected 1/);
    expect(screen.getByTestId('task-outcomes').textContent).toMatch(/Delayed now1/);
    const timings = screen.getByTestId('timings').textContent;
    expect(timings).toMatch(/5.5 h average \(n=2\)/);
    expect(timings).toMatch(/Not available/);
    fireEvent.click(screen.getByRole('button', { name: /^Incidents$/ }));
    await waitFor(() => expect(api.exportCsv).toHaveBeenCalledWith('incidents', expect.any(Object)));
  });
});
