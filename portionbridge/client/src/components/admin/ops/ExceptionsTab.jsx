import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApiResource } from '../../../hooks/useApiResource';
import adminOpsApi from '../../../services/adminOpsApi';
import { ErrorState } from '../../dashboard/ErrorState';
import { EmptyState } from '../../dashboard/EmptyState';
import { Modal } from '../../common/Modal';
import { apiErrorMessage, formatDateTime, labelFor, REPORT_TYPE_LABELS } from '../../../utils/relief';
import { Pager, Pill, Skeleton, ConfirmDialog, QtyCell } from './ui';
import { btn, primaryBtn, field } from './opsConstants';

const TYPES = [['', 'All issues'], ['open_issue', 'Open problems'], ['pending_verification', 'Awaiting verification'], ['discrepancy', 'Quantity discrepancies']];
const KIND_LABEL = { open_issue: 'Open problem', pending_verification: 'Awaiting verification', discrepancy: 'Verified quantity differs from reported' };

/** Verify a pending delivery (optionally with a lower verified quantity) or correct an already verified one. */
function QuantityDialog({ item, mode, onClose, onDone }) {
  const [quantity, setQuantity] = useState(mode === 'correct' ? String(item.verifiedQuantity ?? '') : String(item.reportedQuantity ?? ''));
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const differs = Number(quantity) !== Number(item.reportedQuantity);
  const needsNotes = mode === 'correct' || differs;
  const valid = quantity !== '' && Number(quantity) >= 0 && (!needsNotes || notes.trim().length >= 5);
  const submit = async () => {
    setBusy(true); setError(null);
    try {
      if (mode === 'correct') await adminOpsApi.correctDelivery(item.reportId, quantity, notes.trim());
      else await adminOpsApi.verifyReport(item.reportId, differs ? { verifiedQuantity: Number(quantity), notes: notes.trim() } : {});
      toast.success(mode === 'correct' ? 'Delivery record corrected.' : 'Delivery verified.');
      onDone();
    } catch (err) { setError(apiErrorMessage(err)); setBusy(false); }
  };
  return (
    <Modal title={mode === 'correct' ? 'Correct verified delivery' : 'Verify delivery'} onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-3 text-sm">
        <p className="text-text-secondary">{item.itemName}: volunteer reported <strong><QtyCell value={item.reportedQuantity} unit={item.unit} /></strong>{mode === 'correct' && <>; currently verified <strong><QtyCell value={item.verifiedQuantity} unit={item.unit} /></strong></>}. The verified quantity cannot exceed what was reported.</p>
        <label className="block text-xs font-medium text-text-secondary">Verified quantity ({item.unit})
          <input type="number" min="0" step="any" className={field} value={quantity} onChange={(e) => setQuantity(e.target.value)} aria-label="Verified quantity" />
        </label>
        <label className="block text-xs font-medium text-text-secondary">{mode === 'correct' ? 'Reason for the correction (required)' : differs ? 'Explain the difference (required)' : 'Notes (optional)'}
          <textarea rows={2} maxLength={500} className={field} value={notes} onChange={(e) => setNotes(e.target.value)} aria-label="Notes" />
        </label>
        {error && <p role="alert" className="text-xs font-semibold text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className={btn} onClick={onClose}>Cancel</button>
          <button type="button" className={primaryBtn} disabled={!valid || busy} onClick={submit}>{busy ? 'Working…' : mode === 'correct' ? 'Save correction' : 'Verify delivery'}</button>
        </div>
      </div>
    </Modal>
  );
}

export function ExceptionsTab({ filters, preset, onPreset }) {
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const { data, error, loading, reload } = useApiResource(adminOpsApi.exceptions, { ...filters, type: preset.type, page, limit: 15 });
  const list = data?.data?.exceptions ?? [];
  const act = (fn, msg) => async (text) => { await fn(text); toast.success(msg); reload(); };
  const closeAnd = () => { setDialog(null); reload(); };

  return (
    <div className="space-y-3">
      <div role="group" aria-label="Issue type" className="flex flex-wrap gap-2">
        {TYPES.map(([v, label]) => (
          <button key={label} type="button" aria-pressed={(preset.type || '') === v} onClick={() => { setPage(1); onPreset({ type: v }); }} className={`${btn} ${(preset.type || '') === v ? '!border-dash-primary !text-dash-primary' : ''}`}>{label}</button>
        ))}
      </div>
      {loading ? <Skeleton label="Loading delivery issues" /> : error ? <ErrorState title="Could not load delivery issues" message={apiErrorMessage(error)} onRetry={reload} />
        : list.length === 0 ? <EmptyState title="No delivery issues" description="Nothing needs investigation for these filters." />
          : (
            <ul className="space-y-2">
              {list.map((x) => (
                <li key={x.reportId} data-testid="exception-row" className="rounded-2xl border border-border bg-surface p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{x.itemName} · pledge #{x.pledgeId}</p>
                      <p className="text-xs text-text-secondary">
                        <Link to={`/admin/operations/incidents/${x.incidentId}`} className="hover:underline">{x.incidentTitle}</Link> · {x.district} · {labelFor(REPORT_TYPE_LABELS, x.reportType, x.reportType)} by {x.reporterName || 'unknown'} · {formatDateTime(x.createdAt)}
                      </p>
                      <p className="mt-1 text-xs text-text-secondary">
                        {x.reportedQuantity !== null && <>Reported <QtyCell value={x.reportedQuantity} unit={x.unit} /></>}
                        {x.verifiedQuantity !== null && <> · verified <QtyCell value={x.verifiedQuantity} unit={x.unit} /></>}
                        {' '}· pledged <QtyCell value={x.pledgedQuantity} unit={x.unit} /> · total verified <QtyCell value={x.verifiedDeliveredTotal} unit={x.unit} />
                      </p>
                      {x.notes && <p className="mt-1 text-xs text-text-muted">&ldquo;{x.notes}&rdquo;</p>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Pill tone={x.kind === 'discrepancy' ? 'info' : 'warning'}>{KIND_LABEL[x.kind]}</Pill>
                      {x.corrections > 0 && <Pill>{x.corrections} correction{x.corrections === 1 ? '' : 's'}</Pill>}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {x.kind === 'pending_verification' && <>
                      <button type="button" className={btn} onClick={() => setDialog({ type: 'verify', item: x })}>Verify delivery</button>
                      <button type="button" className={btn} onClick={() => setDialog({ type: 'reject', item: x })}>Reject report</button>
                    </>}
                    {x.kind === 'discrepancy' && <button type="button" className={btn} onClick={() => setDialog({ type: 'correct', item: x })}>Correct verified quantity</button>}
                    {x.kind === 'open_issue' && <>
                      <button type="button" className={btn} onClick={() => setDialog({ type: 'close', item: x })}>Close issue</button>
                      <button type="button" className={btn} onClick={() => setDialog({ type: 'fail', item: x })}>Mark delivery failed</button>
                    </>}
                  </div>
                </li>
              ))}
            </ul>
          )}
      <Pager meta={data?.meta} onPage={setPage} />
      {(dialog?.type === 'verify' || dialog?.type === 'correct') && <QuantityDialog item={dialog.item} mode={dialog.type} onClose={() => setDialog(null)} onDone={closeAnd} />}
      {dialog?.type === 'reject' && <ConfirmDialog title="Reject delivery report" danger confirmLabel="Reject" reasonLabel="Reason (required, shown to the volunteer)" onClose={() => setDialog(null)} onConfirm={act((n) => adminOpsApi.rejectReport(dialog.item.reportId, n), 'Report rejected.')} />}
      {dialog?.type === 'close' && <ConfirmDialog title="Close issue" confirmLabel="Close issue" reasonLabel="Resolution notes (required)" onClose={() => setDialog(null)} onConfirm={act((n) => adminOpsApi.resolveReport(dialog.item.reportId, { action: 'close', notes: n }), 'Issue closed.')} />}
      {dialog?.type === 'fail' && <ConfirmDialog title="Mark delivery failed" danger confirmLabel="Mark failed" reasonLabel="Notes (required)" onClose={() => setDialog(null)} onConfirm={act((n) => adminOpsApi.resolveReport(dialog.item.reportId, { action: 'fail', notes: n }), 'Delivery marked failed.')} />}
    </div>
  );
}
