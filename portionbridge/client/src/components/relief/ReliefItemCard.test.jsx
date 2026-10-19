import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ReliefItemCard } from './ReliefItemCard';
import { item, quantities } from '../../test/fixtures';

const stat = (label) => screen.getByText(label, { selector: 'dt' }).parentElement;

describe('ReliefItemCard — relief quantity presentation', () => {
  it('shows required, pledged, collected, delivered and remaining with units', () => {
    render(<ul><ReliefItemCard item={item()} /></ul>);
    expect(screen.getByRole('heading', { name: 'Drinking water' })).toBeTruthy();
    expect(within(stat('Required')).getByText('1,000 litres')).toBeTruthy();
    expect(within(stat('Pledged')).getByText('300 litres')).toBeTruthy();
    expect(within(stat('Collected')).getByText('200 litres')).toBeTruthy();
    expect(within(stat('Delivered')).getByText('150 litres')).toBeTruthy();
    expect(within(stat('Still needed')).getByText('850 litres')).toBeTruthy();
    expect(within(stat('Still needed')).getByText('550 litres open to pledge')).toBeTruthy();
    expect(screen.getByText('Urgent priority')).toBeTruthy();
    expect(screen.getByText('Partially delivered')).toBeTruthy();
  });

  it('progress bar reflects DELIVERED only; pledged is described as not yet delivered', () => {
    render(<ul><ReliefItemCard item={item({ quantities: quantities({ requested: 100, activePledged: 100, delivered: 0, collected: 0, remainingToPledge: 0, remainingUnfulfilled: 100, fulfillmentStage: 'fully_pledged' }) })} /></ul>);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
    expect(bar.getAttribute('aria-valuetext')).toMatch(/0% delivered, 100% pledged but not yet delivered/);
    expect(screen.getByText(/Fully pledged — awaiting delivery/)).toBeTruthy(); // not "Fulfilled"
    expect(screen.queryByText('Fulfilled')).toBeNull();
  });

  it('a fulfilled item shows 100% delivered', () => {
    render(<ul><ReliefItemCard item={item({ unit: 'packet', quantities: quantities({ requested: 500, delivered: 500, collected: 500, activePledged: 0, remainingToPledge: 0, remainingUnfulfilled: 0, fulfillmentStage: 'fulfilled' }) })} /></ul>);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
    expect(screen.getByText('Fulfilled')).toBeTruthy();
    expect(within(stat('Required')).getByText('500 packets')).toBeTruthy();
  });

  it('values the API did not provide render as "Unavailable" — nothing is invented', () => {
    render(<ul><ReliefItemCard item={item({ quantities: { requested: 200 } })} /></ul>);
    expect(within(stat('Required')).getByText('200 litres')).toBeTruthy();
    for (const label of ['Pledged', 'Collected', 'Delivered', 'Still needed']) {
      expect(within(stat(label)).getByText('Unavailable')).toBeTruthy();
    }
  });

  it('missing quantities object and missing requirement degrade gracefully', () => {
    render(<ul><ReliefItemCard item={{ id: 1, name: 'Blankets', unit: 'piece' }} /></ul>);
    expect(screen.getByText('Blankets')).toBeTruthy();
    expect(screen.getByText('Progress unavailable')).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('does not repeat the category when it is identical to the item name', () => {
    render(<ul><ReliefItemCard item={item({ name: 'Drinking water', category: 'drinking_water' })} /></ul>);
    expect(screen.getAllByText('Drinking water')).toHaveLength(1);
    render(<ul><ReliefItemCard item={item({ id: 2, name: 'Chira and gur', category: 'dry_food' })} /></ul>);
    expect(screen.getByText('Dry food')).toBeTruthy();
  });
});
