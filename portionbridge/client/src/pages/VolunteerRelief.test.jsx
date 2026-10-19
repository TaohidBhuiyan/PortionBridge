import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../services/reliefApi', () => ({
  default: { listAvailableTasks: vi.fn(), listMyTasks: vi.fn(), getTask: vi.fn(), acceptTask: vi.fn(), getPledgeTimeline: vi.fn() },
}));
vi.mock('../components/dashboard', async (importOriginal) => ({
  ...(await importOriginal()),
  DashboardLayout: ({ children }) => <div>{children}</div>,
}));
vi.mock('../components/relief/TaskActionPanel', () => ({
  TaskActionPanel: ({ task }) => <div data-testid="action-panel">actions for {task.taskStatus}</div>,
}));

import reliefApi from '../services/reliefApi';
import { VolunteerReliefTasksPage } from './VolunteerReliefTasksPage';
import { ReliefTaskPage } from './ReliefTaskPage';
import { task, assignedTask } from '../test/fixtures';

const listOf = (tasks, extra = {}, meta = {}) => ({ data: { tasks, ...extra }, meta: { page: 1, limit: 25, totalItems: tasks.length, totalPages: 1, ...meta } });

beforeEach(() => {
  vi.clearAllMocks();
  reliefApi.listAvailableTasks.mockResolvedValue(listOf([], { needsBaseAddress: false }));
  reliefApi.listMyTasks.mockResolvedValue(listOf([]));
  reliefApi.getPledgeTimeline.mockResolvedValue({ data: { events: [] } });
});

describe('VolunteerReliefTasksPage', () => {
  const renderQueue = () => render(<MemoryRouter><VolunteerReliefTasksPage /></MemoryRouter>);

  it('lists available tasks with incident, request, item, quantity, pickup AREA and distance — and nothing private', async () => {
    reliefApi.listAvailableTasks.mockResolvedValue(listOf([task()], { needsBaseAddress: false }));
    renderQueue();
    const card = await screen.findByTestId('task-card');
    expect(reliefApi.listAvailableTasks).toHaveBeenCalledWith({ page: 1, limit: 25 });
    for (const text of ['Dry food — 100 packets', 'Test flood', 'Govt School Shelter', 'Pickup area: Gulshan, Dhaka', '3.2 km from your base', 'Waiting for a volunteer', 'Urgent priority']) {
      expect(card.textContent).toContain(text);
    }
    expect(within(card).getByRole('link').getAttribute('href')).toBe('/volunteer/relief-tasks/41');
    expect(document.body.textContent).not.toMatch(/\+880|House 5|Dropoff Road/);
  });

  it('tabs query the matching server groups and show the right empty states', async () => {
    renderQueue();
    expect(await screen.findByText('No tasks available right now')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'My active tasks' }));
    await waitFor(() => expect(reliefApi.listMyTasks).toHaveBeenLastCalledWith({ group: 'active', page: 1, limit: 25 }));
    expect(await screen.findByText('No active relief tasks')).toBeTruthy();
    reliefApi.listMyTasks.mockResolvedValue(listOf([assignedTask({ taskStatus: 'cancelled', pledgeStatus: 'cancelled' }), assignedTask({ pledgeId: 42, taskStatus: 'completed', pledgeStatus: 'delivered' })]));
    fireEvent.click(screen.getByRole('tab', { name: 'Completed & cancelled' }));
    await waitFor(() => expect(reliefApi.listMyTasks).toHaveBeenLastCalledWith({ group: 'history', page: 1, limit: 25 }));
    expect((await screen.findAllByTestId('task-card'))).toHaveLength(2);
    expect(screen.getByText('Cancelled')).toBeTruthy();
    expect(screen.getByText('Delivered and verified')).toBeTruthy();
  });

  it('asks for a base address when the server says none is set, and the volunteer is not shown tasks', async () => {
    reliefApi.listAvailableTasks.mockResolvedValue(listOf([], { needsBaseAddress: true }));
    renderQueue();
    expect((await screen.findByRole('alert')).textContent).toMatch(/Set your base address/);
    expect(screen.getByRole('link', { name: /Set it on Find Opportunities/ }).getAttribute('href')).toBe('/volunteer/opportunities');
    expect(screen.queryByText('No tasks available right now')).toBeNull();
  });

  it('flags tasks with an open issue; shows loading, error + retry, and pagination', async () => {
    reliefApi.listAvailableTasks.mockReturnValueOnce(new Promise(() => {}));
    const a = renderQueue();
    expect(screen.getByRole('status', { name: 'Loading tasks' })).toBeTruthy();
    a.unmount();
    reliefApi.listAvailableTasks.mockRejectedValueOnce({ response: { status: 500 } });
    const b = renderQueue();
    expect(await screen.findByText('Could not load tasks')).toBeTruthy();
    b.unmount();
    reliefApi.listAvailableTasks.mockResolvedValue(listOf([task({ hasOpenIssue: true })], { needsBaseAddress: false }, { totalPages: 2, totalItems: 30 }));
    renderQueue();
    expect(await screen.findByText('Issue open')).toBeTruthy();
    expect(screen.getByText('Page 1 of 2')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: /Next/ }).at(-1));
    await waitFor(() => expect(reliefApi.listAvailableTasks).toHaveBeenLastCalledWith({ page: 2, limit: 25 }));
  });
});

describe('ReliefTaskPage', () => {
  const renderTask = (path = '/volunteer/relief-tasks/41') => render(
    <MemoryRouter initialEntries={[path]}><Routes><Route path="/volunteer/relief-tasks/:id" element={<ReliefTaskPage />} /></Routes></MemoryRouter>
  );

  it('an unaccepted task shows only limited details and an Accept button; private details are not rendered', async () => {
    reliefApi.getTask.mockResolvedValue({ data: { task: task() } });
    renderTask();
    expect(await screen.findByRole('heading', { level: 1, name: /Dry food — 100 packets/ })).toBeTruthy();
    const section = screen.getByRole('region', { name: 'Available task' });
    expect(section.textContent).toMatch(/Gulshan, Dhaka/);
    expect(section.textContent).toMatch(/shown after you accept this task/);
    expect(screen.queryByRole('region', { name: 'Pickup details' })).toBeNull();
    expect(screen.queryByTestId('action-panel')).toBeNull();
    expect(document.body.textContent).not.toMatch(/\+880|House 5|Dropoff Road|shelter manager/);
    expect(reliefApi.getPledgeTimeline).not.toHaveBeenCalled(); // timeline is for the assignee
  });

  it('accepting calls the API and then re-reads the task from the server', async () => {
    reliefApi.getTask.mockResolvedValueOnce({ data: { task: task() } });
    reliefApi.acceptTask.mockResolvedValue({ data: {} });
    reliefApi.getTask.mockResolvedValue({ data: { task: assignedTask() } });
    renderTask();
    fireEvent.click(await screen.findByRole('button', { name: 'Accept this task' }));
    await waitFor(() => expect(reliefApi.acceptTask).toHaveBeenCalledWith(41));
    expect(await screen.findByRole('region', { name: 'Pickup details' })).toBeTruthy();
    expect(screen.getByTestId('action-panel').textContent).toBe('actions for accepted');
  });

  it('shows the server\'s refusal when someone else got there first or the volunteer is out of range', async () => {
    reliefApi.getTask.mockResolvedValue({ data: { task: task() } });
    reliefApi.acceptTask.mockRejectedValue({ response: { status: 409, data: { message: 'This task is no longer available to accept.' } } });
    renderTask();
    fireEvent.click(await screen.findByRole('button', { name: 'Accept this task' }));
    expect((await screen.findByRole('alert')).textContent).toBe('This task is no longer available to accept.');
  });

  it('the assigned volunteer sees full pickup + drop-off details, a tappable phone number and the action panel', async () => {
    reliefApi.getTask.mockResolvedValue({ data: { task: assignedTask({ scheduledAt: '2026-10-20T04:00:00.000Z' }) } });
    renderTask();
    const pickup = await screen.findByRole('region', { name: 'Pickup details' });
    expect(pickup.textContent).toContain('House 5, Road 3, Gulshan, Dhaka');
    expect(pickup.textContent).toContain('Near the mosque');
    expect(within(pickup).getByRole('link', { name: /\+8801711111111/ }).getAttribute('href')).toBe('tel:+8801711111111');
    const drop = screen.getByRole('region', { name: 'Drop-off details' });
    for (const text of ['Govt School Shelter', 'Dropoff Road 9', 'Ask for the shelter manager']) expect(drop.textContent).toContain(text);
    expect(screen.getByTestId('action-panel')).toBeTruthy();
    expect(reliefApi.getPledgeTimeline).toHaveBeenCalledWith(41);
  });

  it('quantities keep reported (awaiting verification) separate from verified delivered', async () => {
    reliefApi.getTask.mockResolvedValue({ data: { task: assignedTask({ taskStatus: 'delivery_reported', quantity: { pledged: 100, collected: 100, delivered: 0, pendingVerification: 100 } }) } });
    renderTask();
    const q = await screen.findByRole('region', { name: 'Quantities' });
    expect(within(q).getByText('Awaiting verification').nextSibling.textContent).toBe('100 packets');
    expect(within(q).getByText('Verified delivered').nextSibling.textContent).toBe('0 packets');
    expect(screen.getByText('Delivery reported — awaiting verification')).toBeTruthy();
  });

  it('another volunteer\'s task is a plain "not found", with no retry, and bad ids make no request', async () => {
    reliefApi.getTask.mockRejectedValue({ response: { status: 404 } });
    const a = renderTask();
    expect(await screen.findByText('Could not load this task')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /try again|retry/i })).toBeNull();
    a.unmount();
    vi.clearAllMocks();
    renderTask('/volunteer/relief-tasks/abc');
    expect(await screen.findByText('Invalid link')).toBeTruthy();
    expect(reliefApi.getTask).not.toHaveBeenCalled();
  });
});
