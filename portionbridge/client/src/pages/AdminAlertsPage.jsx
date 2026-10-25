import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Siren, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { Modal } from '../components/common/Modal';
import { useApiResource } from '../hooks/useApiResource';
import alertApi from '../services/alertApi';
import reliefApi from '../services/reliefApi';
import { BD_DISTRICTS } from '../utils/bdDistricts';
import { apiErrorMessage, formatDateTime, formatQuantity } from '../utils/relief';
import { ALERT_SEVERITY_LABELS } from '../utils/notificationMeta';

const SEVERITIES = ['low', 'moderate', 'high', 'critical'];
const SCOPES = [
  { value: 'local', label: 'Local (incident area)' },
  { value: 'regional', label: 'Regional (selected districts)' },
  { value: 'nationwide', label: 'Nationwide (major emergency)' },
];
const SEV_CLASS = {
  low: 'bg-info-soft text-info', moderate: 'bg-warning-soft text-warning',
  high: 'bg-danger-soft text-danger', critical: 'bg-danger text-white',
};
const STATUS_CLASS = { active: 'bg-success-soft text-success', resolved: 'bg-page text-text-secondary border border-border', cancelled: 'bg-danger-soft text-danger' };
const btn = 'rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-text-primary hover:bg-surface-hover disabled:opacity-60';
const primaryBtn = 'rounded-xl bg-dash-primary px-4 py-2 text-sm font-semibold text-white hover:bg-dash-primary-hover disabled:opacity-60';
const input = 'mt-1 w-full rounded-xl border border-border bg-page px-3 py-2 text-sm text-text-primary';

const SeverityBadge = ({ severity }) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SEV_CLASS[severity]}`}>{ALERT_SEVERITY_LABELS[severity]}</span>;
const StatusBadge = ({ status }) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_CLASS[status]}`}>{status}</span>;

const fetchAlerts = (params) => alertApi.list(params);
const fetchEligibleIncidents = () => reliefApi.listIncidents({ status: 'verified,active', limit: 50, sort: 'newest' });

function DistrictPicker({ value, onChange }) {
  const toggle = (d) => onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d]);
  return (
    <div className="mt-1 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-border bg-page p-2">
      {BD_DISTRICTS.map((d) => (
        <button key={d} type="button" aria-pressed={value.includes(d)} onClick={() => toggle(d)}
          className={`rounded-full border px-2.5 py-0.5 text-xs ${value.includes(d) ? 'border-dash-primary bg-dash-primary-soft font-semibold text-dash-primary' : 'border-border text-text-secondary hover:bg-surface-hover'}`}>{d}</button>
      ))}
    </div>
  );
}

function IssueModal({ onClose, onIssued }) {
  const incidents = useApiResource(fetchEligibleIncidents);
  const list = useMemo(() => incidents.data?.data?.incidents ?? [], [incidents.data]);
  const [form, setForm] = useState({ incidentId: '', scope: 'local', severity: '', districts: [], radiusKm: '', note: '' });
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (patch) => { setPreview(null); setForm((f) => ({ ...f, ...patch })); };

  const body = () => ({
    incidentId: Number(form.incidentId), scope: form.scope,
    ...(form.severity ? { severity: form.severity } : {}),
    ...(form.districts.length ? { districts: form.districts } : {}),
    ...(form.radiusKm ? { radiusKm: Number(form.radiusKm) } : {}),
    ...(form.note.trim() ? { note: form.note.trim() } : {}),
  });

  const runPreview = async () => {
    setBusy(true);
    try { setPreview((await alertApi.preview(body())).data); } catch (err) { toast.error(apiErrorMessage(err)); } finally { setBusy(false); }
  };
  const publish = async () => {
    setBusy(true);
    try { await alertApi.issue(body()); toast.success('Alert issued. Delivery is in progress.'); onIssued(); } catch (err) { toast.error(apiErrorMessage(err)); setBusy(false); }
  };

  return (
    <Modal title="Issue a disaster alert" onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-3">
        <p className="text-xs text-text-secondary">Only incidents that an administrator has verified can be alerted. Alerts are delivered to the in-app inbox only; no email, SMS or push is sent.</p>
        <label className="block text-xs font-medium text-text-secondary" htmlFor="alert-incident">Verified incident
          <select id="alert-incident" className={input} value={form.incidentId} onChange={(e) => { const i = list.find((x) => String(x.id) === e.target.value); set({ incidentId: e.target.value, severity: i?.severity || '' }); }}>
            <option value="">Select an incident…</option>
            {list.map((i) => <option key={i.id} value={i.id}>{i.title} — {i.district}</option>)}
          </select>
        </label>
        {incidents.loading && <p role="status" className="text-xs text-text-muted">Loading incidents…</p>}
        {!incidents.loading && !incidents.error && list.length === 0 && <p className="text-xs text-text-muted">There are no verified or active incidents to alert.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-text-secondary" htmlFor="alert-scope">Scope
            <select id="alert-scope" className={input} value={form.scope} onChange={(e) => set({ scope: e.target.value })}>{SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
          </label>
          <label className="block text-xs font-medium text-text-secondary" htmlFor="alert-severity">Level
            <select id="alert-severity" className={input} value={form.severity} onChange={(e) => set({ severity: e.target.value })}>
              <option value="">Use the incident&apos;s severity</option>
              {SEVERITIES.map((s) => <option key={s} value={s}>{ALERT_SEVERITY_LABELS[s]}</option>)}
            </select>
          </label>
        </div>
        <div>
          <span className="block text-xs font-medium text-text-secondary">Target districts (blank = the incident&apos;s district)</span>
          <DistrictPicker value={form.districts} onChange={(districts) => set({ districts })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-text-secondary" htmlFor="alert-radius-km">Radius around the incident (km)
            <input id="alert-radius-km" type="number" min="1" max="500" className={input} value={form.radiusKm} onChange={(e) => set({ radiusKm: e.target.value })} placeholder="25" />
          </label>
        </div>
        <label className="block text-xs font-medium text-text-secondary" htmlFor="alert-note">Note shown with the alert (optional, factual)
          <textarea id="alert-note" rows={2} maxLength={300} className={input} value={form.note} onChange={(e) => set({ note: e.target.value })} />
        </label>

        {preview && (
          <div data-testid="alert-preview" className="rounded-2xl border border-border bg-page p-4 text-sm">
            <p className="font-semibold text-text-primary">{preview.incident.title} · {preview.incident.district}</p>
            <p className="text-xs text-text-secondary">Status {preview.incident.status} · verification {preview.incident.verificationStatus} · last updated {formatDateTime(preview.incident.updatedAt)}</p>
            {!preview.eligible && <p className="mt-2 text-xs font-semibold text-danger">This incident is not eligible for an alert.</p>}
            {preview.existingLiveAlertId && <p className="mt-2 text-xs font-semibold text-danger">An active alert already exists for this incident (#{preview.existingLiveAlertId}).</p>}
            <p className="mt-2 text-xs text-text-primary">Will be sent as <SeverityBadge severity={preview.proposed.severity} /> · {preview.proposed.scope} · about <strong>{preview.audienceSize}</strong> in-app recipient{preview.audienceSize === 1 ? '' : 's'}.</p>
            {preview.mandatory && <p className="mt-1 text-xs text-text-secondary">Critical nationwide alerts override recipients&apos; optional alert settings.</p>}
            <div className="mt-2">
              <p className="text-xs font-semibold text-text-secondary">Approved relief needs (current quantities)</p>
              {preview.relief.length === 0 ? <p className="text-xs text-text-muted">No approved relief requests yet.</p> : (
                <ul className="mt-1 space-y-1 text-xs text-text-secondary">
                  {preview.relief.map((r) => <li key={r.id}>{r.title}: {r.items.map((i) => `${i.name} ${formatQuantity(i.quantities.remainingToPledge, i.unit)} still needed`).join(', ')}</li>)}
                </ul>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className={btn} onClick={onClose}>Close</button>
          <button type="button" className={btn} disabled={!form.incidentId || busy} onClick={runPreview}>Review before publishing</button>
          <button type="button" className={primaryBtn} disabled={!preview || !preview.eligible || Boolean(preview.existingLiveAlertId) || busy} onClick={publish}>Publish alert</button>
        </div>
      </div>
    </Modal>
  );
}

function DetailModal({ id, onClose, onChanged }) {
  const state = useApiResource(alertApi.get, id);
  const alert = state.data?.data?.alert;
  const [mode, setMode] = useState(null); // update | correction | resolve | cancel
  const [text, setText] = useState('');
  const [severity, setSeverity] = useState('');
  const [scope, setScope] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn, okMsg) => {
    setBusy(true);
    try { await fn(); toast.success(okMsg); setMode(null); setText(''); state.reload(); onChanged(); } catch (err) { toast.error(apiErrorMessage(err)); } finally { setBusy(false); }
  };
  const submit = () => {
    if (mode === 'update') {
      const payload = { requestKey: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60) };
      if (severity && severity !== alert.severity) payload.severity = severity;
      if (scope && scope !== alert.scope) payload.scope = scope;
      if (text.trim()) payload.note = text.trim();
      return run(() => alertApi.update(id, payload), 'Alert updated.');
    }
    if (mode === 'correction') return run(() => alertApi.correct(id, text.trim()), 'Correction queued.');
    if (mode === 'resolve') return run(() => alertApi.resolve(id, text.trim()), 'Alert resolved.');
    return run(() => alertApi.cancel(id, text.trim()), 'Alert cancelled.');
  };
  const needsText = mode === 'correction' || mode === 'cancel';

  return (
    <Modal title={alert ? `Alert #${alert.id}` : 'Alert'} onClose={onClose} maxWidth="max-w-2xl">
      {state.loading ? <div role="status" aria-label="Loading alert" className="h-24 animate-pulse rounded-xl bg-surface-hover" />
        : state.error ? <ErrorState title="Could not load alert" message={apiErrorMessage(state.error)} onRetry={state.reload} size="small" />
          : (
            <div className="space-y-4 text-sm">
              <div>
                <Link to={`/relief/incidents/${alert.incidentId}`} className="font-semibold text-dash-primary hover:underline">{alert.incident.title}</Link>
                <p className="text-xs text-text-secondary">{alert.incident.district} · incident {alert.incident.status} · {alert.scope} · districts: {alert.districts.join(', ') || '—'}{alert.radiusKm ? ` · ${alert.radiusKm} km` : ''}</p>
                <div className="mt-1 flex flex-wrap gap-1.5"><SeverityBadge severity={alert.severity} /><StatusBadge status={alert.status} />{alert.autoGenerated && <span className="rounded-full bg-page px-2.5 py-0.5 text-xs text-text-secondary border border-border">Auto-issued on verification</span>}</div>
                {alert.adminNote && <p className="mt-2 text-xs text-text-secondary">Note: {alert.adminNote}</p>}
                {alert.cancelReason && <p className="mt-2 text-xs text-danger">Cancelled: {alert.cancelReason} (internal)</p>}
              </div>
              <dl data-testid="alert-stats" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[['In-app notices stored', alert.stats.notificationsStored], ['People reached', alert.stats.uniqueRecipients], ['Read', alert.stats.read], ['Unread', alert.stats.unread]].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-border bg-page p-2"><dt className="text-[11px] text-text-muted">{k}</dt><dd className="text-base font-bold text-text-primary">{v}</dd></div>
                ))}
              </dl>
              <p className="text-xs text-text-muted">Counts are notifications stored in the in-app inbox. No external channel (email, SMS, push) is configured.</p>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">History</h4>
                <ul className="mt-1 space-y-1.5">
                  {alert.events.map((e) => (
                    <li key={e.id} data-testid="alert-event" className="rounded-xl border border-border bg-surface p-2.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-text-primary">{e.type.replace('_', ' ')} · {ALERT_SEVERITY_LABELS[e.severity]} · {e.scope}</span>
                        <span className={e.status === 'failed' ? 'font-semibold text-danger' : 'text-text-secondary'}>{e.status}{e.status === 'completed' ? ` · ${e.recipientCount} sent · ${e.readCount} read` : ''}</span>
                      </div>
                      <p className="text-text-muted">{formatDateTime(e.createdAt)}{e.createdByName ? ` · ${e.createdByName}` : ''}{e.error ? ` · ${e.error}` : ''}</p>
                      {e.status === 'failed' && <button type="button" className={`${btn} mt-1.5`} disabled={busy} onClick={() => run(() => alertApi.retryEvent(id, e.id), 'Retry queued.')}>Retry delivery</button>}
                    </li>
                  ))}
                </ul>
              </div>
              {alert.status !== 'cancelled' && !mode && (
                <div className="flex flex-wrap gap-2">
                  {alert.status === 'active' && <button type="button" className={btn} onClick={() => { setMode('update'); setSeverity(alert.severity); setScope(alert.scope); }}>Update / escalate</button>}
                  <button type="button" className={btn} onClick={() => setMode('correction')}>Issue correction</button>
                  {alert.status === 'active' && <button type="button" className={btn} onClick={() => setMode('resolve')}>Resolve</button>}
                  <button type="button" className={`${btn} text-danger`} onClick={() => setMode('cancel')}>Cancel alert</button>
                </div>
              )}
              {mode && (
                <div className="space-y-2 rounded-2xl border border-border bg-page p-3">
                  {mode === 'update' && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="text-xs font-medium text-text-secondary" htmlFor="upd-sev">Level<select id="upd-sev" className={input} value={severity} onChange={(e) => setSeverity(e.target.value)}>{SEVERITIES.map((s) => <option key={s} value={s}>{ALERT_SEVERITY_LABELS[s]}</option>)}</select></label>
                      <label className="text-xs font-medium text-text-secondary" htmlFor="upd-scope">Scope<select id="upd-scope" className={input} value={scope} onChange={(e) => setScope(e.target.value)}>{SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
                    </div>
                  )}
                  <label className="block text-xs font-medium text-text-secondary" htmlFor="alert-action-text">
                    {mode === 'cancel' ? 'Reason (required, internal — users only see a withdrawal notice)' : mode === 'correction' ? 'Correction text (required, shown to users)' : 'Note (optional, shown to users)'}
                    <textarea id="alert-action-text" rows={2} maxLength={mode === 'cancel' ? 500 : 300} className={input} value={text} onChange={(e) => setText(e.target.value)} />
                  </label>
                  <div className="flex justify-end gap-2">
                    <button type="button" className={btn} onClick={() => { setMode(null); setText(''); }}>Back</button>
                    <button type="button" className={primaryBtn} disabled={busy || (needsText && text.trim().length < 5)} onClick={submit}>Confirm</button>
                  </div>
                </div>
              )}
            </div>
          )}
    </Modal>
  );
}

/** Administrator alert management: issue, update/escalate, correct, resolve, cancel, review history and delivery. */
export function AdminAlertsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [scope, setScope] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [openId, setOpenId] = useState(null);
  const params = useMemo(() => ({ page, limit: 15, ...(status ? { status } : {}), ...(scope ? { scope } : {}) }), [page, status, scope]);
  const { data, error, loading, reload } = useApiResource(fetchAlerts, params);
  const alerts = data?.data?.alerts ?? [];
  const meta = data?.meta;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-5 pb-12">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary"><Siren size={22} className="text-dash-primary" aria-hidden="true" />Disaster Alerts</h1>
            <p className="text-sm text-text-secondary">Issue and manage alerts for verified incidents. Delivery is in-app only.</p>
          </div>
          <button type="button" className={`${primaryBtn} inline-flex items-center gap-1.5`} onClick={() => setIssuing(true)}><Plus size={16} aria-hidden="true" />Issue alert</button>
        </header>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Filter by status" className={`${input} !mt-0 !w-auto`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option><option value="active">Active</option><option value="resolved">Resolved</option><option value="cancelled">Cancelled</option>
          </select>
          <select aria-label="Filter by scope" className={`${input} !mt-0 !w-auto`} value={scope} onChange={(e) => { setScope(e.target.value); setPage(1); }}>
            <option value="">All scopes</option>{SCOPES.map((s) => <option key={s.value} value={s.value}>{s.value}</option>)}
          </select>
        </div>

        {loading ? <div role="status" aria-label="Loading alerts" className="h-32 animate-pulse rounded-2xl bg-surface-hover" />
          : error ? <ErrorState title="Could not load alerts" message={apiErrorMessage(error)} onRetry={reload} />
            : alerts.length === 0 ? <EmptyState title="No alerts yet" description="Issue an alert for a verified incident to notify donors and volunteers." />
              : (
                <ul className="space-y-2">
                  {alerts.map((a) => (
                    <li key={a.id} data-testid="alert-row" className="rounded-2xl border border-border bg-surface p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{a.incident.title}</p>
                          <p className="text-xs text-text-secondary">{a.incident.district} · {a.scope} · updated {formatDateTime(a.updatedAt)}{a.autoGenerated ? ' · auto' : ''}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5"><SeverityBadge severity={a.severity} /><StatusBadge status={a.status} /></div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary">
                        <span>{a.deliveredTotal} sent{a.eventsPending ? ` · ${a.eventsPending} in progress` : ''}{a.eventsFailed ? ` · ${a.eventsFailed} failed` : ''}</span>
                        <button type="button" className={btn} onClick={() => setOpenId(a.id)}>Review &amp; manage</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
        {!loading && !error && meta && meta.totalPages > 1 && (
          <nav aria-label="Alert pages" className="flex items-center justify-center gap-3 text-sm">
            <button type="button" disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)} className={btn}><ChevronLeft size={16} aria-hidden="true" />Previous</button>
            <span className="text-text-secondary">Page {meta.page} of {meta.totalPages}</span>
            <button type="button" disabled={meta.page >= meta.totalPages} onClick={() => setPage(meta.page + 1)} className={btn}>Next<ChevronRight size={16} aria-hidden="true" /></button>
          </nav>
        )}
      </div>
      {issuing && <IssueModal onClose={() => setIssuing(false)} onIssued={() => { setIssuing(false); reload(); }} />}
      {openId && <DetailModal id={openId} onClose={() => setOpenId(null)} onChanged={reload} />}
    </DashboardLayout>
  );
}

export default AdminAlertsPage;
