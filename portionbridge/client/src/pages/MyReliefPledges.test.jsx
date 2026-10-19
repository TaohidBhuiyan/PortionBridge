import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../services/reliefApi', () => ({
  default: { listMyPledges: vi.fn(), getPledge: vi.fn(), getPledgeTimeline: vi.fn(), updatePledge: vi.fn(), cancelPledge: vi.fn() },
}));
vi.mock('../components/dashboard', async (importOriginal) => ({
  ...(await importOriginal()),
  DashboardLayout: ({ children }) => <div>{children}</div>,
}));

import reliefApi from '../services/reliefApi';
import { MyReliefPledgesPage } from './MyReliefPledgesPage';
import { ReliefPledgeDetailPage } from './ReliefPledgeDetailPage';
import { pledge } from '../test/fixtures';

const track = (over) => ({ ...pledge().tracking, ...over });
const list = (pledges, meta = {}) => ({ data: { pledges }, meta: { page: 1, limit: 25, totalItems: pledges.length, totalPages: 1, ...meta } });

beforeEach(() => {
  vi.clearAllMocks();
  reliefApi.listMyPledges.mockResolvedValue(list([]));
  reliefApi.getPledgeTimeline.mockResolvedValue({ data: { events: [] } });
});

describe('MyReliefPledgesPage', () => {
  const renderList = () => render(<MemoryRouter><MyReliefPledgesPage /></MemoryRouter>);

  it('shows loading, then the donor\'s active pledges with server quantities and statuses', async () => {
    reliefApi.listMyPledges.mockResolvedValue(list([
      pledge({ id: 1, itemName: 'Dry food', quantityPledged: 100, quantityCollected: 80, quantityPendingVerification: 80, tracking: track({ taskStatus: 'delivery_reported', volunteerName: 'Vol One' }), status: 'collected' }),
      pledge({ id: 2, itemName: 'Water', status: 'delivered', quantityPledged: 50, quantityDelivered: 50, tracking: track({ taskStatus: 'completed' }) }),
    ]));
    renderList();
    expect(screen.getByRole('status', { name: 'Loading pledges' })).toBeTruthy();
    const cards = await screen.findAllByTestId('pledge-card');
    expect(cards).toHaveLength(1); // default tab = Active
    const c = cards[0];
    expect(within(c).getByText('Dry food')).toBeTruthy();
    expect(within(c).getByText('Delivery reported — awaiting verification')).toBeTruthy();
    expect(within(c).getByText('Awaiting verification').nextSibling.textContent).toBe('80 packets');
    expect(within(c).getByText('Verified delivered').nextSibling.textContent).toBe('0 packets'); // reported is not delivered
    expect(within(c).getByText(/Volunteer: Vol One/)).toBeTruthy();
    expect(within(c).getAllByRole('link').every((a) => a.getAttribute('href') === '/donor/relief-pledges/1')).toBe(true);
  });

  it('tabs separate active from previous pledges (delivered, partial, cancelled, failed)', async () => {
    reliefApi.listMyPledges.mockResolvedValue(list([
      pledge({ id: 1, itemName: 'A-active' }),
      pledge({ id: 2, itemName: 'B-done', status: 'delivered', tracking: track({ taskStatus: 'completed' }) }),
      pledge({ id: 3, itemName: 'C-partial', status: 'partially_fulfilled', tracking: track({ taskStatus: 'completed_partial' }) }),
      pledge({ id: 4, itemName: 'D-cancelled', status: 'cancelled', tracking: track({ taskStatus: 'cancelled' }) }),
      pledge({ id: 5, itemName: 'E-failed', status: 'failed', tracking: track({ taskStatus: 'failed' }) }),
    ]));
    renderList();
    await screen.findByText('A-active');
    fireEvent.click(screen.getByRole('tab', { name: 'Previous' }));
    expect(screen.getAllByTestId('pledge-card').map((c) => c.querySelector('h3').textContent)).toEqual(['B-done', 'C-partial', 'D-cancelled', 'E-failed']);
    expect(screen.getByText('Partially delivered and verified')).toBeTruthy();
    expect(screen.getByText('Cancelled', { selector: 'span' })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'All' }));
    expect(screen.getAllByTestId('pledge-card')).toHaveLength(5);
  });

  it('empty state, error with retry, and pagination', async () => {
    renderList();
    expect(await screen.findByText('No active pledges')).toBeTruthy();
    reliefApi.listMyPledges.mockRejectedValueOnce({ response: { status: 500 } });
    const { unmount } = renderList();
    expect(await screen.findByText('Could not load your pledges')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: /try again|retry/i })[0]);
    unmount();
    reliefApi.listMyPledges.mockResolvedValue(list([pledge()], { totalPages: 3, totalItems: 60 }));
    renderList();
    await screen.findByText('Page 1 of 3');
    reliefApi.listMyPledges.mockResolvedValue(list([pledge({ id: 9, itemName: 'Second page item' })], { page: 2, totalPages: 3, totalItems: 60 }));
    fireEvent.click(screen.getAllByRole('button', { name: /Next/ }).at(-1));
    await waitFor(() => expect(reliefApi.listMyPledges).toHaveBeenLastCalledWith({ page: 2, limit: 25 }));
    expect(await screen.findByText('Second page item')).toBeTruthy();
  });
});

describe('ReliefPledgeDetailPage', () => {
  const renderDetail = (path = '/donor/relief-pledges/41') => render(
    <MemoryRouter initialEntries={[path]}><Routes><Route path="/donor/relief-pledges/:id" element={<ReliefPledgeDetailPage />} /></Routes></MemoryRouter>
  );
  const respond = (p, item = { quantities: { remainingToPledge: 20 } }) => reliefApi.getPledge.mockResolvedValue({ data: { pledge: p, item } });

  it.each([
    ['available', /waiting for a volunteer to accept the pickup\. Nothing has been collected or delivered yet/],
    ['on_the_way', /on the way to collect/],
    ['picked_up', /picked up and are on their way.*not delivered yet/],
    ['delivery_reported', /reported delivering your supplies\. This counts as delivered once an administrator verifies it/],
    ['completed', /delivered and verified/],
    ['completed_partial', /Part of your pledge was delivered and verified/],
    ['failed', /Nothing has been counted as delivered/],
    ['cancelled', /available to other donors again/],
  ])('explains the %s stage without claiming early delivery', async (taskStatus, expected) => {
    respond(pledge({ tracking: track({ taskStatus }) }));
    renderDetail();
    const note = await screen.findByRole('status', { name: '' });
    expect(note.textContent).toMatch(expected);
    if (!['completed', 'completed_partial'].includes(taskStatus)) expect(note.textContent).not.toMatch(/was delivered and verified|have been delivered/);
  });

  it('shows pickup, drop-off, volunteer (name only) and the quantities, with reported separate from verified', async () => {
    respond(pledge({ status: 'collected', quantityCollected: 80, quantityPendingVerification: 80, tracking: track({ taskStatus: 'delivery_reported', volunteerName: 'Vol One', scheduledAt: '2026-10-20T04:00:00Z' }) }));
    reliefApi.getPledgeTimeline.mockResolvedValue({ data: { events: [
      { kind: 'status', at: '2026-10-12T09:00:00Z', from: 'pending', to: 'accepted' },
      { kind: 'report', id: 1, at: '2026-10-13T09:00:00Z', type: 'pickup', status: 'recorded', quantity: 80, isFinal: false },
    ] } });
    renderDetail();
    await screen.findByRole('heading', { level: 1, name: 'Dry food' });
    const q = screen.getByRole('region', { name: 'Quantities' });
    expect(within(q).getByText('Awaiting verification').nextSibling.textContent).toBe('80 packets');
    expect(within(q).getByText('Verified delivered').nextSibling.textContent).toBe('0 packets');
    expect(screen.getByText('House 5, Road 3, Gulshan')).toBeTruthy();
    expect(screen.getByText('Govt School Shelter')).toBeTruthy();
    expect(screen.getByText('Vol One')).toBeTruthy();
    expect(await screen.findByText('A volunteer accepted the pickup')).toBeTruthy();
    expect(screen.getByText('Pickup confirmed')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/\+880/);
  });

  it('the quantity can be changed only before a volunteer accepts; cancel stays available until pickup', async () => {
    respond(pledge());
    const { unmount } = renderDetail();
    await screen.findByRole('button', { name: 'Change quantity' });
    expect(screen.getByRole('button', { name: 'Cancel pledge' })).toBeTruthy();
    unmount();
    respond(pledge({ tracking: track({ taskStatus: 'accepted', volunteerName: 'Vol One' }) }));
    const second = renderDetail();
    await screen.findByRole('button', { name: 'Cancel pledge' });
    expect(screen.queryByRole('button', { name: 'Change quantity' })).toBeNull();
    expect(screen.getByText(/quantity is locked/)).toBeTruthy();
    second.unmount();
    respond(pledge({ status: 'collected', tracking: track({ taskStatus: 'picked_up' }) }));
    renderDetail();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('button', { name: 'Cancel pledge' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Change quantity' })).toBeNull();
  });

  it('editing validates against the server-provided room and shows server rejections', async () => {
    respond(pledge({ quantityPledged: 100 }), { quantities: { remainingToPledge: 20 } }); // room = 20 + own 100
    reliefApi.updatePledge.mockResolvedValue({ data: {} });
    renderDetail();
    fireEvent.click(await screen.findByRole('button', { name: 'Change quantity' }));
    fireEvent.change(screen.getByLabelText(/New quantity/), { target: { value: '121' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/Only 120 is still needed/);
    expect(reliefApi.updatePledge).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/New quantity/), { target: { value: '90' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(reliefApi.updatePledge).toHaveBeenCalledWith(41, { quantity: '90' }));
    expect(await screen.findByText('Quantity updated.')).toBeTruthy();
  });

  it('cancelling asks for confirmation, calls the API with the reason, and reports success or the server error', async () => {
    respond(pledge({ tracking: track({ taskStatus: 'accepted', volunteerName: 'Vol One' }) }));
    reliefApi.cancelPledge.mockRejectedValueOnce({ response: { status: 409, data: { message: 'A pickup that is already collected cannot be cancelled.' } } });
    renderDetail();
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel pledge' }));
    expect(screen.getByText(/Vol One will be told/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'Plans changed' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel pledge' }).at(-1));
    expect((await screen.findAllByRole('alert'))[0].textContent).toMatch(/already collected/);
    reliefApi.cancelPledge.mockResolvedValueOnce({ data: {} });
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel pledge' }).at(-1));
    await waitFor(() => expect(reliefApi.cancelPledge).toHaveBeenCalledTimes(2));
    expect(reliefApi.cancelPledge).toHaveBeenLastCalledWith(41, 'Plans changed');
    expect(await screen.findByText('Pledge cancelled.')).toBeTruthy();
  });

  it('flags an open issue, and handles 404 and invalid ids', async () => {
    respond(pledge({ tracking: track({ hasOpenIssue: true }) }));
    const a = renderDetail();
    expect(await screen.findByText(/An administrator is looking into an issue/)).toBeTruthy();
    a.unmount();
    reliefApi.getPledge.mockRejectedValue({ response: { status: 404 } });
    const b = renderDetail();
    expect(await screen.findByText('Could not load this pledge')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /try again|retry/i })).toBeNull();
    b.unmount();
    vi.clearAllMocks();
    renderDetail('/donor/relief-pledges/abc');
    expect(await screen.findByText('Invalid link')).toBeTruthy();
    expect(reliefApi.getPledge).not.toHaveBeenCalled();
  });
});
