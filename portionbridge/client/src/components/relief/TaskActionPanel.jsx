import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { SchedulePickupModal } from '../donation/SchedulePickupModal';
import reliefApi from '../../services/reliefApi';
import { apiErrorMessage, formatQuantity, toNumber } from '../../utils/relief';

const control = 'w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-dash-primary/30';
const primary = 'rounded-xl bg-dash-primary px-4 py-2 text-sm font-semibold text-white hover:bg-dash-primary-hover disabled:opacity-60';
const secondary = 'rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary hover:bg-surface-hover disabled:opacity-60';
const danger = 'rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-danger hover:bg-danger-soft disabled:opacity-60';

// Which actions exist for each task status. The server enforces the same order; this only avoids offering impossible actions.
const ACTIONS = {
  accepted: ['schedule', 'release', 'problem'],
  scheduled: ['on_the_way', 'release', 'problem'],
  on_the_way: ['pickup', 'release', 'problem'],
  picked_up: ['delivery', 'failure', 'problem'],
  delivery_reported: ['problem'],
};

const DONE_TEXT = {
  completed: 'This task is complete: the delivery was verified.',
  completed_partial: 'This task is closed. Only part of the pledge was delivered and verified.',
  failed: 'This task was closed as failed. Nothing was counted as delivered.',
  cancelled: 'This task was cancelled.',
};

/**
 * The volunteer's next step(s) for one task. Pickup and delivery are REPORTS: delivery stays
 * "awaiting verification" until an administrator verifies it, and nothing here can change the
 * verified delivered totals.
 */
export function TaskActionPanel({ task, onChanged }) {
  const { pledgeId, taskStatus, item, quantity } = task;
  const unit = item.unit;
  const [mode, setMode] = useState(null);
  const [scheduling, setScheduling] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({ quantity: '', notes: '', final: true });

  const collected = toNumber(quantity.collected) ?? 0;
  const delivered = toNumber(quantity.delivered) ?? 0;
  const pledged = toNumber(quantity.pledged) ?? 0;
  const deliverable = Math.max(0, collected - delivered);

  const open = (m) => {
    setMode(m); setError(null); setMessage(null);
    setForm({ quantity: m === 'pickup' ? String(pledged) : m === 'delivery' ? String(deliverable) : '', notes: '', final: true });
  };

  const run = async (fn, okMessage) => {
    setBusy(true); setError(null);
    try {
      await fn();
      setMessage(okMessage); setMode(null);
      if (onChanged) await onChanged();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (DONE_TEXT[taskStatus]) return <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-secondary">{DONE_TEXT[taskStatus]}</p>;
  const actions = ACTIONS[taskStatus] || [];
  const quantityNum = toNumber(form.quantity);
  // A difference between what was pledged/collected and what is reported needs an explanation (the server requires it too).
  let shortfall = false;
  if (quantityNum !== null) {
    if (mode === 'pickup') shortfall = quantityNum < pledged;
    else if (mode === 'delivery') shortfall = form.final && delivered + quantityNum < collected;
  }
  const notesRequired = mode === 'failure' || mode === 'problem' || shortfall;

  const submit = async () => {
    const notes = form.notes.trim();
    // validate the quantity first: a zero/invalid quantity is the more fundamental problem
    if ((mode === 'pickup' || mode === 'delivery') && !(quantityNum > 0)) { setError('Enter a quantity greater than zero.'); return; }
    if (notesRequired && notes.length < 5) { setError('Please add a short explanation (at least 5 characters).'); return; }
    if (mode === 'pickup') await run(() => reliefApi.reportPickup(pledgeId, { quantity: form.quantity.trim(), ...(notes ? { notes } : {}) }), 'Pickup recorded.');
    else if (mode === 'delivery') await run(() => reliefApi.reportDelivery(pledgeId, { quantity: form.quantity.trim(), final: form.final, ...(notes ? { notes } : {}) }), 'Delivery reported. It will count as delivered once an administrator verifies it.');
    else if (mode === 'failure') await run(() => reliefApi.reportFailure(pledgeId, notes), 'Failed delivery reported to administrators.');
    else if (mode === 'problem') await run(() => reliefApi.reportProblem(pledgeId, notes), 'Problem reported to administrators.');
    else if (mode === 'release') await run(() => reliefApi.releaseTask(pledgeId, notes), 'Task released.');
  };

  return (
    <section aria-label="Task actions" className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold text-text-primary">Next step</h2>
      {taskStatus === 'delivery_reported' && <p className="text-sm text-text-secondary">You reported this delivery. It is awaiting administrator verification — nothing more to do unless there is a problem.</p>}
      {message && <p role="status" className="rounded-xl bg-success-soft px-3 py-2 text-sm text-text-primary">{message}</p>}
      {error && <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-text-primary">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {actions.includes('schedule') && <button type="button" className={primary} disabled={busy} onClick={() => setScheduling(true)}>Schedule pickup</button>}
        {actions.includes('on_the_way') && <button type="button" className={primary} disabled={busy} onClick={() => run(() => reliefApi.markTaskOnTheWay(pledgeId), 'Marked as on the way.')}>I’m on the way</button>}
        {actions.includes('pickup') && <button type="button" className={primary} disabled={busy} onClick={() => open('pickup')}>Confirm pickup</button>}
        {actions.includes('delivery') && <button type="button" className={primary} disabled={busy} onClick={() => open('delivery')}>Report delivery</button>}
        {actions.includes('failure') && <button type="button" className={danger} disabled={busy} onClick={() => open('failure')}>Delivery failed</button>}
        {actions.includes('release') && <button type="button" className={secondary} disabled={busy} onClick={() => open('release')}>Release task</button>}
        {actions.includes('problem') && <button type="button" className={secondary} disabled={busy} onClick={() => open('problem')}>Report a problem</button>}
      </div>

      {mode && (
        <form className="space-y-3 rounded-xl bg-surface-hover p-3" onSubmit={(e) => { e.preventDefault(); submit(); }} aria-label={`${mode} form`}>
          {(mode === 'pickup' || mode === 'delivery') && (
            <div>
              <label htmlFor="task-quantity" className="mb-1 block text-xs font-semibold text-text-secondary">
                {mode === 'pickup' ? `Quantity you collected (pledged: ${formatQuantity(pledged, unit)})` : `Quantity you delivered (collected: ${formatQuantity(collected, unit)}, already verified: ${formatQuantity(delivered, unit)})`}
              </label>
              <input id="task-quantity" inputMode="decimal" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={control} />
            </div>
          )}
          {mode === 'delivery' && (
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input type="checkbox" checked={form.final} onChange={(e) => setForm({ ...form, final: e.target.checked })} className="h-4 w-4 rounded border-border accent-[var(--pb-primary)]" />
              This is the final delivery for this task
            </label>
          )}
          <div>
            <label htmlFor="task-notes" className="mb-1 block text-xs font-semibold text-text-secondary">
              {mode === 'failure' ? 'What went wrong?' : mode === 'problem' ? 'Describe the problem' : mode === 'release' ? 'Reason (optional)' : shortfall ? 'Explain the difference (required)' : 'Notes (optional)'}
            </label>
            <textarea id="task-notes" rows={2} maxLength={1000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={control} />
          </div>
          {mode === 'release' && <p className="text-xs text-text-secondary">The task goes back to the queue for another volunteer. The donor is notified.</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className={secondary} onClick={() => setMode(null)} disabled={busy}>Cancel</button>
            <button type="submit" className={primary} disabled={busy}>{busy && <Loader2 size={14} aria-hidden="true" className="mr-1 inline animate-spin" />}Submit</button>
          </div>
        </form>
      )}

      <SchedulePickupModal
        isOpen={scheduling}
        onClose={() => setScheduling(false)}
        isLoading={busy}
        donationTitle={item.name}
        onConfirm={async (iso) => { setScheduling(false); await run(() => reliefApi.scheduleTask(pledgeId, iso), 'Pickup scheduled.'); }}
      />
    </section>
  );
}
