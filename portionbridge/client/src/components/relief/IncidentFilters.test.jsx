import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { IncidentFilters } from './IncidentFilters';
import { DEFAULT_FILTERS } from '../../utils/relief';

const setup = (props = {}) => {
  const onChange = vi.fn();
  const onClear = vi.fn();
  render(<IncidentFilters filters={DEFAULT_FILTERS} onChange={onChange} onClear={onClear} {...props} />);
  return { onChange, onClear };
};

describe('IncidentFilters', () => {
  it('on small screens the filter panel starts collapsed and the toggle expands it', () => {
    setup();
    const toggle = screen.getByRole('button', { name: /Search & filters/ });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    const panel = document.getElementById('relief-filter-panel');
    expect(panel.className).toMatch(/\bhidden\b/);
    expect(panel.className).toMatch(/lg:block/); // always visible on large screens
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(panel.className).not.toMatch(/(^|\s)hidden(\s|$)/);
  });

  it('shows how many filters are active in the collapsed header and offers to clear them', () => {
    const { onClear } = setup({ filters: { ...DEFAULT_FILTERS, district: 'Sylhet', severity: 'high' } });
    expect(screen.getByRole('button', { name: /2 active/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Clear 2 filters/ }));
    expect(onClear).toHaveBeenCalled();
  });

  it('offers all 64 districts as reference data plus "All districts"', () => {
    setup();
    expect(within(screen.getByLabelText('District')).getAllByRole('option')).toHaveLength(65);
  });

  it('"My reports" switches the scope to all statuses (so own unverified reports show) and back', () => {
    const { onChange } = setup();
    fireEvent.click(screen.getByLabelText('My reports'));
    expect(onChange).toHaveBeenCalledWith({ mine: true, scope: 'all' });
  });

  it('administrators do not see "My reports" and get the review scopes', () => {
    setup({ isAdmin: true });
    expect(screen.queryByLabelText('My reports')).toBeNull();
    expect(within(screen.getByLabelText('Status')).getAllByRole('option').map((o) => o.textContent)).toContain('Rejected');
  });
});
