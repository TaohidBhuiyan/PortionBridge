import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '../../common/Modal';
import { apiErrorMessage } from '../../../utils/relief';

import { btn, primaryBtn, dangerBtn, field } from './opsConstants';

const TONES = {
  neutral: 'bg-surface-hover text-text-secondary', success: 'bg-success-soft text-success', warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger', info: 'bg-info-soft text-info',
};
export const Pill = ({ tone = 'neutral', children }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone] || TONES.neutral}`}>{children}</span>
);


export function Pager({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-3 flex items-center justify-center gap-3 text-sm">
      <button type="button" className={btn} disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}><ChevronLeft size={16} aria-hidden="true" />Previous</button>
      <span className="text-text-secondary">Page {meta.page} of {meta.totalPages}</span>
      <button type="button" className={btn} disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Next<ChevronRight size={16} aria-hidden="true" /></button>
    </nav>
  );
}

export const Skeleton = ({ label = 'Loading' }) => <div role="status" aria-label={label} className="h-32 animate-pulse rounded-2xl bg-surface-hover" />;

export const Card = ({ title, children, action }) => (
  <section className="rounded-2xl border border-border bg-surface p-4">
    {(title || action) && <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-bold text-text-primary">{title}</h3>{action}</div>}
    {children}
  </section>
);

/**
 * Confirmation dialog for actions that change records. When `reasonLabel` is given the confirm button stays
 * disabled until a reason of `minLength` characters is entered (the server enforces the same rule).
 */
export function ConfirmDialog({ title, description, confirmLabel = 'Confirm', reasonLabel, minLength = 5, danger = false, onConfirm, onClose, children }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const needsReason = Boolean(reasonLabel);
  const ready = !needsReason || reason.trim().length >= minLength;
  const run = async () => {
    setBusy(true); setError(null);
    try { await onConfirm(reason.trim()); onClose(); } catch (err) { setError(apiErrorMessage(err)); setBusy(false); }
  };
  return (
    <Modal title={title} onClose={onClose} maxWidth="max-w-lg">
      <div className="space-y-3 text-sm">
        {description && <p className="text-text-secondary">{description}</p>}
        {children}
        {needsReason && (
          <label className="block text-xs font-medium text-text-secondary">{reasonLabel}
            <textarea rows={3} maxLength={500} className={field} value={reason} onChange={(e) => setReason(e.target.value)} aria-label={reasonLabel} />
          </label>
        )}
        {error && <p role="alert" className="text-xs font-semibold text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className={btn} onClick={onClose}>Cancel</button>
          <button type="button" className={danger ? dangerBtn : primaryBtn} disabled={!ready || busy} onClick={run}>{busy ? 'Working…' : confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}

export const QtyCell = ({ value, unit }) => <span className="tabular-nums">{value} <span className="text-text-muted">{unit}</span></span>;
