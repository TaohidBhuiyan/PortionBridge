import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/reliefApi', () => ({
  default: {
    listReports: vi.fn(), listAdminTasks: vi.fn(), verifyReport: vi.fn(), rejectReport: vi.fn(),
    resolveReport: vi.fn(), releaseTask: vi.fn(), getPledgeTimeline: vi.fn(),
  },
}));
vi.mock('../components/dashboard', async (importOriginal) => ({
  ...(await importOriginal()),
  DashboardLayout: ({ children }) => <div>{children}</div>,
}));

import reliefApi from '../services/reliefApi';
import { AdminReliefReviewPage } from './AdminReliefReviewPage';
import { report, assignedTask } from '../test/fixtures';

const reports = (list, meta = {}) => ({ data: { reports: list }, meta: { page: 1, limit: 20, totalItems: list.length, totalPages: 1, ...meta } });
const tasks = (list) => ({ data: { tasks: list }, meta: { page: 1, limit: 20, totalItems: list.length, totalPages: 1 } });
const renderPage = () => render(<MemoryRouter><AdminReliefReviewPage /></MemoryRouter>);
const press = (name, scope = screen) => fireEvent.click(scope.getByRole('button', { name }));

beforeEach(() => {
  vi.clearAllMocks();
  reliefApi.listReports.mockResolvedValue(reports([]));
  reliefApi.listAdminTasks.mockResolvedValue(tasks([]));
  reliefApi.getPledgeTimeline.mockResolvedValue({ data: { events: [] } });
  for (const k of ['verifyReport', 'rejectReport', 'resolveReport', 'releaseTask']) reliefApi[k].mockResolvedValue({ data: {} });
});

describe('AdminReliefReviewPage — verification queue', () => {
  it('shows pending delivery reports with every server quantity, the volunteer note, and loads the default queue', async () => {
    reliefApi.listReports.mockResolvedValue(reports([report()]));
    renderPage();
    const card = await screen.findByTestId('report-card');
    expect(reliefApi.listReports).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(card.textContent).toMatch(/Delivery reported — Dry food/);
    expect(card.textContent).toMatch(/Test flood.*Shelter supplies.*donor Donor Name/);
    expect(card.textContent).toMatch(/Volunteer note: Handed to the shelter manager/);
    expect(within(card).getByText('Reported').nextSibling.textContent).toBe('100 packets');
    expect(within(card).getByText('Awaiting verification', { selector: 'dt' }).nextSibling.textContent).toBe('100 packets');
    expect(within(card).getByText('Verified delivered').nextSibling.textContent).toBe('0 packets');
    expect(card.textContent).toMatch(/final delivery/);
  });

  it('verifying the full reported quantity sends no quantity override', async () => {
    reliefApi.listReports.mockResolvedValue(reports([report()]));
    renderPage();
    const card = await screen.findByTestId('report-card');
    press('Verify delivery', within(card));
    press('Confirm', within(card));
    await waitFor(() => expect(reliefApi.verifyReport).toHaveBeenCalledWith(301, {}));
    await waitFor(() => expect(reliefApi.listReports.mock.calls.length).toBeGreaterThanOrEqual(2)); // queue reloads from the server
  });

  it('verifying a smaller quantity requires an explanation and never more than reported', async () => {
    reliefApi.listReports.mockResolvedValue(reports([report()]));
    renderPage();
    const card = await screen.findByTestId('report-card');
    press('Verify delivery', within(card));
    const qty = within(card).getByLabelText(/Verified quantity/);
    fireEvent.change(qty, { target: { value: '120' } });
    press('Confirm', within(card));
    expect((await within(card).findByRole('alert')).textContent).toMatch(/cannot verify more than/);
    fireEvent.change(qty, { target: { value: '90' } });
    press('Confirm', within(card));
    expect((await within(card).findByRole('alert')).textContent).toMatch(/Explain why a smaller quantity/);
    expect(reliefApi.verifyReport).not.toHaveBeenCalled();
    fireEvent.change(within(card).getByLabelText(/Explain the difference/), { target: { value: 'Shelter log shows 90' } });
    press('Confirm', within(card));
    await waitFor(() => expect(reliefApi.verifyReport).toHaveBeenCalledWith(301, { verifiedQuantity: '90', notes: 'Shelter log shows 90' }));
  });

  it('rejecting needs a reason that is passed to the volunteer', async () => {
    reliefApi.listReports.mockResolvedValue(reports([report()]));
    renderPage();
    const card = await screen.findByTestId('report-card');
    press('Reject', within(card));
    press('Confirm', within(card));
    expect((await within(card).findByRole('alert')).textContent).toMatch(/reason/i);
    fireEvent.change(within(card).getByLabelText(/Reason \(shown to the volunteer\)/), { target: { value: 'Count does not match the log' } });
    press('Confirm', within(card));
    await waitFor(() => expect(reliefApi.rejectReport).toHaveBeenCalledWith(301, 'Count does not match the log'));
  });

  it('shows the server\'s refusal inline (e.g. already verified)', async () => {
    reliefApi.listReports.mockResolvedValue(reports([report()]));
    reliefApi.verifyReport.mockRejectedValue({ response: { status: 409, data: { message: 'This delivery report is not awaiting verification.' } } });
    renderPage();
    const card = await screen.findByTestId('report-card');
    press('Verify delivery', within(card));
    press('Confirm', within(card));
    expect((await within(card).findByRole('alert')).textContent).toBe('This delivery report is not awaiting verification.');
  });

  it('open failed-delivery and problem reports offer resolve / retry / close-as-failed; closing as failed needs a note', async () => {
    reliefApi.listReports.mockResolvedValue(reports([
      report({ id: 401, type: 'failed_delivery', status: 'open', quantity: null, notes: 'Shelter was locked' }),
      report({ id: 402, type: 'problem', status: 'open', quantity: null, notes: 'Donor unreachable', pledgeStatus: 'pledged' }),
    ]));
    renderPage();
    const [failed, problem] = await screen.findAllByTestId('report-card');
    expect(within(failed).getByRole('button', { name: 'Let volunteer retry' })).toBeTruthy();
    expect(within(problem).queryByRole('button', { name: 'Let volunteer retry' })).toBeNull(); // only failed deliveries can be reopened
    press('Close task as failed', within(failed));
    press('Confirm', within(failed));
    expect((await within(failed).findByRole('alert')).textContent).toMatch(/note explaining/);
    fireEvent.change(within(failed).getByLabelText(/Why is the task being closed/), { target: { value: 'Shelter permanently closed' } });
    press('Confirm', within(failed));
    await waitFor(() => expect(reliefApi.resolveReport).toHaveBeenCalledWith(401, { action: 'fail', notes: 'Shelter permanently closed' }));
    // the queue reloads from the server after a decision; re-query the fresh cards
    await waitFor(() => expect(screen.getAllByTestId('report-card')).toHaveLength(2));
    const [, freshProblem] = screen.getAllByTestId('report-card');
    press('Mark resolved', within(freshProblem));
    press('Confirm', within(freshProblem));
    await waitFor(() => expect(reliefApi.resolveReport).toHaveBeenCalledWith(402, { action: 'close' }));
  });

  it('filters the queue by report type; pagination, empty and error states work', async () => {
    renderPage();
    expect(await screen.findByText('Nothing needs a decision')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Report type'), { target: { value: 'problem' } });
    await waitFor(() => expect(reliefApi.listReports).toHaveBeenLastCalledWith({ page: 1, limit: 20, type: 'problem' }));
    reliefApi.listReports.mockRejectedValueOnce({ response: { status: 500 } });
    fireEvent.change(screen.getByLabelText('Report type'), { target: { value: 'delivery' } });
    expect(await screen.findByText('Could not load the review list')).toBeTruthy();
  });

  it('history opens the pledge timeline in a dialog', async () => {
    reliefApi.listReports.mockResolvedValue(reports([report()]));
    reliefApi.getPledgeTimeline.mockResolvedValue({ data: { events: [{ kind: 'report', id: 1, at: '2026-10-13T09:00:00Z', type: 'pickup', status: 'recorded', quantity: 100, notes: 'All collected' }] } });
    renderPage();
    press('History', within(await screen.findByTestId('report-card')));
    await waitFor(() => expect(reliefApi.getPledgeTimeline).toHaveBeenCalledWith(41));
    expect(await screen.findByText('Note: All collected')).toBeTruthy();
  });
});

describe('AdminReliefReviewPage — all tasks', () => {
  it('lists tasks with status, volunteer and quantities; attention filter and release for reassignment', async () => {
    reliefApi.listAdminTasks.mockResolvedValue(tasks([
      assignedTask({ pledgeId: 61, taskStatus: 'scheduled', needsAttention: true }),
      assignedTask({ pledgeId: 62, taskStatus: 'picked_up', pledgeStatus: 'collected', assignedTo: { volunteerId: 4, volunteerName: 'Vol Two' } }),
    ]));
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'All tasks' }));
    const rows = await screen.findAllByTestId('admin-task');
    expect(rows[0].textContent).toMatch(/Needs attention/);
    expect(rows[0].textContent).toMatch(/volunteer Vol One/);
    expect(within(rows[0]).getByRole('button', { name: 'Release for reassignment' })).toBeTruthy();
    expect(within(rows[1]).queryByRole('button', { name: 'Release for reassignment' })).toBeNull(); // too late once picked up
    fireEvent.click(screen.getByLabelText('Only tasks that need attention'));
    await waitFor(() => expect(reliefApi.listAdminTasks).toHaveBeenLastCalledWith({ page: 1, limit: 20, attention: 'true' }));
    press('Release for reassignment', within((await screen.findAllByTestId('admin-task'))[0]));
    expect(screen.getByText(/Vol One will be told/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Reason (optional)'), { target: { value: 'Reassigning' } });
    press('Release');
    await waitFor(() => expect(reliefApi.releaseTask).toHaveBeenCalledWith(61, 'Reassigning'));
  });
});
