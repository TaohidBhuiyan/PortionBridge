import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApiResource } from '../../../hooks/useApiResource';
import adminOpsApi from '../../../services/adminOpsApi';
import { ErrorState } from '../../dashboard/ErrorState';
import { EmptyState } from '../../dashboard/EmptyState';
import { apiErrorMessage, formatDateTime, typeLabel, labelFor, INCIDENT_STATUS_LABELS } from '../../../utils/relief';
import { Pager, Pill, Skeleton } from './ui';
import { SEVERITY_TONE, STATUS_TONE, btn } from './opsConstants';

const QUEUES = [['', 'All'], ['awaiting', 'Awaiting verification'], ['open', 'Verified / active'], ['critical', 'Critical or high']];

export function IncidentsTab({ filters, preset, onPreset }) {
  const [page, setPage] = useState(1);
  const params = { ...filters, queue: preset.queue, page, limit: 15 };
  const { data, error, loading, reload } = useApiResource(adminOpsApi.incidents, params);
  const list = data?.data?.incidents ?? [];
  return (
    <div className="space-y-3">
      <div role="group" aria-label="Incident queue" className="flex flex-wrap gap-2">
        {QUEUES.map(([value, label]) => (
          <button key={label} type="button" aria-pressed={(preset.queue || '') === value} onClick={() => { setPage(1); onPreset({ queue: value }); }}
            className={`${btn} ${(preset.queue || '') === value ? '!border-dash-primary !text-dash-primary' : ''}`}>{label}</button>
        ))}
      </div>
      {loading ? <Skeleton label="Loading incidents" /> : error ? <ErrorState title="Could not load incidents" message={apiErrorMessage(error)} onRetry={reload} />
        : list.length === 0 ? <EmptyState title="No incidents match" description="Change the filters or queue to see other incidents." />
          : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Incidents</caption>
                <thead className="bg-page text-[11px] uppercase text-text-muted"><tr>{['Incident', 'Status', 'Severity', 'Location', 'Requests', 'Issues', 'Updated'].map((h) => <th key={h} scope="col" className="px-3 py-2">{h}</th>)}</tr></thead>
                <tbody>
                  {list.map((i) => (
                    <tr key={i.id} className="border-t border-border align-top" data-testid="incident-row">
                      <th scope="row" className="px-3 py-2 font-semibold">
                        <Link to={`/admin/operations/incidents/${i.id}`} className="text-dash-primary hover:underline">{i.title}</Link>
                        <span className="block text-[11px] font-normal text-text-muted">{typeLabel(i.disasterType)}{i.infoRequestedAt ? ' · info requested' : ''}{i.liveAlerts ? ' · live alert' : ''}</span>
                      </th>
                      <td className="px-3 py-2"><Pill tone={STATUS_TONE[i.status]}>{labelFor(INCIDENT_STATUS_LABELS, i.status)}</Pill></td>
                      <td className="px-3 py-2"><Pill tone={SEVERITY_TONE[i.severity]}>{i.severity}</Pill></td>
                      <td className="px-3 py-2 text-text-secondary">{i.district}{i.division ? `, ${i.division}` : ''}</td>
                      <td className="px-3 py-2 tabular-nums">{i.requestCount}{i.pendingRequests ? ` (${i.pendingRequests} pending)` : ''}</td>
                      <td className="px-3 py-2 tabular-nums">{i.openIssues}</td>
                      <td className="px-3 py-2 text-xs text-text-muted">{formatDateTime(i.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      <Pager meta={data?.meta} onPage={setPage} />
    </div>
  );
}
