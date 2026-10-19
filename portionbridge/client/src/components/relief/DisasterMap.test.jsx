import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { DisasterMap } from './DisasterMap';
import { incident } from '../../test/fixtures';

const markers = (container) => container.querySelectorAll('.leaflet-marker-icon');

describe('DisasterMap (real Leaflet in jsdom)', () => {
  it('renders a map region and one marker per incident with valid coordinates', () => {
    const { container, getByTestId } = render(
      <div style={{ width: 600, height: 400 }}>
        <DisasterMap incidents={[incident({ id: 1 }), incident({ id: 2, latitude: 22.3, longitude: 91.8 })]} />
      </div>
    );
    expect(getByTestId('disaster-map').getAttribute('role')).toBe('region');
    expect(markers(container)).toHaveLength(2);
  });

  it('skips incidents with missing or invalid coordinates instead of crashing', () => {
    const { container } = render(
      <DisasterMap incidents={[
        incident({ id: 1 }),
        incident({ id: 2, latitude: null, longitude: null }),
        incident({ id: 3, latitude: 'abc', longitude: 91 }),
        incident({ id: 4, latitude: 123, longitude: 91 }),
        incident({ id: 5, latitude: 0, longitude: 0 }),
      ]}
      />
    );
    expect(markers(container)).toHaveLength(1);
  });

  it('shows an empty map (no markers) when there are no incidents', () => {
    const { container } = render(<DisasterMap incidents={[]} />);
    expect(markers(container)).toHaveLength(0);
  });

  it('shows ONE marker with a count when incidents share a position, and lists every one in its popup', () => {
    const onOpen = vi.fn();
    const same = [
      incident({ id: 1, title: 'Low one', severity: 'low', latitude: 24.91, longitude: 91.83 }),
      incident({ id: 2, title: 'Critical one', severity: 'critical', latitude: 24.91, longitude: 91.83 }),
      incident({ id: 3, title: 'High one', severity: 'high', latitude: 24.91, longitude: 91.83 }),
    ];
    const { container } = render(<DisasterMap incidents={same} onOpen={onOpen} />);
    expect(markers(container)).toHaveLength(1);
    expect(container.querySelector('.pb-marker__count').textContent).toBe('3');
    // coloured by the most severe incident in the group
    expect(container.querySelector('.pb-marker').style.background).toMatch(/rgb\(220, 38, 38\)|#dc2626/i);
    fireEvent.click(markers(container)[0]);
    const popup = container.querySelector('.leaflet-popup-content');
    expect(popup.textContent).toContain('3 incidents at this location');
    const buttons = popup.querySelectorAll('button');
    expect(buttons).toHaveLength(3);
    expect(popup.textContent.indexOf('Critical one')).toBeLessThan(popup.textContent.indexOf('Low one')); // most severe first
    fireEvent.click(buttons[1]);
    expect(onOpen).toHaveBeenCalledWith(3); // second most severe
  });

  it('a grouped marker is highlighted when any incident in it is selected', () => {
    const same = [1, 2].map((id) => incident({ id, latitude: 24.91, longitude: 91.83 }));
    const { container } = render(<DisasterMap incidents={same} selectedId={2} />);
    expect(container.querySelector('.leaflet-marker-icon.is-selected')).toBeTruthy();
  });

  it('styles markers by status: verified solid, unverified dashed, resolved faded', () => {
    const { container } = render(
      <DisasterMap incidents={[
        incident({ id: 1, latitude: 24, longitude: 90 }),
        incident({ id: 2, latitude: 23, longitude: 91, isVerified: false, status: 'reported' }),
        incident({ id: 3, latitude: 22, longitude: 92, status: 'resolved' }),
      ]}
      />
    );
    expect(container.querySelectorAll('.pb-marker--verified')).toHaveLength(1);
    expect(container.querySelectorAll('.pb-marker--unverified')).toHaveLength(1);
    expect(container.querySelectorAll('.pb-marker--resolved')).toHaveLength(1);
  });

  it('colours markers by severity', () => {
    const { container } = render(<DisasterMap incidents={[incident({ id: 1, severity: 'critical' })]} />);
    expect(container.querySelector('.pb-marker').style.background).toMatch(/rgb\(220, 38, 38\)|#dc2626/i);
  });

  it('selecting a marker reports the id; the popup shows the preview and opens details', () => {
    const onSelect = vi.fn();
    const onOpen = vi.fn();
    const { container } = render(<DisasterMap incidents={[incident({ id: 7, title: 'Selected flood' })]} onSelect={onSelect} onOpen={onOpen} />);
    fireEvent.click(markers(container)[0]);
    expect(onSelect).toHaveBeenCalledWith(7);
    const popup = container.querySelector('.leaflet-popup-content');
    expect(popup).toBeTruthy();
    expect(popup.textContent).toContain('Selected flood');
    expect(popup.textContent).toContain('Verified by administrators');
    fireEvent.click(popup.querySelector('button'));
    expect(onOpen).toHaveBeenCalledWith(7);
  });

  it('popups say "Not verified" unless the backend says verified', () => {
    const { container } = render(<DisasterMap incidents={[incident({ id: 8, isVerified: false, status: 'reported' })]} />);
    fireEvent.click(markers(container)[0]);
    const text = container.querySelector('.leaflet-popup-content').textContent;
    expect(text).toContain('Not verified');
    expect(text).not.toContain('Verified by administrators');
  });

  it('renders user-written text as text, never as markup (XSS-safe popup)', () => {
    const evil = '<img src=x onerror="window.__pwned=1"><script>window.__pwned=1</script>';
    const { container } = render(<DisasterMap incidents={[incident({ id: 9, title: evil, district: evil, affectedArea: evil })]} />);
    fireEvent.click(markers(container)[0]);
    const popup = container.querySelector('.leaflet-popup-content');
    expect(popup.querySelector('img, script')).toBeNull();
    expect(popup.textContent).toContain('<img src=x');
    expect(window.__pwned).toBeUndefined();
  });

  it('marks the selected incident and draws the user location + radius in Nearby mode', () => {
    const { container, rerender } = render(<DisasterMap incidents={[incident({ id: 1 })]} selectedId={1} />);
    expect(container.querySelector('.leaflet-marker-icon.is-selected')).toBeTruthy();
    expect(container.querySelectorAll('path.leaflet-interactive').length).toBe(0);
    rerender(<DisasterMap incidents={[incident({ id: 1 })]} selectedId={null} userLocation={{ lat: 24.8, lng: 91.8 }} radiusKm={50} />);
    expect(container.querySelector('.leaflet-marker-icon.is-selected')).toBeNull();
    expect(container.querySelectorAll('path').length).toBeGreaterThanOrEqual(1);
  });

  it('cleans up the map on unmount', () => {
    const { container, unmount } = render(<DisasterMap incidents={[incident()]} />);
    expect(container.querySelector('.leaflet-container')).toBeTruthy();
    expect(() => unmount()).not.toThrow();
  });
});
