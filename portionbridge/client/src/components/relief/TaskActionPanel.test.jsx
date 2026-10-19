import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../services/reliefApi', () => ({
  default: {
    scheduleTask: vi.fn(), markTaskOnTheWay: vi.fn(), reportPickup: vi.fn(), reportDelivery: vi.fn(),
    reportFailure: vi.fn(), reportProblem: vi.fn(), releaseTask: vi.fn(),
  },
}));
vi.mock('../donation/SchedulePickupModal', () => ({
  SchedulePickupModal: ({ isOpen, onConfirm }) => (isOpen ? <button type="button" onClick={() => onConfirm('2026-10-21T05:00:00.000Z')}>stub-confirm-schedule</button> : null),
}));

import reliefApi from '../../services/reliefApi';
import { TaskActionPanel } from './TaskActionPanel';
import { assignedTask } from '../../test/fixtures';

const panel = (status, quantity = {}) => {
  const onChanged = vi.fn().mockResolvedValue();
  const t = assignedTask({ taskStatus: status, quantity: { pledged: 100, collected: 0, delivered: 0, pendingVerification: 0, ...quantity } });
  render(<TaskActionPanel task={t} onChanged={onChanged} />);
  return { onChanged };
};
const buttons = () => screen.queryAllByRole('button').map((b) => b.textContent);
const press = (name) => fireEvent.click(screen.getByRole('button', { name }));

beforeEach(() => {
  vi.clearAllMocks();
  for (const fn of Object.values(reliefApi)) fn.mockResolvedValue({ data: {} });
});

describe('TaskActionPanel — only valid next steps are offered', () => {
  it.each([
    ['accepted', ['Schedule pickup', 'Release task', 'Report a problem']],
    ['scheduled', ['I’m on the way', 'Release task', 'Report a problem']],
    ['on_the_way', ['Confirm pickup', 'Release task', 'Report a problem']],
    ['picked_up', ['Report delivery', 'Delivery failed', 'Report a problem']],
    ['delivery_reported', ['Report a problem']],
  ])('%s', (status, expected) => {
    panel(status, status === 'picked_up' ? { collected: 100 } : {});
    expect(buttons()).toEqual(expected);
  });

  it.each([['completed', /delivery was verified/], ['completed_partial', /Only part of the pledge was delivered/], ['failed', /Nothing was counted as delivered/], ['cancelled', /cancelled/]])(
    'closed task %s offers no actions', (status, text) => {
      panel(status);
      expect(buttons()).toEqual([]);
      expect(document.body.textContent).toMatch(text);
    }
  );

  it('delivery_reported says the delivery awaits verification', () => {
    panel('delivery_reported', { collected: 100, pendingVerification: 100 });
    expect(document.body.textContent).toMatch(/awaiting administrator verification/);
  });
});

describe('TaskActionPanel — steps', () => {
  it('schedules through the existing modal, marks on the way, and refreshes the task after each action', async () => {
    const a = panel('accepted');
    press('Schedule pickup');
    fireEvent.click(await screen.findByRole('button', { name: 'stub-confirm-schedule' }));
    await waitFor(() => expect(reliefApi.scheduleTask).toHaveBeenCalledWith(41, '2026-10-21T05:00:00.000Z'));
    await waitFor(() => expect(a.onChanged).toHaveBeenCalled());
    expect(await screen.findByText('Pickup scheduled.')).toBeTruthy();
  });

  it('on the way calls the API', async () => {
    panel('scheduled');
    press('I’m on the way');
    await waitFor(() => expect(reliefApi.markTaskOnTheWay).toHaveBeenCalledWith(41));
  });

  it('pickup defaults to the pledged quantity; a smaller quantity needs an explanation; the server gets quantity + notes', async () => {
    panel('on_the_way');
    press('Confirm pickup');
    expect(screen.getByLabelText(/Quantity you collected/).value).toBe('100');
    fireEvent.change(screen.getByLabelText(/Quantity you collected/), { target: { value: '80' } });
    expect(screen.getByLabelText(/Explain the difference \(required\)/)).toBeTruthy();
    press('Submit');
    expect((await screen.findByRole('alert')).textContent).toMatch(/short explanation/);
    expect(reliefApi.reportPickup).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Explain the difference/), { target: { value: 'Donor only had 80 ready' } });
    press('Submit');
    await waitFor(() => expect(reliefApi.reportPickup).toHaveBeenCalledWith(41, { quantity: '80', notes: 'Donor only had 80 ready' }));
    expect(await screen.findByText('Pickup recorded.')).toBeTruthy();
  });

  it('a full pickup needs no notes; zero is refused locally', async () => {
    panel('on_the_way');
    press('Confirm pickup');
    fireEvent.change(screen.getByLabelText(/Quantity you collected/), { target: { value: '0' } });
    press('Submit');
    expect((await screen.findByRole('alert')).textContent).toMatch(/greater than zero/);
    fireEvent.change(screen.getByLabelText(/Quantity you collected/), { target: { value: '100' } });
    press('Submit');
    await waitFor(() => expect(reliefApi.reportPickup).toHaveBeenCalledWith(41, { quantity: '100' }));
  });

  it('delivery defaults to collected minus verified, can be partial with notes, and says it is only REPORTED', async () => {
    panel('picked_up', { collected: 80, delivered: 20 });
    press('Report delivery');
    expect(screen.getByLabelText(/Quantity you delivered/).value).toBe('60');
    fireEvent.change(screen.getByLabelText(/Quantity you delivered/), { target: { value: '50' } });
    press('Submit');
    expect((await screen.findByRole('alert')).textContent).toMatch(/short explanation/);
    fireEvent.click(screen.getByLabelText(/final delivery/)); // not final -> no explanation needed yet
    press('Submit');
    await waitFor(() => expect(reliefApi.reportDelivery).toHaveBeenCalledWith(41, { quantity: '50', final: false }));
    expect((await screen.findByRole('status')).textContent).toMatch(/count as delivered once an administrator verifies it/);
  });

  it('failure and problem reports require notes', async () => {
    panel('picked_up', { collected: 100 });
    press('Delivery failed');
    press('Submit');
    expect((await screen.findByRole('alert')).textContent).toMatch(/short explanation/);
    fireEvent.change(screen.getByLabelText('What went wrong?'), { target: { value: 'Shelter was locked' } });
    press('Submit');
    await waitFor(() => expect(reliefApi.reportFailure).toHaveBeenCalledWith(41, 'Shelter was locked'));
    press('Report a problem');
    fireEvent.change(screen.getByLabelText('Describe the problem'), { target: { value: 'Road is flooded' } });
    press('Submit');
    await waitFor(() => expect(reliefApi.reportProblem).toHaveBeenCalledWith(41, 'Road is flooded'));
  });

  it('release explains the consequence and sends an optional reason', async () => {
    panel('accepted');
    press('Release task');
    expect(document.body.textContent).toMatch(/goes back to the queue for another volunteer/);
    fireEvent.change(screen.getByLabelText('Reason (optional)'), { target: { value: 'Vehicle broke down' } });
    press('Submit');
    await waitFor(() => expect(reliefApi.releaseTask).toHaveBeenCalledWith(41, 'Vehicle broke down'));
  });

  it('shows the server\'s refusal (e.g. out-of-order step) without changing state', async () => {
    reliefApi.markTaskOnTheWay.mockRejectedValue({ response: { status: 409, data: { message: 'Schedule the pickup first.' } } });
    const a = panel('scheduled');
    press('I’m on the way');
    expect((await screen.findByRole('alert')).textContent).toBe('Schedule the pickup first.');
    expect(a.onChanged).not.toHaveBeenCalled();
  });
});
