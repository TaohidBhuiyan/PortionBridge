import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../services/reliefApi', () => ({ default: { getRequest: vi.fn(), getIncident: vi.fn() } }));
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../components/relief/PledgeDialog', () => ({
  PledgeDialog: ({ item, incident, onClose, onPledged }) => (
    <div role="dialog" aria-label="pledge dialog">
      <span>Dialog for {item.name} / {incident?.title}</span>
      <button type="button" onClick={() => onPledged({ pledge: { id: 1 } })}>stub-pledged</button>
      <button type="button" onClick={onClose}>stub-close</button>
    </div>
  ),
}));
vi.mock('../components/dashboard', async (importOriginal) => ({
  ...(await importOriginal()),
  DashboardLayout: ({ children }) => <div>{children}</div>,
}));

import reliefApi from '../services/reliefApi';
import { useAuth } from '../context/AuthContext';
import { ReliefRequestPage } from './ReliefRequestPage';
import { request, item, quantities } from '../test/fixtures';

const renderAt = (path = '/relief/requests/5') => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes><Route path="/relief/requests/:id" element={<ReliefRequestPage />} /></Routes>
  </MemoryRouter>
);
const respond = (req) => reliefApi.getRequest.mockResolvedValue({ data: { request: req } });

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ user: { id: 3, role: 'volunteer' } });
  reliefApi.getIncident.mockResolvedValue({ data: { incident: { id: 1, title: 'Test flood' } } });
  respond(request());
});

describe('ReliefRequestPage', () => {
  it('shows request status, priority, location, last-updated and a link back to the incident', async () => {
    renderAt();
    expect(await screen.findByRole('heading', { level: 1, name: 'Shelter supplies' })).toBeTruthy();
    expect(reliefApi.getRequest).toHaveBeenCalledWith(5);
    expect(screen.getByText('Open for pledges')).toBeTruthy();
    expect(screen.getAllByText('High priority').length).toBeGreaterThan(0);
    expect(screen.getByText('Govt Primary School')).toBeTruthy();
    expect(screen.getByText(/Last updated/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Back to incident/ }).getAttribute('href')).toBe('/relief/incidents/1');
  });

  it('presents every item with the backend quantities (illustrative multi-item request built from API-shaped data)', async () => {
    respond(request({
      items: [
        item({ id: 1, name: 'Drinking water', unit: 'liter', quantities: quantities({ requested: 1000, delivered: 400, activePledged: 200, collected: 450, remainingUnfulfilled: 600, remainingToPledge: 400 }) }),
        item({ id: 2, name: 'Dry food', category: 'dry_food', unit: 'packet', quantities: quantities({ requested: 500, delivered: 0, activePledged: 500, collected: 0, remainingUnfulfilled: 500, remainingToPledge: 0, fulfillmentStage: 'fully_pledged' }) }),
        item({ id: 3, name: 'Blankets', category: 'blanket', unit: 'piece', quantities: quantities({ requested: 200, delivered: 200, activePledged: 0, collected: 200, remainingUnfulfilled: 0, remainingToPledge: 0, fulfillmentStage: 'fulfilled' }) }),
      ],
      summary: { totalItems: 3, fulfilledItems: 1, fullyPledgedItems: 1, partiallyPledgedItems: 0, partiallyDeliveredItems: 1, openItems: 0, isFullyFulfilled: false },
    }));
    renderAt();
    const cards = await screen.findAllByTestId('relief-item');
    expect(cards).toHaveLength(3);
    const value = (card, label) => within(card).getByText(label, { selector: 'dt' }).parentElement.querySelector('dd').textContent;
    // water: 400 of 1,000 delivered, 200 pledged-outstanding, 450 collected
    expect(value(cards[0], 'Required')).toBe('1,000 litres');
    expect(value(cards[0], 'Delivered')).toBe('400 litres');
    expect(value(cards[0], 'Pledged')).toBe('200 litres');
    expect(value(cards[0], 'Collected')).toBe('450 litres');
    expect(value(cards[0], 'Still needed')).toBe('600 litres');
    expect(within(cards[0]).getByRole('progressbar').getAttribute('aria-valuenow')).toBe('40');
    // dry food: fully pledged, nothing delivered -> 0% delivered (pledged is not delivered)
    expect(value(cards[1], 'Required')).toBe('500 packets');
    expect(value(cards[1], 'Pledged')).toBe('500 packets');
    expect(value(cards[1], 'Delivered')).toBe('0 packets');
    expect(within(cards[1]).getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
    // blankets: fulfilled
    expect(value(cards[2], 'Required')).toBe('200 units');
    expect(value(cards[2], 'Delivered')).toBe('200 units');
    expect(within(cards[2]).getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
    const summary = screen.getByRole('region', { name: 'Request progress' });
    expect(within(summary).getByText('3')).toBeTruthy();
  });

  it('explains pledged vs delivered; non-donors are pointed to donors for pledging and see no pledge button', async () => {
    renderAt();
    await screen.findByRole('heading', { level: 1 });
    const help = screen.getByRole('region', { name: 'How to read these numbers' });
    expect(help.textContent).toMatch(/have not been delivered yet/);
    expect(help.textContent).toMatch(/Donors can pledge supplies from this page/);
    expect(help.textContent).not.toMatch(/later release/);
    expect(screen.queryByRole('button', { name: /pledge/i })).toBeNull();
  });

  it('shows the delivery address and review notes only when the backend sends them', async () => {
    renderAt();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText(/Delivery address/)).toBeNull();
    expect(screen.queryByText(/Review notes/)).toBeNull();
  });

  it('shows the address when provided (owner/admin payload) and renders text safely', async () => {
    respond(request({ address: 'School road 5', description: '<script>x</script>' }));
    renderAt();
    expect(await screen.findByText(/School road 5/)).toBeTruthy();
    expect(document.querySelector('script[src], main script')).toBeNull();
    expect(screen.getByText('<script>x</script>')).toBeTruthy();
  });

  it('expired requests are labelled expired', async () => {
    respond(request({ isExpired: true, expiresAt: '2020-01-01T00:00:00Z' }));
    renderAt();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getAllByText('Expired').length).toBeGreaterThan(0);
  });

  it('empty item list and missing values degrade gracefully', async () => {
    respond(request({ items: [], summary: undefined }));
    renderAt();
    expect(await screen.findByText('No supplies listed')).toBeTruthy();
  });

  it('404 and invalid ids are handled without crashing', async () => {
    reliefApi.getRequest.mockRejectedValue({ response: { status: 404 } });
    const { unmount } = renderAt();
    expect(await screen.findByText('Could not load this relief request')).toBeTruthy();
    expect(screen.getByText(/could not be found/i)).toBeTruthy();
    unmount();
    vi.clearAllMocks();
    renderAt('/relief/requests/0');
    expect(await screen.findByText('Invalid link')).toBeTruthy();
    expect(reliefApi.getRequest).not.toHaveBeenCalled();
  });
});

describe('ReliefRequestPage — pledge action', () => {
  const donor = () => useAuth.mockReturnValue({ user: { id: 9, role: 'donor' } });

  it('donors see a Pledge button for each item that still needs supplies, and it opens the pledge dialog with the incident', async () => {
    donor();
    renderAt();
    fireEvent.click(await screen.findByRole('button', { name: 'Pledge Drinking water' }));
    const dialog = await screen.findByRole('dialog', { name: 'pledge dialog' });
    expect(dialog.textContent).toMatch(/Dialog for Drinking water/);
    await waitFor(() => expect(dialog.textContent).toMatch(/Test flood/)); // incident title loaded for the review step
    expect(reliefApi.getIncident).toHaveBeenCalledWith(1);
  });

  it('after a pledge the page confirms, links to My Relief Pledges and reloads server quantities', async () => {
    donor();
    renderAt();
    fireEvent.click(await screen.findByRole('button', { name: 'Pledge Drinking water' }));
    fireEvent.click(await screen.findByRole('button', { name: 'stub-pledged' }));
    expect(await screen.findByText(/Your pledge was recorded/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View My Relief Pledges' }).getAttribute('href')).toBe('/donor/relief-pledges');
    await waitFor(() => expect(reliefApi.getRequest.mock.calls.length).toBeGreaterThanOrEqual(2)); // amounts re-read from the server
  });

  it('no Pledge button when nothing is left to pledge, the request is not open, is expired, or the viewer is not a donor', async () => {
    donor();
    respond(request({ items: [item({ quantities: quantities({ remainingToPledge: 0, fulfillmentStage: 'fully_pledged' }) })] }));
    const a = renderAt();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('button', { name: /^Pledge/ })).toBeNull();
    a.unmount();
    for (const over of [{ status: 'completed' }, { status: 'cancelled' }, { isExpired: true }]) {
      respond(request(over));
      const r = renderAt();
      await screen.findByRole('heading', { level: 1 });
      expect(screen.queryByRole('button', { name: /^Pledge/ }), JSON.stringify(over)).toBeNull();
      r.unmount();
    }
    useAuth.mockReturnValue({ user: { id: 1, role: 'admin' } });
    respond(request());
    renderAt();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('button', { name: /^Pledge/ })).toBeNull();
  });

  it('shows reported-but-unverified delivery separately from delivered', async () => {
    respond(request({ items: [item({ quantities: quantities({ pendingVerification: 40 }) })] }));
    renderAt();
    const note = await screen.findByTestId('pending-verification');
    expect(note.textContent).toMatch(/40 litres reported delivered/);
    expect(note.textContent).toMatch(/awaiting administrator verification/);
    expect(note.textContent).toMatch(/not counted as delivered yet/);
  });
});
