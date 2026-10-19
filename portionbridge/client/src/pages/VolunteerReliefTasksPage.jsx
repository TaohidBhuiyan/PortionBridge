import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, MapPin, Navigation, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { TaskStatusBadge } from '../components/relief/TaskBadges';
import { PriorityBadge, TypeBadge } from '../components/relief/IncidentBadges';
import { useApiResource } from '../hooks/useApiResource';
import reliefApi from '../services/reliefApi';
import { apiErrorMessage, formatQuantity } from '../utils/relief';

const TABS = [
  { id: 'available', label: 'Available' },
  { id: 'active', label: 'My active tasks' },
  { id: 'history', label: 'Completed & cancelled' },
];

// module-level so the fetcher identity is stable (useApiResource re-fetches when it changes)
const fetchTasks = ({ tab, page }) => (tab === 'available'
  ? reliefApi.listAvailableTasks({ page, limit: 25 })
  : reliefApi.listMyTasks({ group: tab, page, limit: 25 }));

function TaskCard({ task }) {
  return (
    <li data-testid="task-card" className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            <Link to={`/volunteer/relief-tasks/${task.pledgeId}`} className="hover:text-dash-primary hover:underline">{task.item.name} — {formatQuantity(task.quantity.pledged, task.item.unit)}</Link>
          </h3>
          <p className="text-xs text-text-secondary">{task.incident.title} · deliver to {task.request.locationName}</p>
        </div>
        <div className="flex flex-wrap gap-1.5"><TypeBadge type={task.incident.disasterType} /><PriorityBadge priority={task.request.priority} /><TaskStatusBadge status={task.taskStatus} /></div>
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
        <span className="inline-flex items-center gap-1"><MapPin size={12} aria-hidden="true" />Pickup area: {task.pickup.area || 'Unavailable'}</span>
        {typeof task.distanceKm === 'number' && <span className="inline-flex items-center gap-1 font-medium text-dash-primary"><Navigation size={12} aria-hidden="true" />{task.distanceKm} km from your base</span>}
        {task.pickup.date && <span>Pickup {String(task.pickup.date).slice(0, 10)} · {task.pickup.timeSlot}</span>}
        {task.hasOpenIssue && <span className="font-medium text-warning">Issue open</span>}
      </p>
    </li>
  );
}

/** Volunteer task queue: tasks they could accept, their active tasks, and their history. */
export function VolunteerReliefTasksPage() {
  const [tab, setTab] = useState('available');
  const [page, setPage] = useState(1);
  const params = useMemo(() => ({ tab, page }), [tab, page]);
  const { data, error, loading, reload } = useApiResource(fetchTasks, params);
  const tasks = data?.data?.tasks ?? [];
  const meta = data?.meta;
  const needsBase = data?.data?.needsBaseAddress;

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-4xl space-y-5 pb-8 text-left">
        <header className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary"><ClipboardList size={26} aria-hidden="true" className="text-dash-primary" />Relief Tasks</h1>
          <p className="text-sm text-text-secondary">Pickup and delivery tasks for disaster relief pledges. Donor contact details and exact addresses are shown only after you accept a task.</p>
        </header>

        <div role="tablist" aria-label="Task filter" className="inline-flex flex-wrap rounded-xl border border-border bg-surface p-1">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} type="button" onClick={() => { setTab(t.id); setPage(1); }}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${tab === t.id ? 'bg-dash-primary text-white' : 'text-text-secondary hover:bg-surface-hover'}`}>{t.label}</button>
          ))}
        </div>

        {loading && <div role="status" aria-label="Loading tasks" className="space-y-3">{[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-surface" />)}</div>}
        {error && <ErrorState title="Could not load tasks" message={apiErrorMessage(error)} onRetry={reload} size="small" />}
        {!loading && !error && tab === 'available' && needsBase && (
          <p role="alert" className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-text-primary">
            Set your base address and coverage radius first — tasks are matched to the area you cover. <Link to="/volunteer/opportunities" className="font-semibold text-dash-primary hover:underline">Set it on Find Opportunities</Link>.
          </p>
        )}
        {!loading && !error && !needsBase && tasks.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title={tab === 'available' ? 'No tasks available right now' : tab === 'active' ? 'No active relief tasks' : 'No completed or cancelled tasks yet'}
            description={tab === 'available' ? 'New pickups appear here when donors pledge supplies within your coverage area.' : 'Accept a task from the Available tab to get started.'}
            showAction={false}
            size="small"
          />
        )}
        {!loading && !error && tasks.length > 0 && <ul className="space-y-3">{tasks.map((t) => <TaskCard key={t.pledgeId} task={t} />)}</ul>}

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

export default VolunteerReliefTasksPage;
