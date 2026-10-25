import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../../services/alertApi', () => ({ default: { getPreferences: vi.fn(), savePreferences: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import alertApi from '../../../services/alertApi';
import toast from 'react-hot-toast';
import { DisasterAlertSettings } from './DisasterAlertSettings';

const prefs = (o = {}) => ({
  data: {
    preferences: { nearbyEnabled: true, nationwideEnabled: true, inAppEnabled: true, minSeverity: 'low', radiusKm: null, centerLatitude: null, centerLongitude: null, districts: [], categories: [], isDefault: true, ...o },
    policy: { criticalNationwideMandatory: true, mandatoryDescription: 'Critical-emergency alerts that an administrator classifies as nationwide are always delivered.', channelsNote: 'Only in-app notifications are available.' },
  },
});

beforeEach(() => { vi.clearAllMocks(); alertApi.getPreferences.mockResolvedValue(prefs()); alertApi.savePreferences.mockResolvedValue(prefs({ nationwideEnabled: false, districts: ['Sylhet'] })); });

describe('DisasterAlertSettings', () => {
  it('shows a loading state, then safe defaults and the mandatory critical-alert policy', async () => {
    render(<DisasterAlertSettings />);
    expect(screen.getByRole('status', { name: /loading alert preferences/i })).toBeTruthy();
    expect(await screen.findByRole('switch', { name: /nationwide major-emergency/i })).toHaveProperty('checked', true);
    expect(screen.getByRole('switch', { name: /nearby alerts/i })).toHaveProperty('checked', true);
    expect(screen.getAllByText(/always delivered/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/only in-app notifications/i)).toBeTruthy();
  });

  it('saves exactly what the user chose, with no location unless they pressed the button', async () => {
    render(<DisasterAlertSettings />);
    fireEvent.click(await screen.findByRole('switch', { name: /nationwide major-emergency/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Sylhet' }));
    fireEvent.click(screen.getByRole('button', { name: /^flood$/i }));
    fireEvent.click(screen.getByRole('button', { name: /save alert preferences/i }));
    await waitFor(() => expect(alertApi.savePreferences).toHaveBeenCalledTimes(1));
    expect(alertApi.savePreferences).toHaveBeenCalledWith(expect.objectContaining({
      nationwideEnabled: false, nearbyEnabled: true, districts: ['Sylhet'], categories: ['flood'],
      centerLatitude: null, centerLongitude: null, radiusKm: null,
    }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('does not request browser location until the user asks', async () => {
    const getCurrentPosition = vi.fn();
    Object.defineProperty(globalThis.navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true });
    render(<DisasterAlertSettings />);
    await screen.findByRole('switch', { name: /nearby alerts/i });
    expect(getCurrentPosition).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /use my approximate location/i }));
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('shows an error state with retry when preferences cannot be loaded, and a toast when saving fails', async () => {
    alertApi.getPreferences.mockRejectedValueOnce({ response: { status: 500, data: { message: 'boom' } } });
    render(<DisasterAlertSettings />);
    expect(await screen.findByText(/could not load alert preferences/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /try again|retry/i }));
    await screen.findByRole('switch', { name: /nearby alerts/i });
    alertApi.savePreferences.mockRejectedValueOnce({ response: { status: 422, data: { message: 'Unknown district: X.' } } });
    fireEvent.click(screen.getByRole('button', { name: /save alert preferences/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Unknown district: X.'));
  });
});
