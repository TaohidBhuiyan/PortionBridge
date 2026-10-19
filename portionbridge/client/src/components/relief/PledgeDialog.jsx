import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, MapPin, Truck } from 'lucide-react';
import { Modal } from '../common/Modal';
import { AddressLocationPicker } from '../dashboard/donor/AddressLocationPicker';
import reliefApi from '../../services/reliefApi';
import { savedAddressApi } from '../../services/savedAddressApi';
import {
  TIME_SLOTS, formatQuantity, newIdempotencyKey, validatePledgeQuantity, toNumber, typeLabel, apiErrorMessage,
} from '../../utils/relief';

const control = 'w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-dash-primary/30';
const label = 'mb-1 block text-xs font-semibold text-text-secondary';
const errorText = 'mt-1 text-xs text-danger';

const todayIso = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const PHONE = /^[+]?[\d\s\-()]+$/;

function savedLabel(a) {
  const name = a.customLabel || a.custom_label || a.label || 'Address';
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} — ${a.fullAddress || a.full_address || ''}`;
}

/**
 * Pledge flow for one requested item: quantity -> pickup details -> review -> confirm.
 *
 * - The remaining quantity shown comes from the server (item.quantities) and the server re-checks
 *   it inside a locked transaction, so a stale number can only produce a clear "only N is still
 *   needed" error, never an over-pledge.
 * - The Idempotency-Key is stable for one attempt (a double-click or retry cannot create a second
 *   pledge) and replaced as soon as the donor changes anything.
 * - Nothing here says "delivered": a pledge is a promise until a volunteer picks it up and an
 *   administrator verifies the delivery.
 */
export function PledgeDialog({ item, request, incident, onClose, onPledged, onStale }) {
  const q = item.quantities || {};
  const [step, setStep] = useState('quantity');
  const [quantity, setQuantity] = useState('');
  const [addressMode, setAddressMode] = useState('saved');
  const [saved, setSaved] = useState({ loading: true, list: [] });
  const [savedId, setSavedId] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [geo, setGeo] = useState({ latitude: null, longitude: null, district: '', area: '' });
  const [pickupDate, setPickupDate] = useState('');
  const [slot, setSlot] = useState('morning');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [result, setResult] = useState(null);
  const [idemKey, setIdemKey] = useState(newIdempotencyKey);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await savedAddressApi.getAll();
      if (cancelled) return;
      const list = res?.success ? (res.data?.addresses || []) : [];
      setSaved({ loading: false, list });
      if (list.length === 0) setAddressMode('new');
      else setSavedId(String(list.find((a) => a.isDefault || a.is_default)?.id ?? list[0].id));
    })();
    return () => { cancelled = true; };
  }, []);

  const touch = (setter) => (value) => { setter(value); setServerError(null); setIdemKey(newIdempotencyKey()); };
  const selected = useMemo(() => saved.list.find((a) => String(a.id) === savedId), [saved.list, savedId]);

  const validateQuantityStep = () => {
    const err = validatePledgeQuantity(quantity, { unit: item.unit, remainingToPledge: q.remainingToPledge });
    setErrors(err ? { quantity: err } : {});
    return !err;
  };

  const validatePickupStep = () => {
    const e = {};
    if (addressMode === 'saved') {
      if (!selected) e.address = 'Choose a saved address or enter a new one.';
      else if (toNumber(selected.latitude) === null || toNumber(selected.longitude) === null) e.address = 'This saved address has no map location. Edit it in Saved Addresses or use a different address.';
    } else {
      if (fullAddress.trim().length < 5) e.address = 'Enter the full pickup address (at least 5 characters).';
      else if (toNumber(geo.latitude) === null || toNumber(geo.longitude) === null) e.address = 'Pin the pickup location on the map so a volunteer can find it.';
    }
    if (!pickupDate) e.pickupDate = 'Choose a pickup date.';
    else if (pickupDate < todayIso()) e.pickupDate = 'Pickup date must be today or later.';
    const phoneValue = phone.trim() || (addressMode === 'saved' ? String(selected?.contactPhone || selected?.contact_phone || '') : '');
    if (!phoneValue) e.phone = 'Enter a contact phone number for the volunteer.';
    else if (!PHONE.test(phoneValue) || phoneValue.length > 20) e.phone = 'Enter a valid phone number (up to 20 characters).';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildBody = () => {
    const body = { quantity: quantity.trim(), pickup: { pickupDate, pickupTimeSlot: slot } };
    if (phone.trim()) body.pickup.contactPhone = phone.trim();
    if (notes.trim()) { body.pickup.additionalNotes = notes.trim(); }
    if (addressMode === 'saved') body.pickup.savedAddressId = Number(savedId);
    else {
      body.pickup.pickupAddress = {
        fullAddress: fullAddress.trim(), latitude: Number(geo.latitude), longitude: Number(geo.longitude),
        ...(geo.district ? { district: geo.district } : {}), ...(geo.area ? { area: geo.area } : {}),
      };
    }
    return body;
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await reliefApi.createPledge(item.id, buildBody(), idemKey);
      setResult(res.data);
      setStep('done');
      if (onPledged) onPledged(res.data);
    } catch (err) {
      const code = err?.response?.data?.code;
      // short, safe server messages (e.g. "Only 15 packets are still needed") pass through; anything else becomes a friendly message
      setServerError({ message: apiErrorMessage(err), code });
      if ((code === 'OVER_PLEDGE' || code === 'REQUEST_NOT_OPEN' || code === 'REQUEST_EXPIRED') && onStale) onStale();
    } finally {
      setSubmitting(false);
    }
  };

  const unit = item.unit;
  const pickupSummary = addressMode === 'saved' ? (selected ? savedLabel(selected) : '') : fullAddress.trim();

  return (
    <Modal title={step === 'done' ? 'Pledge recorded' : `Pledge ${item.name}`} onClose={onClose} maxWidth="max-w-xl">
      {step !== 'done' && (
        <p className="mb-3 text-xs text-text-secondary">
          For <strong className="text-text-primary">{incident?.title || 'this incident'}</strong> — deliver to {request?.locationName || 'the relief location'}.
          A pledge is a promise: it counts as delivered only after a volunteer delivers it and an administrator verifies it.
        </p>
      )}

      {step === 'quantity' && (
        <div className="space-y-4">
          <dl className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl bg-surface-hover px-2 py-2"><dt className="text-text-muted">Required</dt><dd className="font-semibold text-text-primary">{formatQuantity(q.requested, unit)}</dd></div>
            <div className="rounded-xl bg-surface-hover px-2 py-2"><dt className="text-text-muted">Delivered</dt><dd className="font-semibold text-text-primary">{formatQuantity(q.delivered, unit)}</dd></div>
            <div className="rounded-xl bg-surface-hover px-2 py-2"><dt className="text-text-muted">Open to pledge</dt><dd className="font-semibold text-text-primary">{formatQuantity(q.remainingToPledge, unit)}</dd></div>
          </dl>
          <div>
            <label htmlFor="pledge-quantity" className={label}>How much will you contribute? ({unit === 'liter' ? 'litres' : unit})</label>
            <input id="pledge-quantity" inputMode="decimal" value={quantity} onChange={(e) => touch(setQuantity)(e.target.value)} className={control} placeholder="e.g. 20" autoFocus />
            {errors.quantity && <p role="alert" className={errorText}>{errors.quantity}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-hover">Cancel</button>
            <button type="button" onClick={() => validateQuantityStep() && setStep('pickup')} className="rounded-xl bg-dash-primary px-4 py-2 text-sm font-semibold text-white hover:bg-dash-primary-hover">Continue</button>
          </div>
        </div>
      )}

      {step === 'pickup' && (
        <div className="space-y-4">
          <div className="flex gap-2 text-sm" role="group" aria-label="Pickup address source">
            {saved.list.length > 0 && <button type="button" aria-pressed={addressMode === 'saved'} onClick={() => touch(setAddressMode)('saved')} className={`rounded-lg px-3 py-1.5 font-semibold ${addressMode === 'saved' ? 'bg-dash-primary text-white' : 'bg-surface-hover text-text-secondary'}`}>Saved address</button>}
            <button type="button" aria-pressed={addressMode === 'new'} onClick={() => touch(setAddressMode)('new')} className={`rounded-lg px-3 py-1.5 font-semibold ${addressMode === 'new' ? 'bg-dash-primary text-white' : 'bg-surface-hover text-text-secondary'}`}>Different address</button>
          </div>

          {addressMode === 'saved' ? (
            <div>
              <label htmlFor="pledge-saved" className={label}>Pickup address</label>
              {saved.loading ? <p className="text-xs text-text-muted">Loading your saved addresses…</p> : (
                <select id="pledge-saved" value={savedId} onChange={(e) => touch(setSavedId)(e.target.value)} className={control}>
                  {saved.list.map((a) => <option key={a.id} value={a.id}>{savedLabel(a)}</option>)}
                </select>
              )}
              <p className="mt-1 text-xs text-text-muted">Manage addresses in <Link to="/donor/addresses" className="text-dash-primary hover:underline">Saved Addresses</Link>.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <label htmlFor="pledge-address" className={label}>Full pickup address</label>
                <textarea id="pledge-address" rows={2} value={fullAddress} onChange={(e) => touch(setFullAddress)(e.target.value)} maxLength={255} className={control} placeholder="House, road, area, district" />
              </div>
              <div>
                <span className={label}>Pin the location</span>
                <AddressLocationPicker
                  latitude={geo.latitude}
                  longitude={geo.longitude}
                  onChange={(loc) => { setGeo({ latitude: loc.latitude, longitude: loc.longitude, district: loc.district || '', area: loc.area || '' }); setIdemKey(newIdempotencyKey()); }}
                />
              </div>
            </div>
          )}
          {errors.address && <p role="alert" className={errorText}>{errors.address}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="pledge-date" className={label}>Pickup date</label>
              <input id="pledge-date" type="date" min={todayIso()} value={pickupDate} onChange={(e) => touch(setPickupDate)(e.target.value)} className={control} />
              {errors.pickupDate && <p role="alert" className={errorText}>{errors.pickupDate}</p>}
            </div>
            <div>
              <label htmlFor="pledge-slot" className={label}>Time slot</label>
              <select id="pledge-slot" value={slot} onChange={(e) => touch(setSlot)(e.target.value)} className={control}>
                {TIME_SLOTS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="pledge-phone" className={label}>Contact phone {addressMode === 'saved' && selected?.contactPhone ? '(optional — saved address number is used)' : ''}</label>
            <input id="pledge-phone" type="tel" value={phone} onChange={(e) => touch(setPhone)(e.target.value)} maxLength={20} className={control} placeholder="+8801XXXXXXXXX" />
            {errors.phone && <p role="alert" className={errorText}>{errors.phone}</p>}
          </div>
          <div>
            <label htmlFor="pledge-notes" className={label}>Notes for the volunteer (optional)</label>
            <textarea id="pledge-notes" rows={2} value={notes} onChange={(e) => touch(setNotes)(e.target.value)} maxLength={500} className={control} placeholder="Gate code, landmark, how it is packed…" />
          </div>
          <div className="flex justify-between gap-2">
            <button type="button" onClick={() => setStep('quantity')} className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-hover">Back</button>
            <button type="button" onClick={() => validatePickupStep() && setStep('review')} className="rounded-xl bg-dash-primary px-4 py-2 text-sm font-semibold text-white hover:bg-dash-primary-hover">Review</button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          <dl className="space-y-2 rounded-xl bg-surface-hover p-4 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-text-secondary">Incident</dt><dd className="text-right font-medium text-text-primary">{incident?.title}{incident?.disasterType ? ` (${typeLabel(incident.disasterType)})` : ''}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-text-secondary">Relief request</dt><dd className="text-right font-medium text-text-primary">{request?.title}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-text-secondary">Item</dt><dd className="text-right font-medium text-text-primary">{item.name}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-text-secondary">Your quantity</dt><dd className="text-right font-semibold text-text-primary">{formatQuantity(quantity, unit)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="flex items-center gap-1 text-text-secondary"><MapPin size={14} aria-hidden="true" />Pickup</dt><dd className="text-right font-medium text-text-primary">{pickupSummary}<br /><span className="text-xs font-normal text-text-secondary">{pickupDate} · {TIME_SLOTS.find((t) => t.value === slot)?.label}</span></dd></div>
            <div className="flex justify-between gap-3"><dt className="flex items-center gap-1 text-text-secondary"><Truck size={14} aria-hidden="true" />Delivered to</dt><dd className="text-right font-medium text-text-primary">{request?.locationName}</dd></div>
          </dl>
          <p className="text-xs text-text-secondary">A volunteer will contact you to collect these supplies. Your phone number and address are shared only with the volunteer who accepts the pickup.</p>
          {serverError && <div role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-text-primary">{serverError.message}</div>}
          <div className="flex justify-between gap-2">
            <button type="button" onClick={() => setStep('pickup')} disabled={submitting} className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-hover disabled:opacity-50">Back</button>
            <button type="button" onClick={submit} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-dash-primary px-4 py-2 text-sm font-semibold text-white hover:bg-dash-primary-hover disabled:opacity-60">
              {submitting && <Loader2 size={16} aria-hidden="true" className="animate-spin" />}{submitting ? 'Confirming…' : 'Confirm pledge'}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className="space-y-4 text-center">
          <CheckCircle2 size={40} aria-hidden="true" className="mx-auto text-success" />
          <p className="text-sm text-text-primary">Thank you! You pledged <strong>{formatQuantity(result.pledge.quantityPledged, unit)}</strong> of {item.name}.</p>
          <p className="text-xs text-text-secondary">Status: <strong>Pledged — waiting for a volunteer</strong>. Nothing has been collected or delivered yet. You can follow every step from My Relief Pledges.</p>
          <div className="flex justify-center gap-2">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-hover">Close</button>
            <Link to={`/donor/relief-pledges/${result.pledge.id}`} className="rounded-xl bg-dash-primary px-4 py-2 text-sm font-semibold text-white hover:bg-dash-primary-hover">Track this pledge</Link>
          </div>
        </div>
      )}
    </Modal>
  );
}
