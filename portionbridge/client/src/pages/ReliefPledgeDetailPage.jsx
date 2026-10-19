import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, MapPin, Truck, User } from 'lucide-react';
import { DashboardLayout, ErrorState } from '../components/dashboard';
import { Modal } from '../components/common/Modal';
import { PledgeStatusBadge, TaskStatusBadge } from '../components/relief/TaskBadges';
import { PledgeTimeline } from '../components/relief/PledgeTimeline';
import { useApiResource } from '../hooks/useApiResource';
import reliefApi from '../services/reliefApi';
import { apiErrorMessage, formatDateTime, formatQuantity, validatePledgeQuantity } from '../utils/relief';

const control = 'w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-dash-primary/30';

// What the donor should understand about where the pledge is, in plain words (never claims delivery early).
const STATUS_EXPLAINER = {
  available: 'Your pledge is recorded. We are waiting for a volunteer to accept the pickup. Nothing has been collected or delivered yet.',
  accepted: 'A volunteer accepted your pickup and will schedule a time. Nothing has been collected yet.',
  scheduled: 'Your pickup is scheduled. Nothing has been collected yet.',
  on_the_way: 'The volunteer is on the way to collect your supplies.',
  picked_up: 'Your supplies were picked up and are on their way to the affected area. They are not delivered yet.',
  delivery_reported: 'The volunteer reported delivering your supplies. This counts as delivered once an administrator verifies it.',
  completed: 'Your supplies were delivered and verified. Thank you for helping!',
  completed_partial: 'Part of your pledge was delivered and verified. The remaining quantity was released and is not counted as delivered.',
  failed: 'Delivery could not be completed. Nothing has been counted as delivered.',
  cancelled: 'This pledge was cancelled. Its quantity is available to other donors again.',
};

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-xl bg-surface-hover px-3 py-2">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-text-primary">{value}</dd>
      {hint && <p className="text-[11px] text-text-muted">{hint}</p>}
    </div>
  );
}

export function ReliefPledgeDetailPage() {
  const { id } = useParams();
  const pledgeId = Number(id);
  const validId = Number.isInteger(pledgeId) && pledgeId > 0;
  const pledgeState = useApiResource(reliefApi.getPledge, validId ? pledgeId : null, { enabled: validId });
  const timelineState = useApiResource(reliefApi.getPledgeTimeline, validId ? pledgeId : null, { enabled: validId });
  const pledge = pledgeState.data?.data?.pledge;
  const item = pledgeState.data?.data?.item;
  const events = timelineState.data?.data?.events ?? [];

  const [editing, setEditing] = useState(false);
  const [newQuantity, setNewQuantity] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);

  const refresh = () => { pledgeState.reload(); timelineState.reload(); };
  const tracking = pledge?.tracking;
  const taskStatus = tracking?.taskStatus;
  // Server rules, mirrored for the UI: quantity is editable only until a volunteer accepts; cancel only before pickup.
  const canEdit = pledge?.status === 'pledged' && (!tracking || taskStatus === 'available');
  const canCancel = pledge?.status === 'pledged';

  const run = async (fn, successMessage) => {
    setBusy(true); setActionError(null);
    try { await fn(); setNotice(successMessage); refresh(); return true; } catch (err) { setActionError(apiErrorMessage(err)); return false; } finally { setBusy(false); }
  };

  const saveQuantity = async () => {
    const own = item ? Number(pledge.quantityPledged) : 0;
    const room = Number(item?.quantities?.remainingToPledge ?? 0) + own;
    const err = validatePledgeQuantity(newQuantity, { unit: pledge.unit, remainingToPledge: room });
    if (err) { setActionError(err); return; }
    if (await run(() => reliefApi.updatePledge(pledgeId, { quantity: newQuantity.trim() }), 'Quantity updated.')) setEditing(false);
  };

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-4xl space-y-5 pb-8 text-left">
        <Link to="/donor/relief-pledges" className="inline-flex items-center gap-1 text-sm font-medium text-dash-primary hover:underline"><ArrowLeft size={16} aria-hidden="true" />My Relief Pledges</Link>

        {!validId && <ErrorState title="Invalid link" message="This pledge link is not valid." showRetry={false} />}
        {validId && pledgeState.loading && <div role="status" aria-label="Loading pledge" className="h-56 animate-pulse rounded-2xl border border-border bg-surface" />}
        {validId && pledgeState.error && <ErrorState title="Could not load this pledge" message={apiErrorMessage(pledgeState.error)} onRetry={pledgeState.reload} showRetry={pledgeState.error?.response?.status !== 404} />}

        {pledge && (
          <>
            <header className="space-y-2">
              <h1 className="text-2xl font-bold text-text-primary">{pledge.itemName}</h1>
              <p className="text-sm text-text-secondary">for <Link to={`/relief/requests/${pledge.requestId}`} className="text-dash-primary hover:underline">{pledge.requestTitle}</Link></p>
              <div className="flex flex-wrap gap-1.5"><PledgeStatusBadge status={pledge.status} />{tracking && taskStatus !== pledge.status && <TaskStatusBadge status={taskStatus} />}</div>
            </header>

            {tracking && <p role="status" className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-primary">{STATUS_EXPLAINER[taskStatus] || ''}</p>}
            {tracking?.hasOpenIssue && <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-text-primary">An administrator is looking into an issue with this pickup.</p>}
            {notice && <p role="status" className="rounded-xl bg-success-soft px-4 py-3 text-sm text-text-primary">{notice}</p>}
            {/* while a dialog is open its own error is shown there; don't repeat it on the page behind */}
            {actionError && !editing && !cancelling && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-text-primary">{actionError}</p>}

            <section aria-label="Quantities" className="rounded-2xl border border-border bg-surface p-4">
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Pledged" value={formatQuantity(pledge.quantityPledged, pledge.unit)} />
                <Stat label="Collected" value={formatQuantity(pledge.quantityCollected, pledge.unit)} hint="Picked up from you" />
                <Stat label="Awaiting verification" value={formatQuantity(pledge.quantityPendingVerification, pledge.unit)} hint="Reported, not yet counted" />
                <Stat label="Verified delivered" value={formatQuantity(pledge.quantityDelivered, pledge.unit)} hint="Counted as delivered" />
              </dl>
            </section>

            {tracking && (
              <section aria-label="Pickup and delivery" className="grid gap-3 rounded-2xl border border-border bg-surface p-4 text-sm sm:grid-cols-3">
                <div><p className="mb-0.5 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-text-muted"><MapPin size={12} aria-hidden="true" />Pickup</p><p className="text-text-primary">{tracking.pickup.address}</p><p className="text-xs text-text-secondary">{tracking.pickup.date ? String(tracking.pickup.date).slice(0, 10) : ''} · {tracking.pickup.timeSlot}</p></div>
                <div><p className="mb-0.5 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-text-muted"><Truck size={12} aria-hidden="true" />Delivered to</p><p className="text-text-primary">{tracking.destination.name}</p></div>
                <div><p className="mb-0.5 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-text-muted"><User size={12} aria-hidden="true" />Volunteer</p><p className="text-text-primary">{tracking.volunteerName || 'Not assigned yet'}</p>{tracking.scheduledAt && <p className="text-xs text-text-secondary">Scheduled {formatDateTime(tracking.scheduledAt)}</p>}</div>
              </section>
            )}

            {(canEdit || canCancel) && (
              <div className="flex flex-wrap gap-2">
                {canEdit && <button type="button" onClick={() => { setEditing(true); setNewQuantity(String(pledge.quantityPledged)); setActionError(null); }} className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary hover:bg-surface-hover">Change quantity</button>}
                {canCancel && <button type="button" onClick={() => { setCancelling(true); setActionError(null); }} className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-danger hover:bg-danger-soft">Cancel pledge</button>}
              </div>
            )}
            {pledge.status === 'pledged' && tracking && taskStatus !== 'available' && <p className="text-xs text-text-muted">A volunteer has accepted the pickup, so the quantity is locked. You can still cancel the pledge.</p>}

            <section aria-labelledby="history-heading" className="rounded-2xl border border-border bg-surface p-4">
              <h2 id="history-heading" className="mb-3 text-sm font-semibold text-text-primary">History</h2>
              {timelineState.loading ? <div role="status" aria-label="Loading history" className="h-16 animate-pulse rounded-xl bg-surface-hover" />
                : timelineState.error ? <ErrorState title="Could not load history" message={apiErrorMessage(timelineState.error)} onRetry={timelineState.reload} size="small" />
                  : <PledgeTimeline events={events} unit={pledge.unit} />}
            </section>

            {editing && (
              <Modal title="Change quantity" onClose={() => setEditing(false)}>
                <label htmlFor="edit-quantity" className="mb-1 block text-xs font-semibold text-text-secondary">New quantity ({pledge.unit})</label>
                <input id="edit-quantity" inputMode="decimal" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} className={control} />
                {actionError && <p role="alert" className="mt-2 text-xs text-danger">{actionError}</p>}
                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setEditing(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-hover">Close</button>
                  <button type="button" disabled={busy} onClick={saveQuantity} className="rounded-xl bg-dash-primary px-4 py-2 text-sm font-semibold text-white hover:bg-dash-primary-hover disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button>
                </div>
              </Modal>
            )}
            {cancelling && (
              <Modal title="Cancel this pledge?" onClose={() => setCancelling(false)}>
                <p className="text-sm text-text-secondary">The pickup will be cancelled{tracking?.volunteerName ? ` and ${tracking.volunteerName} will be told` : ''}, and the quantity becomes available to other donors.</p>
                <label htmlFor="cancel-reason" className="mt-3 mb-1 block text-xs font-semibold text-text-secondary">Reason (optional)</label>
                <input id="cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} className={control} />
                {actionError && <p role="alert" className="mt-2 text-xs text-danger">{actionError}</p>}
                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setCancelling(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-hover">Keep pledge</button>
                  <button type="button" disabled={busy} onClick={async () => { if (await run(() => reliefApi.cancelPledge(pledgeId, reason.trim()), 'Pledge cancelled.')) setCancelling(false); }}
                    className="inline-flex items-center gap-2 rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy && <Loader2 size={16} aria-hidden="true" className="animate-spin" />}Cancel pledge</button>
                </div>
              </Modal>
            )}
          </>
        )}
      </main>
    </DashboardLayout>
  );
}

export default ReliefPledgeDetailPage;
