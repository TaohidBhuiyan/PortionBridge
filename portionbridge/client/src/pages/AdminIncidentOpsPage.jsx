import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Siren } from 'lucide-react';
import { DashboardLayout } from '../components/dashboard';
import { ErrorState } from '../components/dashboard/ErrorState';
import { useApiResource } from '../hooks/useApiResource';
import adminOpsApi from '../services/adminOpsApi';
import { apiErrorMessage, formatDateTime, typeLabel, labelFor, INCIDENT_STATUS_LABELS, REQUEST_STATUS_LABELS } from '../utils/relief';
import { Card, Pill, Skeleton, ConfirmDialog, QtyCell } from '../components/admin/ops/ui';
import { SEVERITY_TONE, STATUS_TONE, btn, field, primaryBtn } from '../components/admin/ops/opsConstants';
import { Modal } from '../components/common/Modal';

const ACTION_LABEL = {
  status_change: 'Status changed', verified: 'Verified', rejected: 'Rejected', info_requested: 'More information requested', corrected: 'Details corrected',
  merged_into: 'Merged into another incident', merged_from: 'Duplicate merged into this incident', reopened: 'Reopened', resolved: 'Resolved',
};

function MergeDialog({ incident, onClose, onDone }) {
  const [target, setTarget] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const valid = /^\d+$/.test(target) && Number(target) !== incident.id && reason.trim().length >= 5;
  const submit = async () => {
    setBusy(true); setError(null);
    try { await adminOpsApi.mergeIncident(incident.id, target, reason.trim()); toast.success('Incident merged.'); onDone(); } catch (err) { setError(apiErrorMessage(err)); setBusy(false); }
  };
  return (
    <Modal title="Merge duplicate incident" onClose={onClose} maxWidth="max-w-lg">
      <div className="space-y-3 text-sm">
        <p className="text-text-secondary">This incident stays on record as <strong>merged</strong>. Its relief requests, pledges, tasks and history move to the surviving incident — nothing is deleted. A live alert on this incident is withdrawn.</p>
        <label className="block text-xs font-medium text-text-secondary">Surviving incident ID
          <input inputMode="numeric" className={field} value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Surviving incident ID" />
        </label>
        <label className="block text-xs font-medium text-text-secondary">Reason (required)
          <textarea rows={2} maxLength={500} className={field} value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason" />
        </label>
        {error && <p role="alert" className="text-xs font-semibold text-danger">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" className={btn} onClick={onClose}>Cancel</button>
          <button type="button" className={primaryBtn} disabled={!valid || busy} onClick={submit}>{busy ? 'Working…' : 'Merge incident'}</button></div>
      </div>
    </Modal>
  );
}

/** One incident, everything an admin needs: details, history, requests with item progress, pledges, issues, alerts. */
export function AdminIncidentOpsPage() {
  const { id } = useParams();
  const { data, error, loading, reload } = useApiResource(adminOpsApi.incidentDetail, id);
  const [dialog, setDialog] = useState(null);
  const d = data?.data;
  const run = (fn, msg) => async (text) => { await fn(text); toast.success(msg); reload(); };
  const inc = d?.incident;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-4 pb-12">
        <Link to="/admin/operations" className="inline-flex items-center gap-1 text-sm font-semibold text-dash-primary hover:underline"><ArrowLeft size={16} aria-hidden="true" />Operations dashboard</Link>
        {loading ? <Skeleton label="Loading incident" /> : error ? <ErrorState title="Could not load this incident" message={apiErrorMessage(error)} onRetry={reload} /> : (
          <>
            <header className="space-y-2">
              <h1 className="text-2xl font-bold text-text-primary">{inc.title}</h1>
              <div className="flex flex-wrap gap-1.5">
                <Pill tone={STATUS_TONE[inc.status]}>{labelFor(INCIDENT_STATUS_LABELS, inc.status)}</Pill>
                <Pill tone={SEVERITY_TONE[inc.severity]}>{inc.severity} severity</Pill>
                <Pill tone={inc.verificationStatus === 'verified' ? 'success' : inc.verificationStatus === 'rejected' ? 'danger' : 'warning'}>{inc.verificationStatus === 'verified' ? 'Verified' : inc.verificationStatus === 'rejected' ? 'Rejected' : 'Not verified'}</Pill>
                <Pill>{typeLabel(inc.disasterType)}</Pill>
              </div>
              <p className="text-sm text-text-secondary">{inc.district}{inc.division ? `, ${inc.division}` : ''}{inc.affectedArea ? ` · ${inc.affectedArea}` : ''} · reported {formatDateTime(inc.createdAt)}{inc.reporterName ? ` by ${inc.reporterName}` : ''} · updated {formatDateTime(inc.updatedAt)}</p>
              {inc.mergedIntoId && <p className="text-sm font-semibold text-warning">Merged into <Link to={`/admin/operations/incidents/${inc.mergedIntoId}`} className="underline">incident #{inc.mergedIntoId}</Link>.</p>}
              {inc.infoRequestNote && <p className="text-xs text-text-muted">Information requested ({formatDateTime(inc.infoRequestedAt)}): {inc.infoRequestNote}</p>}
            </header>

            <Card title="Actions">
              <div className="flex flex-wrap gap-2">
                {['reported', 'under_review'].includes(inc.status) && <button type="button" className={btn} onClick={() => setDialog('info')}>Request more information</button>}
                {inc.status === 'reported' && <button type="button" className={btn} onClick={() => setDialog('review')}>Start review</button>}
                {inc.status === 'under_review' && <button type="button" className={btn} onClick={() => setDialog('verify')}>Verify</button>}
                {['reported', 'under_review'].includes(inc.status) && <button type="button" className={btn} onClick={() => setDialog('reject')}>Reject</button>}
                {['verified', 'active'].includes(inc.status) && <button type="button" className={btn} onClick={() => setDialog('resolve')}>Mark resolved</button>}
                {['resolved', 'rejected'].includes(inc.status) && <button type="button" className={btn} onClick={() => setDialog('reopen')}>Reopen</button>}
                {inc.status !== 'merged' && <button type="button" className={btn} onClick={() => setDialog('merge')}>Merge duplicate…</button>}
                <Link to="/admin/alerts" className={`${btn} inline-flex items-center gap-1`}><Siren size={14} aria-hidden="true" />Manage alerts</Link>
              </div>
              <p className="mt-2 text-[11px] text-text-muted">Incident details (severity, affected area, location) are corrected from the incident&apos;s edit form; every correction is stored here with before/after values and a reason.</p>
            </Card>

            <Card title="Description">
              <p className="whitespace-pre-line text-sm text-text-primary">{inc.description || 'No description provided.'}</p>
              {inc.verificationNotes && <p className="mt-2 text-xs text-text-muted">Verification notes: {inc.verificationNotes}</p>}
            </Card>

            <Card title={`Relief requests (${d.requests.length})`}>
              {d.requests.length === 0 ? <p className="text-sm text-text-muted">No relief requests yet.</p> : (
                <ul className="space-y-3">{d.requests.map((r) => (
                  <li key={r.id} className="rounded-xl border border-border p-3" data-testid="detail-request">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link to={`/relief/requests/${r.id}`} className="text-sm font-semibold text-dash-primary hover:underline">{r.title}</Link>
                      <span className="flex gap-1.5"><Pill tone={STATUS_TONE[r.status]}>{labelFor(REQUEST_STATUS_LABELS, r.status)}</Pill>{r.reassessment.map((x) => <Pill key={x.code} tone="warning">{x.text}</Pill>)}</span>
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-text-secondary">{r.items.map((i) => (
                      <li key={i.id}>{i.name}: requested <QtyCell value={i.quantities.requested} unit={i.unit} /> · pledged <QtyCell value={i.quantities.pledged ?? i.quantities.activePledged} unit={i.unit} /> · collected <QtyCell value={i.quantities.collected} unit={i.unit} /> · verified delivered <QtyCell value={i.quantities.delivered} unit={i.unit} /> · still needed <QtyCell value={i.quantities.remainingToPledge} unit={i.unit} /></li>))}</ul>
                  </li>))}</ul>
              )}
            </Card>

            <div className="grid gap-3 lg:grid-cols-2">
              <Card title={`Pledges and delivery tasks (${d.pledges.length})`}>
                {d.pledges.length === 0 ? <p className="text-sm text-text-muted">No pledges yet.</p> : (
                  <ul className="space-y-2 text-xs text-text-secondary">{d.pledges.map((p) => (
                    <li key={p.id} data-testid="detail-pledge"><strong className="text-text-primary">#{p.id} {p.itemName}</strong> · {p.donorName} · pledged <QtyCell value={p.pledged} unit={p.unit} /> · verified delivered <QtyCell value={p.verifiedDelivered} unit={p.unit} />
                      <span className="block">{p.status}{p.taskStatus ? ` · task ${p.taskStatus}` : ''}{p.volunteerName ? ` · ${p.volunteerName}` : ' · no volunteer'}</span></li>))}</ul>
                )}
              </Card>
              <Card title={`Outstanding delivery issues (${d.issues.length})`}>
                {d.issues.length === 0 ? <p className="text-sm text-text-muted">No open issues or reports awaiting verification.</p> : (
                  <ul className="space-y-2 text-xs text-text-secondary">{d.issues.map((x) => (
                    <li key={x.reportId}><strong className="text-text-primary">{x.type} · pledge #{x.pledgeId}</strong> · {x.itemName} · {x.status}{x.reportedQuantity !== null ? ` · reported ${x.reportedQuantity} ${x.unit}` : ''}{x.notes ? <span className="block">&ldquo;{x.notes}&rdquo;</span> : null}</li>))}</ul>
                )}
                <Link to="/admin/operations" className="mt-2 inline-block text-xs font-semibold text-dash-primary hover:underline">Open the delivery-issues queue</Link>
              </Card>
            </div>

            <Card title="Alerts and notifications" action={<Link to="/admin/alerts" className="text-xs font-semibold text-dash-primary hover:underline">Manage</Link>}>
              {d.alerts.items.length === 0 ? <p className="text-sm text-text-muted">No alerts were issued for this incident.</p> : (
                <ul className="space-y-1.5 text-sm" data-testid="detail-alerts">{d.alerts.items.map((a) => (
                  <li key={a.id}>Alert #{a.id} · <Pill tone={SEVERITY_TONE[a.severity]}>{a.severity}</Pill> {a.scope} · {a.status} · {a.deliveredTotal} sent{a.eventsFailed ? ` · ${a.eventsFailed} failed` : ''}</li>))}</ul>
              )}
              <p className="mt-2 text-xs text-text-muted">In-app notifications stored for this incident: {d.alerts.notificationsStored} ({d.alerts.notificationsRead} read).</p>
            </Card>

            <Card title="Verification and status history">
              {d.history.length === 0 ? <p className="text-sm text-text-muted">No history recorded yet.</p> : (
                <ol className="space-y-2" data-testid="history">{d.history.map((h) => (
                  <li key={h.id} className="text-sm"><span className="font-semibold text-text-primary">{ACTION_LABEL[h.action] || h.action}</span>
                    {h.fromStatus && h.toStatus && h.fromStatus !== h.toStatus ? <span className="text-text-secondary"> · {h.fromStatus} → {h.toStatus}</span> : null}
                    <span className="block text-xs text-text-muted">{h.actorName || 'system'} · {formatDateTime(h.createdAt)}{h.reason ? ` · ${h.reason}` : ''}</span></li>))}</ol>
              )}
              <ul className="mt-2 text-[11px] text-text-muted">{d.limitations.map((l) => <li key={l}>{l}</li>)}</ul>
            </Card>

            {d.quantityHistory.length > 0 && (
              <Card title="Recent quantity changes">
                <ul className="space-y-1.5 text-xs text-text-secondary">{d.quantityHistory.map((q) => <li key={q.id}>{q.itemName} ({q.unit}): {q.oldQuantity ?? '—'} → {q.newQuantity ?? '—'} · {q.reason || 'no reason'} · {q.actorName || 'unknown'} · {formatDateTime(q.createdAt)}</li>)}</ul>
              </Card>
            )}
          </>
        )}
      </div>

      {dialog === 'info' && <ConfirmDialog title="Request more information" confirmLabel="Send request" reasonLabel="What information is needed? (sent to the reporter)" onClose={() => setDialog(null)} onConfirm={run((n) => adminOpsApi.requestInfo(id, n), 'Information requested.')} />}
      {dialog === 'review' && <ConfirmDialog title="Start review" confirmLabel="Start review" description="Moves the report to under review. It stays unverified." onClose={() => setDialog(null)} onConfirm={run(() => adminOpsApi.setIncidentStatus(id, 'under_review'), 'Review started.')} />}
      {dialog === 'verify' && <ConfirmDialog title="Verify incident" confirmLabel="Verify" reasonLabel="Verification notes (what confirmed the report?)" minLength={3} description="Verification is recorded under your name and may trigger an automatic local alert according to the alert policy." onClose={() => setDialog(null)} onConfirm={run((n) => adminOpsApi.setIncidentStatus(id, 'verified', n), 'Incident verified.')} />}
      {dialog === 'reject' && <ConfirmDialog title="Reject report" danger confirmLabel="Reject" reasonLabel="Reason for rejecting (required)" onClose={() => setDialog(null)} onConfirm={run((n) => adminOpsApi.setIncidentStatus(id, 'rejected', n), 'Report rejected.')} />}
      {dialog === 'resolve' && <ConfirmDialog title="Mark resolved" confirmLabel="Mark resolved" description="Resolving withdraws the live alert with a resolution notice." onClose={() => setDialog(null)} onConfirm={run(() => adminOpsApi.setIncidentStatus(id, 'resolved'), 'Incident resolved.')} />}
      {dialog === 'reopen' && <ConfirmDialog title="Reopen incident" confirmLabel="Reopen" reasonLabel="Justification for reopening (required)" onClose={() => setDialog(null)} onConfirm={run((r) => adminOpsApi.reopenIncident(id, r), 'Incident reopened.')} />}
      {dialog === 'merge' && inc && <MergeDialog incident={inc} onClose={() => setDialog(null)} onDone={() => { setDialog(null); reload(); }} />}
    </DashboardLayout>
  );
}

export default AdminIncidentOpsPage;
