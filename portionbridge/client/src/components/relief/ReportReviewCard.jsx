import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ReportStatusBadge, ReportTypeLabel, PledgeStatusBadge } from './TaskBadges';
import reliefApi from '../../services/reliefApi';
import { apiErrorMessage, formatDateTime, formatQuantity, toNumber } from '../../utils/relief';

const control = 'w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-dash-primary/30';
const primary = 'rounded-xl bg-dash-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-dash-primary-hover disabled:opacity-60';
const secondary = 'rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-text-primary hover:bg-surface-hover disabled:opacity-60';
const danger = 'rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-danger hover:bg-danger-soft disabled:opacity-60';

/**
 * One item in the administrator review queue. Verification is the ONLY way a volunteer's
 * delivery report becomes verified delivered quantity: an admin may confirm it, confirm a
 * smaller quantity (with an explanation), or reject it. All numbers shown come from the server.
 */
export function ReportReviewCard({ report, onChanged, onShowTimeline }) {
  const unit = report.item.unit;
  const reported = toNumber(report.quantity) ?? 0;
  const [mode, setMode] = useState(null); // 'verify' | 'reject' | 'close' | 'reopen' | 'fail'
  const [verified, setVerified] = useState(String(reported));
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const isDelivery = report.type === 'delivery' && report.status === 'pending';
  const isIssue = ['failed_delivery', 'problem'].includes(report.type) && report.status === 'open';
  const verifiedNum = toNumber(verified);
  const smaller = mode === 'verify' && verifiedNum !== null && verifiedNum < reported;

  const submit = async () => {
    const text = notes.trim();
    if (mode === 'verify') {
      if (!(verifiedNum > 0)) { setError('Enter the verified quantity (greater than zero).'); return; }
      if (verifiedNum > reported) { setError('You cannot verify more than the volunteer reported.'); return; }
      if (smaller && text.length < 5) { setError('Explain why a smaller quantity was verified.'); return; }
    }
    if (mode === 'reject' && text.length < 5) { setError('Give the volunteer a reason (at least 5 characters).'); return; }
    if (mode === 'fail' && text.length < 5) { setError('Add a note explaining why the task is being closed.'); return; }
    setBusy(true); setError(null);
    try {
      if (mode === 'verify') await reliefApi.verifyReport(report.id, { ...(smaller ? { verifiedQuantity: verified.trim() } : {}), ...(text ? { notes: text } : {}) });
      else if (mode === 'reject') await reliefApi.rejectReport(report.id, text);
      else await reliefApi.resolveReport(report.id, { action: mode, ...(text ? { notes: text } : {}) });
      setMode(null);
      if (onChanged) await onChanged();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li data-testid="report-card" className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary"><ReportTypeLabel type={report.type} /> — {report.item.name}</h3>
          <p className="text-xs text-text-secondary">{report.incident.title} · {report.request.title} · donor {report.donorName}</p>
        </div>
        <div className="flex flex-wrap gap-1.5"><ReportStatusBadge status={report.status} /><PledgeStatusBadge status={report.pledgeStatus} /></div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
        {report.quantity !== null && <div className="rounded-lg bg-surface-hover px-2.5 py-1.5"><dt className="text-text-muted">Reported</dt><dd className="font-semibold text-text-primary">{formatQuantity(report.quantity, unit)}</dd></div>}
        <div className="rounded-lg bg-surface-hover px-2.5 py-1.5"><dt className="text-text-muted">Pledged</dt><dd className="font-semibold text-text-primary">{formatQuantity(report.pledge.pledged, unit)}</dd></div>
        <div className="rounded-lg bg-surface-hover px-2.5 py-1.5"><dt className="text-text-muted">Collected</dt><dd className="font-semibold text-text-primary">{formatQuantity(report.pledge.collected, unit)}</dd></div>
        <div className="rounded-lg bg-surface-hover px-2.5 py-1.5"><dt className="text-text-muted">Verified delivered</dt><dd className="font-semibold text-text-primary">{formatQuantity(report.pledge.delivered, unit)}</dd></div>
        <div className="rounded-lg bg-surface-hover px-2.5 py-1.5"><dt className="text-text-muted">Awaiting verification</dt><dd className="font-semibold text-text-primary">{formatQuantity(report.pledge.pendingVerification, unit)}</dd></div>
      </dl>
      {report.notes && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-text-primary"><span className="text-text-muted">Volunteer note: </span>{report.notes}</p>}
      <p className="mt-1 text-xs text-text-muted">Reported by {report.reporterName || 'a volunteer'} · {formatDateTime(report.createdAt)}{report.isFinal ? ' · final delivery' : ''}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {isDelivery && <><button type="button" className={primary} onClick={() => { setMode('verify'); setError(null); setVerified(String(reported)); }}>Verify delivery</button><button type="button" className={danger} onClick={() => { setMode('reject'); setError(null); }}>Reject</button></>}
        {isIssue && <><button type="button" className={primary} onClick={() => { setMode('close'); setError(null); }}>Mark resolved</button>
          {report.type === 'failed_delivery' && <button type="button" className={secondary} onClick={() => { setMode('reopen'); setError(null); }}>Let volunteer retry</button>}
          <button type="button" className={danger} onClick={() => { setMode('fail'); setError(null); }}>Close task as failed</button></>}
        <button type="button" className={secondary} onClick={() => onShowTimeline(report.pledgeId)}>History</button>
        <Link to={`/relief/requests/${report.request.id}`} className={`${secondary} inline-block`}>View request</Link>
      </div>

      {mode && (
        <form className="mt-3 space-y-3 rounded-xl bg-surface-hover p-3" onSubmit={(e) => { e.preventDefault(); submit(); }} aria-label={`${mode} form`}>
          {mode === 'verify' && (
            <div>
              <label htmlFor={`verified-${report.id}`} className="mb-1 block text-xs font-semibold text-text-secondary">Verified quantity (reported {formatQuantity(reported, unit)})</label>
              <input id={`verified-${report.id}`} inputMode="decimal" value={verified} onChange={(e) => setVerified(e.target.value)} className={control} />
            </div>
          )}
          <div>
            <label htmlFor={`notes-${report.id}`} className="mb-1 block text-xs font-semibold text-text-secondary">
              {mode === 'reject' ? 'Reason (shown to the volunteer)' : mode === 'fail' ? 'Why is the task being closed? (required)' : smaller ? 'Explain the difference (required)' : 'Notes (optional)'}
            </label>
            <textarea id={`notes-${report.id}`} rows={2} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} className={control} />
          </div>
          {mode === 'fail' && <p className="text-xs text-text-secondary">Nothing further will be delivered. Any verified quantity stays counted; the rest is released for other donors.</p>}
          {error && <p role="alert" className="text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className={secondary} onClick={() => setMode(null)} disabled={busy}>Cancel</button>
            <button type="submit" className={primary} disabled={busy}>{busy && <Loader2 size={14} aria-hidden="true" className="mr-1 inline animate-spin" />}Confirm</button>
          </div>
        </form>
      )}
    </li>
  );
}
