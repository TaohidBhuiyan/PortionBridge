import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import { useApiResource } from '../../../hooks/useApiResource';
import adminOpsApi from '../../../services/adminOpsApi';
import { ErrorState } from '../../dashboard/ErrorState';
import { apiErrorMessage, typeLabel } from '../../../utils/relief';
import { Card, Skeleton, QtyCell } from './ui';
import { btn, field } from './opsConstants';

function Bars({ rows, label = (r) => r.key }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (rows.length === 0) return <p className="text-sm text-text-muted">No data for these filters.</p>;
  return (
    <ul className="space-y-1.5">{rows.map((r) => (
      <li key={r.key} className="flex items-center gap-2 text-xs">
        <span className="w-32 shrink-0 truncate text-text-secondary">{label(r)}</span>
        <span className="h-2 flex-1 rounded-full bg-surface-hover"><span className="block h-2 rounded-full bg-dash-primary" style={{ width: `${(r.count / max) * 100}%` }} /></span>
        <span className="w-8 text-right tabular-nums text-text-primary">{r.count}</span>
      </li>))}</ul>
  );
}

const DATASETS = [['incidents', 'Incidents'], ['requests', 'Relief requests'], ['quantities', 'Quantities'], ['tasks', 'Tasks']];

export function ReportsTab({ filters }) {
  const [granularity, setGranularity] = useState('week');
  const [exporting, setExporting] = useState(null);
  const { data, error, loading, reload } = useApiResource(adminOpsApi.reports, { ...filters, granularity });

  const download = async (dataset) => {
    setExporting(dataset);
    try {
      const res = await adminOpsApi.exportCsv(dataset, filters);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `portionbridge-${dataset}.csv`; a.click();
      URL.revokeObjectURL(url);
      if (res.headers?.['x-export-truncated'] === 'true') toast('Export limited to the first 10,000 rows. Narrow the filters for the rest.');
    } catch (err) { toast.error(apiErrorMessage(err, 'Export failed.')); } finally { setExporting(null); }
  };

  if (loading) return <Skeleton label="Loading report" />;
  if (error) return <ErrorState title="Could not generate the report" message={apiErrorMessage(error)} onRetry={reload} />;
  const r = data.data;
  return (
    <div className="space-y-4">
      <Card title="Export (CSV, no personal data)">
        <div className="flex flex-wrap gap-2">
          {DATASETS.map(([k, label]) => <button key={k} type="button" className={`${btn} inline-flex items-center gap-1.5`} disabled={exporting === k} onClick={() => download(k)}><Download size={14} aria-hidden="true" />{exporting === k ? 'Preparing…' : label}</button>)}
        </div>
        <p className="mt-2 text-[11px] text-text-muted">Exports follow the current filters, contain no names, phone numbers, emails or addresses, and are limited to 10,000 rows.</p>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        <Card title="Incidents by type"><Bars rows={r.incidents.byType} label={(x) => typeLabel(x.key)} /></Card>
        <Card title="Incidents by severity"><Bars rows={r.incidents.bySeverity} /></Card>
        <Card title="Incidents by division"><Bars rows={r.incidents.byDivision} /></Card>
        <Card title="Incidents by district"><Bars rows={r.incidents.byDistrict.slice(0, 10)} /></Card>
        <Card title="Verified vs rejected reports">
          <p className="text-sm text-text-primary" data-testid="verified-vs-rejected">
            Verified <strong>{r.incidents.verifiedVsRejected.verified}</strong> · Rejected <strong>{r.incidents.verifiedVsRejected.rejected}</strong> · Not yet decided <strong>{r.incidents.verifiedVsRejected.unverified}</strong>
          </p>
        </Card>
        <Card title="Relief requests by status"><Bars rows={r.requests.byStatus} /></Card>
      </div>
      <Card title="Delivery tasks">
        <dl className="grid grid-cols-2 gap-2 text-sm md:grid-cols-6" data-testid="task-outcomes">
          {[['Completed', r.deliveryTasks.completed], ['Fully delivered', r.deliveryTasks.fullyDelivered], ['Partially fulfilled', r.deliveryTasks.partiallyFulfilled], ['Failed', r.deliveryTasks.failed], ['Cancelled', r.deliveryTasks.cancelled], ['Delayed now', r.deliveryTasks.delayedNow]].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-border p-2"><dt className="text-[11px] text-text-muted">{k}</dt><dd className="text-lg font-bold tabular-nums text-text-primary">{v}</dd></div>
          ))}
        </dl>
      </Card>
      <Card title="Requested vs pledged vs verified delivered (by item and unit)">
        {r.quantities.length === 0 ? <p className="text-sm text-text-muted">No approved relief items for these filters.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Quantities by item and unit</caption>
            <thead className="text-[11px] uppercase text-text-muted"><tr>{['Item', 'Requested', 'Pledged', 'Verified delivered', 'Still needed'].map((h) => <th key={h} scope="col" className="py-1 pr-3">{h}</th>)}</tr></thead>
            <tbody>{r.quantities.map((q) => (<tr key={`${q.key}-${q.unit}`} className="border-t border-border"><th scope="row" className="py-1.5 pr-3 font-semibold">{q.name}</th>
              <td className="pr-3"><QtyCell value={q.requested} unit={q.unit} /></td><td className="pr-3"><QtyCell value={q.pledged} unit={q.unit} /></td>
              <td className="pr-3"><QtyCell value={q.verifiedDelivered} unit={q.unit} /></td><td><QtyCell value={q.remainingUnfulfilled} unit={q.unit} /></td></tr>))}</tbody></table></div>
        )}
      </Card>
      <Card title="Disaster-wise fulfilment progress">
        {r.fulfillmentByIncident.length === 0 ? <p className="text-sm text-text-muted">No approved relief items for these filters.</p> : (
          <ul className="space-y-2 text-sm">{r.fulfillmentByIncident.map((i) => (
            <li key={i.incidentId}><p className="font-semibold text-text-primary">{i.incidentTitle}</p>
              <ul className="ml-3 text-xs text-text-secondary">{i.items.map((q) => <li key={`${q.key}-${q.unit}`}>{q.name}: <QtyCell value={q.verifiedDelivered} unit={q.unit} /> of <QtyCell value={q.requested} unit={q.unit} /> delivered</li>)}</ul></li>))}</ul>
        )}
      </Card>
      <Card title="Operational trend" action={
        <select aria-label="Trend granularity" className={`${field} !mt-0 !w-auto`} value={granularity} onChange={(e) => setGranularity(e.target.value)}>
          <option value="day">Daily</option><option value="week">Weekly</option><option value="month">Monthly</option>
        </select>}>
        {r.trends.length === 0 ? <p className="text-sm text-text-muted">No events in this period.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Operational trend</caption>
            <thead className="text-[11px] uppercase text-text-muted"><tr><th scope="col" className="py-1 pr-3">Period</th><th scope="col" className="pr-3">Incidents reported</th><th scope="col" className="pr-3">Incidents verified</th><th scope="col">Deliveries verified</th></tr></thead>
            <tbody>{r.trends.map((t) => <tr key={t.period} className="border-t border-border"><th scope="row" className="py-1.5 pr-3 font-semibold">{t.period}</th><td className="pr-3 tabular-nums">{t.incidentsReported}</td><td className="pr-3 tabular-nums">{t.incidentsVerified}</td><td className="tabular-nums">{t.deliveriesVerified}</td></tr>)}</tbody></table></div>
        )}
      </Card>
      <Card title="Response-time measures">
        <ul className="space-y-1.5 text-sm" data-testid="timings">{r.timings.map((m) => (
          <li key={m.label} className="flex flex-wrap justify-between gap-2"><span className="text-text-secondary">{m.label}</span>
            <span className="text-text-primary">{m.available ? `${m.averageHours} h average (n=${m.sampleSize})` : 'Not available — no records with the needed timestamps'}</span></li>))}</ul>
      </Card>
      <ul className="text-[11px] text-text-muted">{r.limitations.map((l) => <li key={l}>{l}</li>)}</ul>
    </div>
  );
}
