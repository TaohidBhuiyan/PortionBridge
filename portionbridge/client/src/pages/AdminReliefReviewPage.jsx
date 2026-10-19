import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { Modal } from '../components/common/Modal';
import { ReportReviewCard } from '../components/relief/ReportReviewCard';
import { PledgeTimeline } from '../components/relief/PledgeTimeline';
import { TaskStatusBadge, PledgeStatusBadge } from '../components/relief/TaskBadges';
import { useApiResource } from '../hooks/useApiResource';
import reliefApi from '../services/reliefApi';
import { apiErrorMessage, formatQuantity, REPORT_TYPE_LABELS } from '../utils/relief';

const TABS = [{ id: 'queue', label: 'Needs a decision' }, { id: 'tasks', label: 'All tasks' }];
const TYPE_FILTERS = [{ value: '', label: 'All report types' }, ...Object.entries(REPORT_TYPE_LABELS).filter(([k]) => ['delivery', 'failed_delivery', 'problem'].includes(k)).map(([value, label]) => ({ value, label }))];

// module-level so the fetcher identity is stable
const fetchReview = ({ tab, page, type, attention }) => (tab === 'queue'
  ? reliefApi.listReports({ page, limit: 20, ...(type ? { type } : {}) })
  : reliefApi.listAdminTasks({ page, limit: 20, ...(attention ? { attention: 'true' } : {}) }));

function TimelineModal({ pledgeId, onClose }) {
  const state = useApiResource(reliefApi.getPledgeTimeline, pledgeId);
  return (
    <Modal title="Pledge history" onClose={onClose} maxWidth="max-w-xl">
      {state.loading ? <div role="status" aria-label="Loading history" className="h-20 animate-pulse rounded-xl bg-surface-hover" />
        : state.error ? <ErrorState title="Could not load history" message={apiErrorMessage(state.error)} onRetry={state.reload} size="small" />
          : <PledgeTimeline events={state.data?.data?.events ?? []} />}
    </Modal>
  );
}

function TaskRow({ task, onShowTimeline, onRelease }) {
  const canRelease = ['accepted', 'scheduled', 'on_the_way'].includes(task.taskStatus);
  return (
    <li data-testid="admin-task" className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{task.item.name} — {formatQuantity(task.quantity.pledged, task.item.unit)}</h3>
          <p className="text-xs text-text-secondary">{task.incident.title} · {task.request.title} · donor {task.donor.name}{task.assignedTo.volunteerName ? ` · volunteer ${task.assignedTo.volunteerName}` : ' · no volunteer yet'}</p>
        </div>
        <div className="flex flex-wrap gap-1.5"><PledgeStatusBadge status={task.pledgeStatus} /><TaskStatusBadge status={task.taskStatus} />{task.needsAttention && <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger">Needs attention</span>}</div>
      </div>
      <p className="mt-2 text-xs text-text-secondary">
        Collected {formatQuantity(task.quantity.collected, task.item.unit)} · awaiting verification {formatQuantity(task.quantity.pendingVerification, task.item.unit)} · verified delivered {formatQuantity(task.quantity.delivered, task.item.unit)}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => onShowTimeline(task.pledgeId)} className="rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-text-primary hover:bg-surface-hover">History</button>
        {canRelease && <button type="button" onClick={() => onRelease(task)} className="rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-text-primary hover:bg-surface-hover">Release for reassignment</button>}
        <Link to={`/relief/requests/${task.request.id}`} className="rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-text-primary hover:bg-surface-hover">View request</Link>
      </div>
    </li>
  );
}

/** Administrator oversight of relief pledges: verify deliveries, resolve problems, reassign tasks, read the history. */
export function AdminReliefReviewPage() {
  const [tab, setTab] = useState('queue');
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [attention, setAttention] = useState(false);
  const [timelineFor, setTimelineFor] = useState(null);
  const [releasing, setReleasing] = useState(null);
  const [releaseReason, setReleaseReason] = useState('');
  const [releaseError, setReleaseError] = useState(null);
  const params = useMemo(() => ({ tab, page, type, attention }), [tab, page, type, attention]);
  const { data, error, loading, reload } = useApiResource(fetchReview, params);
  const items = data?.data?.reports ?? data?.data?.tasks ?? [];
  const meta = data?.meta;

  const release = async () => {
    setReleaseError(null);
    try { await reliefApi.releaseTask(releasing.pledgeId, releaseReason.trim()); setReleasing(null); setReleaseReason(''); reload(); } catch (err) { setReleaseError(apiErrorMessage(err)); }
  };

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-5xl space-y-5 pb-8 text-left">
        <header className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary"><ShieldCheck size={26} aria-hidden="true" className="text-dash-primary" />Relief Review</h1>
          <p className="text-sm text-text-secondary">Verify volunteer delivery reports, resolve problems and reassign tasks. Delivered quantities across the platform change only when you verify them.</p>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="Review sections" className="inline-flex rounded-xl border border-border bg-surface p-1">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} type="button" onClick={() => { setTab(t.id); setPage(1); }}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${tab === t.id ? 'bg-dash-primary text-white' : 'text-text-secondary hover:bg-surface-hover'}`}>{t.label}</button>
            ))}
          </div>
          {tab === 'queue' ? (
            <label className="text-sm text-text-secondary">
              <span className="sr-only">Report type</span>
              <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} aria-label="Report type" className="rounded-xl border border-border bg-input px-3 py-1.5 text-sm text-text-primary">
                {TYPE_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </label>
          ) : (
            <label className="inline-flex items-center gap-2 text-sm text-text-primary">
              <input type="checkbox" checked={attention} onChange={(e) => { setAttention(e.target.checked); setPage(1); }} className="h-4 w-4 rounded border-border accent-[var(--pb-primary)]" />
              Only tasks that need attention
            </label>
          )}
        </div>

        {loading && <div role="status" aria-label="Loading review items" className="space-y-3">{[0, 1].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-surface" />)}</div>}
        {error && <ErrorState title="Could not load the review list" message={apiErrorMessage(error)} onRetry={reload} size="small" />}
        {!loading && !error && items.length === 0 && (
          <EmptyState icon={ShieldCheck} title={tab === 'queue' ? 'Nothing needs a decision' : 'No relief tasks'} description={tab === 'queue' ? 'Delivery reports awaiting verification and open problems appear here.' : 'Tasks appear when donors pledge supplies with pickup details.'} showAction={false} size="small" />
        )}
        {!loading && !error && items.length > 0 && (
          <ul className="space-y-3">
            {tab === 'queue'
              ? items.map((r) => <ReportReviewCard key={r.id} report={r} onChanged={reload} onShowTimeline={setTimelineFor} />)
              : items.map((t) => <TaskRow key={t.pledgeId} task={t} onShowTimeline={setTimelineFor} onRelease={setReleasing} />)}
          </ul>
        )}

        {!loading && !error && meta && meta.totalPages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
            <button type="button" disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 font-medium disabled:opacity-50"><ChevronLeft size={16} aria-hidden="true" />Previous</button>
            <span className="text-text-secondary">Page {meta.page} of {meta.totalPages}</span>
            <button type="button" disabled={meta.page >= meta.totalPages} onClick={() => setPage(meta.page + 1)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 font-medium disabled:opacity-50">Next<ChevronRight size={16} aria-hidden="true" /></button>
          </nav>
        )}

        {timelineFor && <TimelineModal pledgeId={timelineFor} onClose={() => setTimelineFor(null)} />}
        {releasing && (
          <Modal title="Release task for reassignment?" onClose={() => setReleasing(null)}>
            <p className="text-sm text-text-secondary">{releasing.assignedTo.volunteerName} will be told, and the pickup returns to the queue so another volunteer can accept it. The pledge is unchanged.</p>
            <label htmlFor="release-reason" className="mt-3 mb-1 block text-xs font-semibold text-text-secondary">Reason (optional)</label>
            <input id="release-reason" value={releaseReason} onChange={(e) => setReleaseReason(e.target.value)} maxLength={255} className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-text-primary" />
            {releaseError && <p role="alert" className="mt-2 text-xs text-danger">{releaseError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setReleasing(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-hover">Cancel</button>
              <button type="button" onClick={release} className="rounded-xl bg-dash-primary px-4 py-2 text-sm font-semibold text-white hover:bg-dash-primary-hover">Release</button>
            </div>
          </Modal>
        )}
      </main>
    </DashboardLayout>
  );
}

export default AdminReliefReviewPage;
