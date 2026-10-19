import { PriorityBadge, StageBadge } from './IncidentBadges';
import { ITEM_CATEGORY_LABELS, formatQuantity, computeProgress, labelFor, toNumber } from '../../utils/relief';

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-xl bg-surface-hover px-3 py-2">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className={`mt-0.5 text-sm font-semibold ${value === 'Unavailable' ? 'text-text-muted' : 'text-text-primary'}`}>{value}</dd>
      {hint && <p className="text-[11px] text-text-muted">{hint}</p>}
    </div>
  );
}

/** Stacked bar: solid = delivered, lighter = pledged but NOT yet delivered, empty = still open. */
export function ProgressBar({ quantities }) {
  const progress = computeProgress(quantities);
  if (!progress) return <p className="text-xs text-text-muted">Progress unavailable</p>;
  const delivered = Math.round(progress.deliveredPct);
  const pledged = Math.round(progress.pledgedPct);
  return (
    <div>
      <div
        role="progressbar"
        aria-label="Delivered quantity"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={delivered}
        aria-valuetext={`${delivered}% delivered, ${pledged}% pledged but not yet delivered`}
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-hover ring-1 ring-border"
      >
        <div className="h-full bg-success" style={{ width: `${progress.deliveredPct}%` }} />
        <div className="h-full bg-dash-primary/45" style={{ width: `${progress.pledgedPct}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-text-muted">{delivered}% delivered · {pledged}% pledged, awaiting delivery</p>
    </div>
  );
}

/** One requested supply with every quantity the backend reports. Missing values render as "Unavailable". */
export function ReliefItemCard({ item, onPledge }) {
  const q = item.quantities || {};
  const unit = item.unit;
  const openToPledge = toNumber(q.remainingToPledge);
  const categoryLabel = labelFor(ITEM_CATEGORY_LABELS, item.category, 'Other supplies');
  return (
    <li data-testid="relief-item" className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-text-primary">{item.name || 'Unnamed item'}</h4>
          {categoryLabel.toLowerCase() !== String(item.name || '').trim().toLowerCase() && <p className="text-xs text-text-muted">{categoryLabel}</p>}
        </div>
        <div className="flex flex-wrap gap-1.5"><PriorityBadge priority={item.priority} /><StageBadge stage={q.fulfillmentStage} /></div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Required" value={formatQuantity(q.requested, unit)} />
        <Stat label="Pledged" value={formatQuantity(q.activePledged, unit)} hint="Promised, not yet delivered" />
        <Stat label="Collected" value={formatQuantity(q.collected, unit)} hint="Picked up from donors" />
        <Stat label="Delivered" value={formatQuantity(q.delivered, unit)} hint="Reached the location" />
        <Stat label="Still needed" value={formatQuantity(q.remainingUnfulfilled, unit)} hint={openToPledge === null ? undefined : `${formatQuantity(openToPledge, unit)} open to pledge`} />
      </dl>

      <div className="mt-3"><ProgressBar quantities={q} /></div>
      {toNumber(q.pendingVerification) > 0 && (
        <p data-testid="pending-verification" className="mt-2 rounded-lg bg-warning-soft px-3 py-1.5 text-xs text-text-primary">
          {formatQuantity(q.pendingVerification, unit)} reported delivered by volunteers — <strong>awaiting administrator verification</strong>, not counted as delivered yet.
        </p>
      )}
      {onPledge && item.status === 'active' && openToPledge !== null && openToPledge > 0 && (
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={() => onPledge(item)} className="rounded-xl bg-dash-primary px-4 py-2 text-sm font-semibold text-white hover:bg-dash-primary-hover focus-visible:outline-2 focus-visible:outline-dash-primary">
            Pledge {item.name}
          </button>
        </div>
      )}
      {item.notes && <p className="mt-2 text-xs text-text-secondary">{item.notes}</p>}
    </li>
  );
}
