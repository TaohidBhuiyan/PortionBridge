import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HandHeart, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { PledgeStatusBadge, TaskStatusBadge } from '../components/relief/TaskBadges';
import { useApiResource } from '../hooks/useApiResource';
import reliefApi from '../services/reliefApi';
import { apiErrorMessage, formatDateTime, formatQuantity } from '../utils/relief';

const ACTIVE = ['pledged', 'collected'];
const TABS = [
  { id: 'active', label: 'Active' },
  { id: 'previous', label: 'Previous' },
  { id: 'all', label: 'All' },
];

function PledgeCard({ pledge }) {
  const t = pledge.tracking;
  return (
    <li data-testid="pledge-card" className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            <Link to={`/donor/relief-pledges/${pledge.id}`} className="hover:text-dash-primary hover:underline">{pledge.itemName}</Link>
          </h3>
          <p className="text-xs text-text-secondary">for {pledge.requestTitle}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <PledgeStatusBadge status={pledge.status} />
          {/* the task badge adds the logistics stage; skip it when it would just repeat the pledge status */}
          {t && t.taskStatus !== pledge.status && <TaskStatusBadge status={t.taskStatus} />}
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-lg bg-surface-hover px-2.5 py-1.5"><dt className="text-text-muted">Pledged</dt><dd className="font-semibold text-text-primary">{formatQuantity(pledge.quantityPledged, pledge.unit)}</dd></div>
        <div className="rounded-lg bg-surface-hover px-2.5 py-1.5"><dt className="text-text-muted">Collected</dt><dd className="font-semibold text-text-primary">{formatQuantity(pledge.quantityCollected, pledge.unit)}</dd></div>
        <div className="rounded-lg bg-surface-hover px-2.5 py-1.5"><dt className="text-text-muted">Awaiting verification</dt><dd className="font-semibold text-text-primary">{formatQuantity(pledge.quantityPendingVerification, pledge.unit)}</dd></div>
        <div className="rounded-lg bg-surface-hover px-2.5 py-1.5"><dt className="text-text-muted">Verified delivered</dt><dd className="font-semibold text-text-primary">{formatQuantity(pledge.quantityDelivered, pledge.unit)}</dd></div>
      </dl>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
        <span>Pledged {formatDateTime(pledge.createdAt)}{t?.volunteerName ? ` · Volunteer: ${t.volunteerName}` : ''}</span>
        <Link to={`/donor/relief-pledges/${pledge.id}`} className="font-semibold text-dash-primary hover:underline">Track pledge</Link>
      </div>
    </li>
  );
}

/** The donor's own relief pledges with live tracking taken from the server. */
export function MyReliefPledgesPage() {
  const [tab, setTab] = useState('active');
  const [page, setPage] = useState(1);
  const params = useMemo(() => ({ page, limit: 25 }), [page]);
  const { data, error, loading, reload } = useApiResource(reliefApi.listMyPledges, params);
  const pledges = useMemo(() => data?.data?.pledges ?? [], [data]);
  const meta = data?.meta;
  const shown = useMemo(() => pledges.filter((p) => (tab === 'all' ? true : tab === 'active' ? ACTIVE.includes(p.status) : !ACTIVE.includes(p.status))), [pledges, tab]);

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-4xl space-y-5 pb-8 text-left">
        <header className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary"><HandHeart size={26} aria-hidden="true" className="text-dash-primary" />My Relief Pledges</h1>
          <p className="text-sm text-text-secondary">Supplies you have pledged to disaster relief, and where each one is. A pledge counts as delivered only after a volunteer delivers it and an administrator verifies it.</p>
        </header>

        <div role="tablist" aria-label="Pledge filter" className="inline-flex rounded-xl border border-border bg-surface p-1">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} type="button" onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${tab === t.id ? 'bg-dash-primary text-white' : 'text-text-secondary hover:bg-surface-hover'}`}>{t.label}</button>
          ))}
        </div>

        {loading && <div role="status" aria-label="Loading pledges" className="space-y-3">{[0, 1].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-surface" />)}</div>}
        {error && <ErrorState title="Could not load your pledges" message={apiErrorMessage(error)} onRetry={reload} size="small" />}
        {!loading && !error && shown.length === 0 && (
          <EmptyState
            icon={HandHeart}
            title={tab === 'active' ? 'No active pledges' : tab === 'previous' ? 'No previous pledges' : 'No pledges yet'}
            description="Browse verified disasters and pledge the supplies that are needed."
            actionLabel="Browse disasters"
            onAction={() => { window.location.assign('/relief'); }}
            size="small"
          />
        )}
        {!loading && !error && shown.length > 0 && <ul className="space-y-3">{shown.map((p) => <PledgeCard key={p.id} pledge={p} />)}</ul>}

        {!loading && !error && meta && meta.totalPages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
            <button type="button" disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 font-medium disabled:opacity-50"><ChevronLeft size={16} aria-hidden="true" />Previous</button>
            <span className="text-text-secondary">Page {meta.page} of {meta.totalPages}</span>
            <button type="button" disabled={meta.page >= meta.totalPages} onClick={() => setPage(meta.page + 1)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 font-medium disabled:opacity-50">Next<ChevronRight size={16} aria-hidden="true" /></button>
          </nav>
        )}
      </main>
    </DashboardLayout>
  );
}

export default MyReliefPledgesPage;
