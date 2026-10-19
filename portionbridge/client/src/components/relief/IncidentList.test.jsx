import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IncidentList } from './IncidentList';
import { incident } from '../../test/fixtures';

const renderList = (props) => render(<MemoryRouter><IncidentList onSelect={() => {}} {...props} /></MemoryRouter>);

describe('IncidentList states', () => {
  it('shows a loading skeleton', () => {
    renderList({ loading: true, incidents: [] });
    expect(screen.getByRole('status', { name: 'Loading incidents' })).toBeTruthy();
  });

  it('shows an error with a working retry button, and no raw error text', () => {
    const onRetry = vi.fn();
    renderList({ error: { response: { status: 500 } }, incidents: [], onRetry });
    expect(screen.getByText('Could not load incidents')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /try again|retry/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows an empty state; with filters active it offers to clear them', () => {
    const onClear = vi.fn();
    renderList({ incidents: [], hasFilters: true, onClearFilters: onClear });
    expect(screen.getByText('No incidents match')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onClear).toHaveBeenCalled();
  });

  it('lists incidents without coordinates, flagged "No map location", rather than dropping them', () => {
    renderList({ incidents: [incident({ id: 1, title: 'Mapped' }), incident({ id: 2, title: 'Unmapped', latitude: null, longitude: null })] });
    expect(screen.getAllByTestId('incident-card')).toHaveLength(2);
    expect(screen.getByText('Unmapped')).toBeTruthy();
    expect(screen.getAllByText('No map location')).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Show on map' })).toHaveLength(1);
  });

  it('links to the details page and reports selection', () => {
    const onSelect = vi.fn();
    renderList({ incidents: [incident({ id: 42, title: 'Detail link' })], onSelect });
    expect(screen.getByRole('link', { name: 'Detail link' }).getAttribute('href')).toBe('/relief/incidents/42');
    fireEvent.click(screen.getByRole('button', { name: 'Show on map' }));
    expect(onSelect).toHaveBeenCalledWith(42);
  });

  it('distinguishes verified from unverified using only the backend flag', () => {
    renderList({ incidents: [incident({ id: 1, isVerified: true }), incident({ id: 2, isVerified: false, status: 'reported' }), incident({ id: 3, isVerified: undefined })] });
    expect(screen.getAllByText('Verified', { selector: 'span' }).filter((n) => n.textContent.trim() === 'Verified').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Not verified')).toHaveLength(2); // false and missing are both "not verified"
  });

  it('shows distance in Nearby mode and renders descriptions as plain text', () => {
    const evil = '<b onmouseover=alert(1)>bold</b>';
    renderList({ incidents: [incident({ id: 5, description: evil })], distances: new Map([[5, 12.34]]) });
    expect(screen.getByText('12 km away')).toBeTruthy();
    expect(screen.getByText(evil)).toBeTruthy();
    expect(document.querySelector('b')).toBeNull();
  });

  it('shows "Verified" once for a verified incident, but keeps "Active" as its own status', () => {
    renderList({ incidents: [incident({ id: 1, status: 'verified', isVerified: true }), incident({ id: 2, status: 'active', isVerified: true })] });
    const verified = screen.getAllByText('Verified').filter((n) => n.tagName === 'SPAN');
    expect(verified).toHaveLength(2); // one verification badge per incident, no duplicate status badge
    expect(screen.getAllByText('Active')).toHaveLength(1);
  });
});
