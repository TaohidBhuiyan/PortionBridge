import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../services/adminOpsApi', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, default: { incidentDetail: vi.fn(), requestInfo: vi.fn(), mergeIncident: vi.fn(), reopenIncident: vi.fn(), setIncidentStatus: vi.fn() } };
});
vi.mock('react-hot-toast', () => ({ default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
vi.mock('../components/dashboard', async (importOriginal) => ({ ...(await importOriginal()), DashboardLayout: ({ children }) => <div>{children}</div> }));

import api from '../services/adminOpsApi';
import { AdminIncidentOpsPage } from './AdminIncidentOpsPage';

const detail = (incident = {}) => ({
  data: {
    incident: { id: 7, title: 'Sylhet flood', description: 'Rising water', disasterType: 'flood', severity: 'high', status: 'under_review', verificationStatus: 'unverified', district: 'Sylhet', division: 'Sylhet', createdAt: '2026-10-19T08:00:00Z', updatedAt: '2026-10-19T09:00:00Z', reporterName: 'Reporter', ...incident },
    history: [{ id: 1, action: 'info_requested', fromStatus: 'reported', toStatus: 'under_review', reason: 'Add the village', actorName: 'Admin', createdAt: '2026-10-19T09:00:00Z' }],
    requests: [{ id: 3, title: 'Shelter supplies', status: 'approved', reassessment: [], items: [{ id: 1, name: 'Rice', unit: 'kg', quantities: { requested: 100, pledged: 60, collected: 20, delivered: 10, remainingToPledge: 40 } }] }],
    pledges: [{ id: 11, itemName: 'Rice', unit: 'kg', donorName: 'Donor A', pledged: 60, verifiedDelivered: 10, status: 'pledged', taskStatus: 'accepted', volunteerName: 'Vol 1' }],
    issues: [], alerts: { items: [{ id: 9, scope: 'local', severity: 'high', status: 'active', deliveredTotal: 12, eventsFailed: 0 }], notificationsStored: 12, notificationsRead: 4 },
    quantityHistory: [], mergedFrom: [], limitations: ['History before Phase 5 was not recorded in the incident timeline.'],
  },
});
const renderPage = () => render(<MemoryRouter initialEntries={['/admin/operations/incidents/7']}><Routes><Route path="/admin/operations/incidents/:id" element={<AdminIncidentOpsPage />} /></Routes></MemoryRouter>);

beforeEach(() => { vi.clearAllMocks(); api.incidentDetail.mockResolvedValue(detail()); });

describe('AdminIncidentOpsPage', () => {
  it('brings incident, requests with item progress, pledges, alerts and history together', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Sylhet flood' })).toBeTruthy();
    expect(screen.getByTestId('detail-request').textContent).toMatch(/requested 100 kg.*verified delivered 10 kg.*still needed 40 kg/);
    expect(screen.getByTestId('detail-pledge').textContent).toMatch(/Donor A/);
    expect(screen.getByTestId('detail-alerts').textContent).toMatch(/12 sent/);
    expect(screen.getByTestId('history').textContent).toMatch(/More information requested/);
    expect(screen.getByText(/History before Phase 5/)).toBeTruthy();
    expect(screen.queryByText(/@|\+880/)).toBeNull();
  });

  it('an unverified incident is shown as not verified and can be rejected only with a reason', async () => {
    api.setIncidentStatus.mockResolvedValue({});
    renderPage();
    expect((await screen.findAllByText('Not verified')).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /^reject$/i }));
    const buttons = screen.getAllByRole('button', { name: /^reject$/i });
    const dialogConfirm = buttons[buttons.length - 1];
    expect(dialogConfirm.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/reason for rejecting/i), { target: { value: 'Not a real event' } });
    expect(dialogConfirm.disabled).toBe(false);
    fireEvent.click(dialogConfirm);
    await waitFor(() => expect(api.setIncidentStatus).toHaveBeenCalledWith('7', 'rejected', 'Not a real event'));
  });

  it('verification is a deliberate action recorded with notes; merge requires an id and a reason', async () => {
    api.setIncidentStatus.mockResolvedValue({});
    api.mergeIncident.mockResolvedValue({});
    renderPage();
    await screen.findByRole('heading', { name: 'Sylhet flood' });
    fireEvent.click(screen.getByRole('button', { name: /^verify$/i }));
    fireEvent.change(screen.getByLabelText(/verification notes/i), { target: { value: 'Confirmed by the district office' } });
    const verifyButtons = screen.getAllByRole('button', { name: /^verify$/i });
    fireEvent.click(verifyButtons[verifyButtons.length - 1]);
    await waitFor(() => expect(api.setIncidentStatus).toHaveBeenCalledWith('7', 'verified', 'Confirmed by the district office'));

    fireEvent.click(screen.getByRole('button', { name: /merge duplicate/i }));
    const mergeBtn = screen.getByRole('button', { name: /^merge incident$/i });
    expect(mergeBtn.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Surviving incident ID'), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Same flood reported twice' } });
    expect(mergeBtn.disabled).toBe(true); // cannot merge into itself
    fireEvent.change(screen.getByLabelText('Surviving incident ID'), { target: { value: '5' } });
    expect(mergeBtn.disabled).toBe(false);
    fireEvent.click(mergeBtn);
    await waitFor(() => expect(api.mergeIncident).toHaveBeenCalledWith(7, '5', 'Same flood reported twice'));
  });

  it('resolved incidents offer reopen with a justification; merged ones point to the survivor', async () => {
    api.incidentDetail.mockResolvedValue(detail({ status: 'resolved', verificationStatus: 'verified' }));
    api.reopenIncident.mockResolvedValue({});
    const { unmount } = renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /^reopen$/i }));
    fireEvent.change(screen.getByLabelText(/justification/i), { target: { value: 'Water levels rose again' } });
    const buttons = screen.getAllByRole('button', { name: /^reopen$/i });
    fireEvent.click(buttons[buttons.length - 1]);
    await waitFor(() => expect(api.reopenIncident).toHaveBeenCalledWith('7', 'Water levels rose again'));
    unmount();
    api.incidentDetail.mockResolvedValue(detail({ status: 'merged', mergedIntoId: 5 }));
    renderPage();
    expect((await screen.findByRole('link', { name: /incident #5/ })).getAttribute('href')).toBe('/admin/operations/incidents/5');
    expect(screen.queryByRole('button', { name: /merge duplicate/i })).toBeNull();
  });

  it('shows an error state with retry', async () => {
    api.incidentDetail.mockRejectedValueOnce({ response: { status: 404, data: { message: 'Incident not found.' } } });
    renderPage();
    expect(await screen.findByText(/could not load this incident/i)).toBeTruthy();
  });
});
