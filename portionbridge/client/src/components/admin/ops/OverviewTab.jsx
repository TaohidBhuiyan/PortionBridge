import { Link } from 'react-router-dom';
import { Siren } from 'lucide-react';
import { useApiResource } from '../../../hooks/useApiResource';
import adminOpsApi from '../../../services/adminOpsApi';
import { ErrorState } from '../../dashboard/ErrorState';
import { apiErrorMessage, formatDateTime, typeLabel, labelFor, INCIDENT_STATUS_LABELS, REQUEST_STATUS_LABELS } from '../../../utils/relief';
import { Card, Pill, Skeleton, QtyCell } from './ui';
import { SEVERITY_TONE, STATUS_TONE } from './opsConstants';

function Stat({ label, value, hint, tone, onClick }) {
  const toneClass = tone === 'danger' && value > 0 ? 'text-danger' : tone === 'warning' && value > 0 ? 'text-warning' : 'text-text-primary';
  return (
    <button type="button" onClick={onClick} data-testid={`stat-${label}`} className="rounded-2xl border border-border bg-surface p-3 text-left hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-dash-primary">
      <span className="block text-[11px] font-medium text-text-secondary">{label}</span>
      <span className={`block text-2xl font-bold tabular-nums ${toneClass}`}>{value}</span>
      {hint && <span className="block text-[11px] text-text-muted">{hint}</span>}
    </button>
  );
}

/** Live summary. Every card opens the matching list so an admin can go from a number to the records behind it. */
export function OverviewTab({ filters, onNavigate }) {
  const { data, error, loading, reload } = useApiResource(adminOpsApi.dashboard, filters);
  if (loading) return <Skeleton label="Loading operations summary" />;
  if (error) return <ErrorState title="Could not load the operations summary" message={apiErrorMessage(error)} onRetry={reload} />;
  const d = data.data;
  const s = d.summary;
  const go = (tab, patch) => () => onNavigate(tab, patch);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-text-secondary">Incidents</h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Stat label="Total reported" value={s.incidents.totalReported} onClick={go('incidents', {})} hint="excludes merged duplicates" />
          <Stat label="Awaiting verification" value={s.incidents.awaitingVerification} tone="warning" onClick={go('incidents', { queue: 'awaiting' })} />
          <Stat label="Verified / active" value={s.incidents.verifiedActive} onClick={go('incidents', { queue: 'open' })} />
          <Stat label="Critical or high priority" value={s.incidents.criticalOrHigh} tone="danger" onClick={go('incidents', { queue: 'critical' })} />
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-text-secondary">Relief requests</h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Stat label="Awaiting review" value={s.requests.awaitingReview} tone="warning" onClick={go('requests', { requestStatus: 'pending_review' })} />
          <Stat label="Approved, unfulfilled" value={s.requests.approvedUnfulfilled} onClick={go('requests', { unfulfilled: 'true' })} />
          <Stat label="Need reassessment" value={s.requests.needsReassessment} tone="warning" onClick={go('requests', { needsReassessment: 'true' })} />
          <Stat label="Awaiting correction" value={s.requests.awaitingCorrection} onClick={go('requests', { requestStatus: 'pending_review' })} />
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-text-secondary">Volunteer tasks &amp; deliveries</h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Stat label="Active tasks" value={s.tasks.active} onClick={go('tasks', { view: 'active' })} />
          <Stat label="Unassigned tasks" value={s.tasks.unassigned} tone="warning" onClick={go('tasks', { view: 'unassigned' })} />
          <Stat label="Delayed tasks" value={s.tasks.delayed} tone="danger" hint={`no progress for ${s.tasks.delayThresholdHours}h+`} onClick={go('tasks', { view: 'delayed' })} />
          <Stat label="Failed tasks" value={s.tasks.failed} tone="danger" onClick={go('tasks', { view: 'failed' })} />
          <Stat label="Open delivery issues" value={s.deliveryIssues.openIssues} tone="danger" onClick={go('exceptions', { type: 'open_issue' })} />
          <Stat label="Awaiting delivery verification" value={s.deliveryIssues.pendingVerification} tone="warning" onClick={go('exceptions', { type: 'pending_verification' })} />
          <Stat label="Quantity discrepancies" value={s.deliveryIssues.discrepancies} onClick={go('exceptions', { type: 'discrepancy' })} />
        </div>
      </div>

      <Card title="Requested vs pledged vs verified delivered (by item and unit)">
        {d.quantities.length === 0 ? <p className="text-sm text-text-muted">No approved relief items match these filters.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Quantities grouped by item and unit</caption>
              <thead className="text-[11px] uppercase text-text-muted"><tr>{['Item', 'Requested', 'Pledged', 'Collected', 'Verified delivered', 'Awaiting verification', 'Still needed'].map((h) => <th key={h} scope="col" className="py-1 pr-3">{h}</th>)}</tr></thead>
              <tbody>
                {d.quantities.map((q) => (
                  <tr key={`${q.key}-${q.unit}`} className="border-t border-border">
                    <th scope="row" className="py-1.5 pr-3 font-semibold text-text-primary">{q.name}</th>
                    <td className="pr-3"><QtyCell value={q.requested} unit={q.unit} /></td><td className="pr-3"><QtyCell value={q.pledged} unit={q.unit} /></td>
                    <td className="pr-3"><QtyCell value={q.collected} unit={q.unit} /></td><td className="pr-3"><QtyCell value={q.verifiedDelivered} unit={q.unit} /></td>
                    <td className="pr-3"><QtyCell value={q.pendingVerification} unit={q.unit} /></td><td><QtyCell value={q.remainingUnfulfilled} unit={q.unit} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Recently updated incidents">
          {d.recentIncidents.length === 0 ? <p className="text-sm text-text-muted">No incidents match these filters.</p> : (
            <ul className="space-y-2">{d.recentIncidents.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <Link to={`/admin/operations/incidents/${i.id}`} className="font-semibold text-dash-primary hover:underline">{i.title}</Link>
                <span className="flex gap-1"><Pill tone={SEVERITY_TONE[i.severity]}>{i.severity}</Pill><Pill tone={STATUS_TONE[i.status]}>{labelFor(INCIDENT_STATUS_LABELS, i.status)}</Pill></span>
                <span className="w-full text-[11px] text-text-muted">{typeLabel(i.disasterType)} · {i.district} · {formatDateTime(i.updatedAt)}</span>
              </li>))}</ul>
          )}
        </Card>
        <Card title="Recently updated relief requests">
          {d.recentRequests.length === 0 ? <p className="text-sm text-text-muted">No relief requests match these filters.</p> : (
            <ul className="space-y-2">{d.recentRequests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <Link to={`/relief/requests/${r.id}`} className="font-semibold text-dash-primary hover:underline">{r.title}</Link>
                <Pill tone={STATUS_TONE[r.status]}>{labelFor(REQUEST_STATUS_LABELS, r.status)}</Pill>
                <span className="w-full text-[11px] text-text-muted">{r.incidentTitle} · {formatDateTime(r.updatedAt)}</span>
              </li>))}</ul>
          )}
        </Card>
      </div>

      <Card title="Alerts" action={<Link to="/admin/alerts" className="inline-flex items-center gap-1 text-xs font-semibold text-dash-primary hover:underline"><Siren size={14} aria-hidden="true" />Manage alerts</Link>}>
        <p className="text-sm text-text-secondary" data-testid="alert-health">
          {d.alerts.active} active alert{d.alerts.active === 1 ? '' : 's'} ({d.alerts.activeNationwide} nationwide) · {d.alerts.failedEvents} failed deliver{d.alerts.failedEvents === 1 ? 'y' : 'ies'} · {d.alerts.pendingEvents} pending · {d.alerts.stuckEvents} stuck
        </p>
        {d.alerts.failed.length > 0 && <ul className="mt-2 list-disc pl-5 text-xs text-danger">{d.alerts.failed.map((e) => <li key={e.id}>Alert #{e.alertId} · {e.type} · {e.error || 'no error recorded'} (attempts {e.attempts})</li>)}</ul>}
      </Card>
      <ul className="text-[11px] text-text-muted">{d.limitations.map((l) => <li key={l}>{l}</li>)}</ul>
    </div>
  );
}
