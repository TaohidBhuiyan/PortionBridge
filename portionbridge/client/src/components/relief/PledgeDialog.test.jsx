import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/reliefApi', () => ({ default: { createPledge: vi.fn() } }));
vi.mock('../../services/savedAddressApi', () => ({ savedAddressApi: { getAll: vi.fn() } }));
vi.mock('../dashboard/donor/AddressLocationPicker', () => ({
  AddressLocationPicker: ({ onChange }) => (
    <button type="button" onClick={() => onChange({ latitude: 23.81, longitude: 90.41, district: 'Dhaka', area: 'Gulshan' })}>stub-pin-location</button>
  ),
}));

import reliefApi from '../../services/reliefApi';
import { savedAddressApi } from '../../services/savedAddressApi';
import { PledgeDialog } from './PledgeDialog';
import { item, quantities } from '../../test/fixtures';

const FUTURE = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
const savedList = [
  { id: 8, customLabel: 'home', fullAddress: 'House 5, Gulshan', latitude: 23.8, longitude: 90.4, contactPhone: '+8801700000000', isDefault: true },
  { id: 9, customLabel: 'work', fullAddress: 'Office, Banani', latitude: null, longitude: null, contactPhone: null },
];
const dryFood = item({ id: 11, name: 'Dry food', unit: 'packet', quantities: quantities({ requested: 100, remainingToPledge: 60, delivered: 10 }) });
const request = { id: 5, title: 'Shelter supplies', locationName: 'Govt School Shelter' };
const incident = { id: 1, title: 'Sylhet flood', disasterType: 'flood' };

const setup = (props = {}) => {
  const onClose = vi.fn(); const onPledged = vi.fn(); const onStale = vi.fn();
  render(<MemoryRouter><PledgeDialog item={dryFood} request={request} incident={incident} onClose={onClose} onPledged={onPledged} onStale={onStale} {...props} /></MemoryRouter>);
  return { onClose, onPledged, onStale };
};
const next = (name) => fireEvent.click(screen.getByRole('button', { name }));
const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const toPickup = async (q = '20') => { type(/How much will you contribute/, q); next('Continue'); await screen.findByLabelText('Pickup date'); };
const toReview = async () => { await toPickup(); type('Pickup date', FUTURE); next('Review'); await screen.findByRole('button', { name: 'Confirm pledge' }); };

beforeEach(() => {
  vi.clearAllMocks();
  savedAddressApi.getAll.mockResolvedValue({ success: true, data: { addresses: savedList } });
  reliefApi.createPledge.mockResolvedValue({ data: { pledge: { id: 41, quantityPledged: 20 }, item: {} } });
});

describe('PledgeDialog — quantity step', () => {
  it('shows server-provided required / delivered / open-to-pledge amounts', () => {
    setup();
    expect(screen.getByText('Open to pledge').nextSibling.textContent).toBe('60 packets');
    expect(screen.getByText('Required').nextSibling.textContent).toBe('100 packets');
    expect(screen.getByText('Delivered').nextSibling.textContent).toBe('10 packets');
  });

  it.each([['', /Enter a quantity/], ['0', /greater than zero/], ['-5', /positive number/], ['abc', /positive number/], ['1e2', /positive number/], ['2.5', /whole numbers/], ['61', /Only 60 is still needed/]])(
    'rejects "%s" without leaving the step', (value, message) => {
      setup();
      type(/How much will you contribute/, value);
      next('Continue');
      expect(screen.getByRole('alert').textContent).toMatch(message);
      expect(screen.queryByLabelText('Pickup date')).toBeNull();
    }
  );

  it('accepts a valid quantity and moves on', async () => {
    setup();
    await toPickup('60');
    expect(screen.getByLabelText('Pickup date')).toBeTruthy();
  });
});

describe('PledgeDialog — pickup step', () => {
  it('defaults to the donor\'s default saved address and requires a date, phone and a usable location', async () => {
    setup();
    await toPickup();
    expect(screen.getByLabelText('Pickup address').value).toBe('8');
    next('Review');
    expect(screen.getByText('Choose a pickup date.')).toBeTruthy();
    type('Pickup date', '2020-01-01');
    next('Review');
    expect(screen.getByText(/today or later/)).toBeTruthy();
    // a saved address without coordinates cannot be used (volunteers are matched by distance)
    type('Pickup address', '9');
    type('Pickup date', FUTURE);
    next('Review');
    expect(screen.getAllByRole('alert').map((a) => a.textContent).join(' ')).toMatch(/no map location/);
  });

  it('a different address needs text, a pinned map location and a valid phone number', async () => {
    savedAddressApi.getAll.mockResolvedValue({ success: true, data: { addresses: [] } });
    setup();
    await toPickup();
    expect(screen.queryByLabelText('Pickup address')).toBeNull(); // no saved addresses -> manual entry
    type('Pickup date', FUTURE);
    next('Review');
    expect(screen.getByText(/at least 5 characters/)).toBeTruthy();
    type('Full pickup address', 'House 12, Road 4, Gulshan, Dhaka');
    next('Review');
    expect(screen.getByText(/Pin the pickup location/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'stub-pin-location' }));
    next('Review');
    expect(screen.getByText(/Enter a contact phone number/)).toBeTruthy();
    type(/Contact phone/, 'call me');
    next('Review');
    expect(screen.getByText(/valid phone number/)).toBeTruthy();
    type(/Contact phone/, '+8801712345678');
    next('Review');
    expect(await screen.findByRole('button', { name: 'Confirm pledge' })).toBeTruthy();
  });
});

describe('PledgeDialog — review and confirm', () => {
  it('summarises incident, request, item, quantity, pickup and drop-off, and says a pledge is not a delivery', async () => {
    setup();
    await toReview();
    const text = document.body.textContent;
    for (const expected of ['Sylhet flood', 'Shelter supplies', 'Dry food', '20 packets', 'House 5, Gulshan', 'Govt School Shelter']) expect(text).toContain(expected);
    expect(text).toMatch(/counts as delivered only after a volunteer delivers it and an administrator verifies it/);
    expect(text).toMatch(/shared only with the volunteer who accepts/);
  });

  it('sends the server only what the donor entered (never totals) with an Idempotency-Key, then shows a non-delivered success state', async () => {
    const { onPledged } = setup();
    await toReview();
    next('Confirm pledge');
    await waitFor(() => expect(reliefApi.createPledge).toHaveBeenCalledTimes(1));
    const [itemId, body, key] = reliefApi.createPledge.mock.calls[0];
    expect(itemId).toBe(11);
    expect(body).toEqual({ quantity: '20', pickup: { pickupDate: FUTURE, pickupTimeSlot: 'morning', savedAddressId: 8 } });
    expect(JSON.stringify(body)).not.toMatch(/remaining|progress|delivered|status/i);
    expect(key).toMatch(/^pledge-[A-Za-z0-9]{8,}$/);
    expect(key.length).toBeLessThanOrEqual(64);
    expect(await screen.findByText('Pledge recorded')).toBeTruthy();
    expect(document.body.textContent).toMatch(/Pledged — waiting for a volunteer/);
    expect(document.body.textContent).toMatch(/Nothing has been collected or delivered yet/);
    expect(screen.getByRole('link', { name: 'Track this pledge' }).getAttribute('href')).toBe('/donor/relief-pledges/41');
    expect(onPledged).toHaveBeenCalled();
  });

  it('a double click submits once; a retry after a failure reuses the key; editing anything creates a new key', async () => {
    let resolveFirst;
    reliefApi.createPledge.mockReturnValueOnce(new Promise((r) => { resolveFirst = r; }));
    setup();
    await toReview();
    const confirm = screen.getByRole('button', { name: 'Confirm pledge' });
    fireEvent.click(confirm); fireEvent.click(confirm);
    expect(reliefApi.createPledge).toHaveBeenCalledTimes(1);
    resolveFirst(Promise.reject({ message: 'Network Error' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    reliefApi.createPledge.mockRejectedValueOnce({ message: 'Network Error' });
    next('Confirm pledge');
    await waitFor(() => expect(reliefApi.createPledge).toHaveBeenCalledTimes(2));
    expect(reliefApi.createPledge.mock.calls[1][2]).toBe(reliefApi.createPledge.mock.calls[0][2]); // same attempt -> same key
    // change the pickup date -> new attempt -> new key
    next('Back'); type('Pickup date', new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)); next('Review');
    next('Confirm pledge');
    await waitFor(() => expect(reliefApi.createPledge).toHaveBeenCalledTimes(3));
    expect(reliefApi.createPledge.mock.calls[2][2]).not.toBe(reliefApi.createPledge.mock.calls[0][2]);
  });

  it('shows the server\'s over-pledge message, keeps the donor on the review step and asks the page to refresh the amounts', async () => {
    reliefApi.createPledge.mockRejectedValue({ response: { status: 409, data: { code: 'OVER_PLEDGE', message: 'Only 15 packet of "Dry food" is still needed.' } } });
    const { onStale, onPledged } = setup();
    await toReview();
    next('Confirm pledge');
    expect((await screen.findByRole('alert')).textContent).toBe('Only 15 packet of "Dry food" is still needed.');
    expect(onStale).toHaveBeenCalled();
    expect(onPledged).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Confirm pledge' })).toBeTruthy();
  });

  it('shows friendly errors for a closed request or an unexpected failure (no raw internals)', async () => {
    reliefApi.createPledge.mockRejectedValue({ response: { status: 500, data: { message: 'x'.repeat(500) } } });
    setup();
    await toReview();
    next('Confirm pledge');
    expect((await screen.findByRole('alert')).textContent).not.toMatch(/xxxxx/);
  });

  it('Cancel closes without calling the API', () => {
    const { onClose } = setup();
    next('Cancel');
    expect(onClose).toHaveBeenCalled();
    expect(reliefApi.createPledge).not.toHaveBeenCalled();
    expect(within(document.body).queryByText('Pledge recorded')).toBeNull();
  });
});
