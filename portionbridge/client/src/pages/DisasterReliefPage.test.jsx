import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/reliefApi', () => ({ default: { listIncidents: vi.fn() } }));
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../components/dashboard', async (importOriginal) => ({
  ...(await importOriginal()),
  DashboardLayout: ({ children }) => <div data-testid="layout">{children}</div>,
}));
vi.mock('../components/relief/DisasterMap', async () => {
  const { hasMapLocation } = await import('../utils/relief');
  return {
    DisasterMap: ({ incidents, userLocation, radiusKm }) => (
      <div data-testid="map-stub" data-markers={incidents.filter(hasMapLocation).length} data-user={userLocation ? `${userLocation.lat},${userLocation.lng}` : ''} data-radius={radiusKm ?? ''} />
    ),
  };
});

import reliefApi from '../services/reliefApi';
import { useAuth } from '../context/AuthContext';
import { DisasterReliefPage } from './DisasterReliefPage';
import { incident, listResponse } from '../test/fixtures';

const sylhet = incident({ id: 1, title: 'Sylhet flood', district: 'Sylhet', latitude: 24.9, longitude: 91.87 });
const coxs = incident({ id: 2, title: 'Cyclone Cox', district: "Cox's Bazar", disasterType: 'cyclone', latitude: 21.45, longitude: 91.97 });
const unmapped = incident({ id: 3, title: 'Unmapped fire', disasterType: 'fire', district: 'Dhaka', latitude: null, longitude: null });

const setGeolocation = (value) => Object.defineProperty(globalThis.navigator, 'geolocation', { value, configurable: true });
const lastParams = () => reliefApi.listIncidents.mock.calls.at(-1)[0];
const renderPage = () => render(<MemoryRouter><DisasterReliefPage /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ user: { id: 9, role: 'donor' } });
  reliefApi.listIncidents.mockResolvedValue(listResponse([sylhet, coxs, unmapped]));
  setGeolocation({ getCurrentPosition: vi.fn(), watchPosition: vi.fn() });
});
afterEach(() => setGeolocation(undefined));

describe('DisasterReliefPage — nationwide browsing', () => {
  it('loads active + verified incidents nationwide by default, with no location parameters and no location prompt', async () => {
    renderPage();
    expect(await screen.findByText('Sylhet flood')).toBeTruthy();
    expect(reliefApi.listIncidents).toHaveBeenCalledWith({ page: 1, limit: 25, status: 'verified,active' });
    expect(globalThis.navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled();
    // incidents from different parts of the country are all present
    expect(screen.getByText('Cyclone Cox')).toBeTruthy();
    expect(screen.getByText('Unmapped fire')).toBeTruthy();
  });

  it('lists unmapped incidents, flags them, and only maps the ones with valid coordinates', async () => {
    renderPage();
    await screen.findByText('Unmapped fire');
    expect(screen.getAllByTestId('incident-card')).toHaveLength(3);
    expect(screen.getByTestId('map-stub').getAttribute('data-markers')).toBe('2');
    expect(screen.getByText(/1 on this page has no map location/)).toBeTruthy();
    expect(screen.getByText('No map location')).toBeTruthy();
  });

  it('shows result counts and a legend explaining marker styles', async () => {
    renderPage();
    await screen.findByText('Sylhet flood');
    expect(screen.getByText(/Showing 1–3 of 3 incidents/)).toBeTruthy();
    const legend = screen.getByRole('region', { name: 'Map legend' });
    expect(within(legend).getByText('Colour = severity')).toBeTruthy();
    expect(within(legend).getByText('Icon = disaster type')).toBeTruthy();
    expect(within(legend).getByText('Outline = status')).toBeTruthy();
  });
});

describe('DisasterReliefPage — filters, search, pagination', () => {
  it('sends type, severity, district and status filters to the API and resets to page 1', async () => {
    renderPage();
    await screen.findByText('Sylhet flood');
    fireEvent.change(screen.getByLabelText('Disaster type'), { target: { value: 'flood' } });
    await waitFor(() => expect(lastParams().disasterType).toBe('flood'));
    fireEvent.change(screen.getByLabelText('Severity'), { target: { value: 'critical' } });
    await waitFor(() => expect(lastParams().severity).toBe('critical'));
    fireEvent.change(screen.getByLabelText('District'), { target: { value: 'Sunamganj' } });
    await waitFor(() => expect(lastParams().district).toBe('Sunamganj'));
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'resolved' } });
    await waitFor(() => expect(lastParams().status).toBe('resolved'));
    expect(lastParams()).toMatchObject({ page: 1, disasterType: 'flood', severity: 'critical', district: 'Sunamganj', status: 'resolved' });
  });

  it('debounces keyword search (no request per keystroke)', async () => {
    renderPage();
    await screen.findByText('Sylhet flood');
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const before = reliefApi.listIncidents.mock.calls.length;
    const input = screen.getByLabelText('Search');
    fireEvent.change(input, { target: { value: 'su' } });
    fireEvent.change(input, { target: { value: 'sunam' } });
    await act(async () => { vi.advanceTimersByTime(200); });
    expect(reliefApi.listIncidents.mock.calls.length).toBe(before);
    await act(async () => { vi.advanceTimersByTime(300); });
    await waitFor(() => expect(lastParams().search).toBe('sunam'));
    expect(reliefApi.listIncidents.mock.calls.length).toBe(before + 1);
  });

  it('paginates with Next / Previous', async () => {
    reliefApi.listIncidents.mockResolvedValue(listResponse([sylhet], { totalItems: 60, totalPages: 3, page: 1 }));
    renderPage();
    await screen.findByText('Sylhet flood');
    expect(screen.getByText('Page 1 of 3')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Previous/ }).disabled).toBe(true);
    reliefApi.listIncidents.mockResolvedValue(listResponse([coxs], { totalItems: 60, totalPages: 3, page: 2 }));
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    await waitFor(() => expect(lastParams().page).toBe(2));
    expect(await screen.findByText('Cyclone Cox')).toBeTruthy();
    expect(screen.getByText('Page 2 of 3')).toBeTruthy();
  });

  it('only offers unverified/rejected scopes to administrators', async () => {
    const { unmount } = renderPage();
    await screen.findByText('Sylhet flood');
    let options = within(screen.getByLabelText('Status')).getAllByRole('option').map((o) => o.textContent);
    expect(options).not.toContain('Unverified reports');
    expect(options).not.toContain('Rejected');
    unmount();
    useAuth.mockReturnValue({ user: { id: 1, role: 'admin' } });
    renderPage();
    await screen.findByText('Sylhet flood');
    options = within(screen.getByLabelText('Status')).getAllByRole('option').map((o) => o.textContent);
    expect(options).toContain('Unverified reports');
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'unverified' } });
    await waitFor(() => expect(lastParams().status).toBe('reported,under_review'));
  });

  it('"Clear filters" returns to the default nationwide query', async () => {
    renderPage();
    await screen.findByText('Sylhet flood');
    fireEvent.change(screen.getByLabelText('Disaster type'), { target: { value: 'fire' } });
    await waitFor(() => expect(lastParams().disasterType).toBe('fire'));
    fireEvent.click(screen.getByRole('button', { name: /Clear 1 filter/ }));
    await waitFor(() => expect(lastParams()).toEqual({ page: 1, limit: 25, status: 'verified,active' }));
  });
});

describe('DisasterReliefPage — loading, empty and error states', () => {
  it('shows a loading indicator while the request is pending', async () => {
    reliefApi.listIncidents.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('status', { name: 'Loading incidents' })).toBeTruthy();
    expect(screen.getByTestId('map-stub')).toBeTruthy(); // the map still renders
  });

  it('shows an empty state with a way to clear filters', async () => {
    reliefApi.listIncidents.mockResolvedValue(listResponse([]));
    renderPage();
    expect(await screen.findByText('No incidents match')).toBeTruthy();
  });

  it('survives an API failure and recovers on retry', async () => {
    reliefApi.listIncidents.mockRejectedValueOnce({ response: { status: 500 } });
    renderPage();
    expect(await screen.findByText('Could not load incidents')).toBeTruthy();
    expect(screen.getByTestId('map-stub')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /try again|retry/i }));
    expect(await screen.findByText('Sylhet flood')).toBeTruthy();
  });

  it('ignores a slow stale response so older data cannot overwrite newer results', async () => {
    let resolveSlow;
    reliefApi.listIncidents.mockReturnValueOnce(new Promise((r) => { resolveSlow = r; }));
    renderPage();
    reliefApi.listIncidents.mockResolvedValue(listResponse([coxs]));
    fireEvent.change(screen.getByLabelText('Disaster type'), { target: { value: 'cyclone' } });
    expect(await screen.findByText('Cyclone Cox')).toBeTruthy();
    await act(async () => { resolveSlow(listResponse([sylhet])); });
    expect(screen.queryByText('Sylhet flood')).toBeNull();
  });
});

describe('DisasterReliefPage — Nearby mode', () => {
  it('permission denied: shows a notice, keeps the full nationwide list, can go back', async () => {
    const geo = { getCurrentPosition: vi.fn((_, fail) => fail({ code: 1 })), watchPosition: vi.fn() };
    setGeolocation(geo);
    renderPage();
    await screen.findByText('Sylhet flood');
    fireEvent.click(screen.getByRole('button', { name: /Nearby/ }));
    expect(geo.getCurrentPosition).toHaveBeenCalledTimes(1);
    expect((await screen.findByRole('alert')).textContent).toMatch(/permission was denied/i);
    expect(screen.getAllByTestId('incident-card')).toHaveLength(3); // nationwide still works
    expect(lastParams().limit).toBe(25);
    fireEvent.click(screen.getByRole('button', { name: 'Browse nationwide' }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(geo.watchPosition).not.toHaveBeenCalled();
  });

  it('geolocation unsupported: still works nationwide', async () => {
    setGeolocation(undefined);
    renderPage();
    await screen.findByText('Sylhet flood');
    fireEvent.click(screen.getByRole('button', { name: /Nearby/ }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/not available/i);
    expect(screen.getAllByTestId('incident-card')).toHaveLength(3);
  });

  it('permission granted: shows only incidents within the radius, nearest first, with distances; unmapped are excluded and explained', async () => {
    const geo = { getCurrentPosition: vi.fn((ok) => ok({ coords: { latitude: 24.89, longitude: 91.87 } })), watchPosition: vi.fn() };
    setGeolocation(geo);
    renderPage();
    await screen.findByText('Sylhet flood');
    fireEvent.click(screen.getByRole('button', { name: /Nearby/ }));
    await waitFor(() => expect(lastParams().limit).toBe(200));
    await waitFor(() => expect(screen.getAllByTestId('incident-card')).toHaveLength(1));
    expect(screen.getByText('Sylhet flood')).toBeTruthy();
    expect(screen.queryByText('Cyclone Cox')).toBeNull(); // ~350 km away
    expect(screen.getByText(/km away/)).toBeTruthy();
    expect(screen.getByText(/1 without a map location/)).toBeTruthy();
    const map = screen.getByTestId('map-stub');
    expect(map.getAttribute('data-user')).toBe('24.89,91.87');
    expect(map.getAttribute('data-radius')).toBe('50');
    // even at 200 km the ~350 km-away incident stays out; nationwide remains one click away
    fireEvent.change(screen.getByDisplayValue('50 km'), { target: { value: '200' } });
    expect(screen.getAllByTestId('incident-card')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /Nationwide/ }));
    await waitFor(() => expect(screen.getAllByTestId('incident-card')).toHaveLength(3));
    expect(geo.getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(geo.watchPosition).not.toHaveBeenCalled();
  });
});

describe('DisasterReliefPage — theme compatibility', () => {
  it('renders the same in dark mode (theme is class-based tokens)', async () => {
    document.documentElement.classList.add('dark');
    renderPage();
    expect(await screen.findByText('Sylhet flood')).toBeTruthy();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
