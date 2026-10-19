import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../services/reliefApi', () => ({ default: { getIncident: vi.fn(), listIncidentRequests: vi.fn() } }));
vi.mock('../components/dashboard', async (importOriginal) => ({
  ...(await importOriginal()),
  DashboardLayout: ({ children }) => <div>{children}</div>,
}));
vi.mock('../components/relief/DisasterMap', () => ({ DisasterMap: ({ incidents }) => <div data-testid="map-stub" data-count={incidents.length} /> }));

import reliefApi from '../services/reliefApi';
import { DisasterIncidentPage } from './DisasterIncidentPage';
import { incident, request, item, quantities } from '../test/fixtures';

const renderAt = (path = '/relief/incidents/1') => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes><Route path="/relief/incidents/:id" element={<DisasterIncidentPage />} /></Routes>
  </MemoryRouter>
);
const respondIncident = (inc) => reliefApi.getIncident.mockResolvedValue({ data: { incident: inc } });
const respondRequests = (requests) => reliefApi.listIncidentRequests.mockResolvedValue({ data: { requests }, meta: {} });

beforeEach(() => {
  vi.clearAllMocks();
  respondIncident(incident({ id: 1 }));
  respondRequests([request()]);
});

describe('DisasterIncidentPage — incident details', () => {
  it('shows title, type, severity, status, location, description and timestamps', async () => {
    renderAt();
    expect(await screen.findByRole('heading', { level: 1, name: 'Test flood' })).toBeTruthy();
    expect(reliefApi.getIncident).toHaveBeenCalledWith(1);
    const details = screen.getByRole('region', { name: 'Incident details' });
    expect(within(details).getByText('Water is rising')).toBeTruthy();
    expect(within(details).getByText('Sylhet')).toBeTruthy();
    expect(within(details).getByText('Companiganj')).toBeTruthy();
    expect(within(details).getByText('Reported')).toBeTruthy();
    expect(within(details).getByText('Last updated')).toBeTruthy();
    expect(screen.getByText('High severity')).toBeTruthy();
    expect(screen.getByText('Flood', { selector: 'span' })).toBeTruthy();
  });

  it('labels a verified incident as verified (backend flag true)', async () => {
    renderAt();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByText(/An administrator has confirmed this incident/)).toBeTruthy();
    expect(screen.queryByText(/has not been confirmed/)).toBeNull();
  });

  it('does NOT call an incident confirmed unless the backend says verified', async () => {
    respondIncident(incident({ isVerified: false, status: 'reported', verifiedAt: null }));
    renderAt();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByText(/has not been confirmed by an administrator/)).toBeTruthy();
    expect(screen.queryByText(/has confirmed this incident/)).toBeNull();
    expect(screen.getAllByText('Not verified').length).toBeGreaterThan(0);
  });

  it('treats a missing isVerified field as not verified', async () => {
    respondIncident(incident({ isVerified: undefined }));
    renderAt();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByText(/has not been confirmed by an administrator/)).toBeTruthy();
  });

  it('hides moderation / reporter data when the backend did not send it (public viewer)', async () => {
    renderAt();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('region', { name: 'Moderation details' })).toBeNull();
    expect(screen.queryByText(/Reported by/)).toBeNull();
    expect(screen.queryByText(/Address \(visible to you only\)/)).toBeNull();
  });

  it('shows moderation details when the backend returns them (administrator), with safe links only', async () => {
    respondIncident(incident({ reporterName: 'Rina', verifierName: 'Admin A', verificationNotes: 'Confirmed by district office', sourceReference: 'https://example.org/report', address: '12 Lane' }));
    const { unmount } = renderAt();
    const mod = await screen.findByRole('region', { name: 'Moderation details' });
    expect(within(mod).getByText('Rina')).toBeTruthy();
    expect(within(mod).getByText('Confirmed by district office')).toBeTruthy();
    expect(within(mod).getByRole('link').getAttribute('href')).toBe('https://example.org/report');
    expect(within(mod).getByRole('link').getAttribute('rel')).toMatch(/noopener/);
    unmount();
    respondIncident(incident({ sourceReference: 'javascript:alert(1)', reporterName: 'x' }));
    renderAt();
    const mod2 = await screen.findByRole('region', { name: 'Moderation details' });
    expect(within(mod2).queryByRole('link')).toBeNull();
    expect(within(mod2).getByText('javascript:alert(1)')).toBeTruthy(); // shown as inert text
  });

  it('renders user-written description as text, not HTML', async () => {
    const evil = '<img src=x onerror=alert(1)><b>bold</b>';
    respondIncident(incident({ description: evil, title: evil }));
    renderAt();
    await screen.findByRole('heading', { level: 1 });
    expect(document.querySelector('img[src="x"]')).toBeNull();
    expect(screen.getAllByText(evil).length).toBeGreaterThan(0);
  });

  it('incident without coordinates: explains instead of showing a map', async () => {
    respondIncident(incident({ latitude: null, longitude: null }));
    renderAt();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByTestId('map-stub')).toBeNull();
    expect(screen.getByText(/No map location was provided/)).toBeTruthy();
  });

  it('with coordinates: shows a map and notes the position is approximate', async () => {
    renderAt();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByTestId('map-stub').getAttribute('data-count')).toBe('1');
    expect(screen.getByText(/approximate area/)).toBeTruthy();
  });
});

describe('DisasterIncidentPage — relief requests', () => {
  it('lists requests with quantities and links to each request', async () => {
    renderAt();
    const card = await screen.findByTestId('relief-request-card');
    expect(reliefApi.listIncidentRequests).toHaveBeenCalledWith(1, { limit: 50 });
    expect(within(card).getByText('Shelter supplies')).toBeTruthy();
    expect(within(card).getByText('150 litres of 1,000 litres delivered')).toBeTruthy();
    expect(within(card).getAllByRole('link').some((a) => a.getAttribute('href') === '/relief/requests/5')).toBe(true);
    expect(screen.getByText('Open for pledges')).toBeTruthy();
  });

  it('shows an empty state when there are no verified requests', async () => {
    respondRequests([]);
    renderAt();
    expect(await screen.findByText('No verified relief requests yet')).toBeTruthy();
  });

  it('a requests failure does not hide the incident, and can be retried', async () => {
    reliefApi.listIncidentRequests.mockRejectedValueOnce({ response: { status: 500 } });
    renderAt();
    expect(await screen.findByRole('heading', { level: 1, name: 'Test flood' })).toBeTruthy();
    expect(await screen.findByText('Could not load relief requests')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /try again|retry/i }));
    expect(await screen.findByTestId('relief-request-card')).toBeTruthy();
  });

  it('shows a request item with nothing delivered as 0% — pledged does not look delivered', async () => {
    respondRequests([request({ items: [item({ quantities: quantities({ requested: 100, activePledged: 100, delivered: 0, collected: 0 }) })] })]);
    renderAt();
    const card = await screen.findByTestId('relief-request-card');
    expect(within(card).getByText('0 litres of 100 litres delivered')).toBeTruthy();
    expect(within(card).getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });
});

describe('DisasterIncidentPage — failures', () => {
  it('404: explains the incident is not found / not public, no retry loop, no request fetch', async () => {
    reliefApi.getIncident.mockRejectedValue({ response: { status: 404 } });
    renderAt();
    expect(await screen.findByText('Could not load this incident')).toBeTruthy();
    expect(screen.getByText(/could not be found/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /try again|retry/i })).toBeNull();
    expect(reliefApi.listIncidentRequests).not.toHaveBeenCalled();
  });

  it('server error: shows retry', async () => {
    reliefApi.getIncident.mockRejectedValueOnce({ response: { status: 500 } });
    renderAt();
    expect(await screen.findByText('Could not load this incident')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /try again|retry/i }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Test flood' })).toBeTruthy();
  });

  it('invalid id: no API call', async () => {
    renderAt('/relief/incidents/abc');
    expect(await screen.findByText('Invalid link')).toBeTruthy();
    expect(reliefApi.getIncident).not.toHaveBeenCalled();
  });
});
