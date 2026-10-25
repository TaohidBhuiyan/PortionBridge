import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('../../services/alertApi', () => ({ default: { listActive: vi.fn() } }));
import alertApi from '../../services/alertApi';
import { ActiveAlertBanner } from './ActiveAlertBanner';

beforeEach(() => vi.clearAllMocks());

describe('ActiveAlertBanner', () => {
  it('shows severity, scope and last update for a live alert', async () => {
    alertApi.listActive.mockResolvedValue({ data: { alerts: [{ id: 1, severity: 'high', scope: 'regional', adminNote: 'Roads closed.', updatedAt: '2026-10-19T10:00:00Z' }] } });
    render(<ActiveAlertBanner incidentId={5} />);
    const banner = await screen.findByTestId('active-alert-banner');
    expect(banner.textContent).toMatch(/High priority · Regional alert/);
    expect(banner.textContent).toMatch(/Roads closed/);
    expect(alertApi.listActive).toHaveBeenCalledWith({ incidentId: 5 });
  });
  it('renders nothing when there is no alert or the lookup fails', async () => {
    alertApi.listActive.mockResolvedValueOnce({ data: { alerts: [] } });
    const { container, rerender } = render(<ActiveAlertBanner incidentId={5} />);
    await waitFor(() => expect(alertApi.listActive).toHaveBeenCalled());
    expect(container.textContent).toBe('');
    alertApi.listActive.mockRejectedValueOnce(new Error('network'));
    rerender(<ActiveAlertBanner incidentId={6} />);
    await waitFor(() => expect(alertApi.listActive).toHaveBeenCalledTimes(2));
    expect(container.textContent).toBe('');
  });
});
