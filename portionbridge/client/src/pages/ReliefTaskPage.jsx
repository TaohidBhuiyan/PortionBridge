import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, MapPin, Phone, Truck } from 'lucide-react';
import { DashboardLayout, ErrorState } from '../components/dashboard';
import { TaskStatusBadge } from '../components/relief/TaskBadges';
import { PriorityBadge, TypeBadge } from '../components/relief/IncidentBadges';
import { PledgeTimeline } from '../components/relief/PledgeTimeline';
import { TaskActionPanel } from '../components/relief/TaskActionPanel';
import { useApiResource } from '../hooks/useApiResource';
import reliefApi from '../services/reliefApi';
import { apiErrorMessage, formatDateTime, formatQuantity } from '../utils/relief';

function Row({ label, children }) {
  if (!children) return null;
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-text-primary">{children}</dd>
    </div>
  );
}

/**
 * One relief task. An unaccepted task shows only the limited information the server returns for
 * volunteers who have not accepted it; the assigned volunteer also gets the pickup contact and
 * the drop-off details. The page just renders what the server returned — if the server did not
 * include an address or phone number, none is shown.
 */
export function ReliefTaskPage() {
  const { id } = useParams();
  const pledgeId = Number(id);
  const validId = Number.isInteger(pledgeId) && pledgeId > 0;
  const taskState = useApiResource(reliefApi.getTask, validId ? pledgeId : null, { enabled: validId });
  const task = taskState.data?.data?.task;
  const isAssigned = Boolean(task && task.dropoff);
  const timelineState = useApiResource(reliefApi.getPledgeTimeline, validId ? pledgeId : null, { enabled: validId && isAssigned });
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState(null);

  const refresh = async () => { taskState.reload(); timelineState.reload(); };
  const accept = async () => {
    setAccepting(true); setAcceptError(null);
    try { await reliefApi.acceptTask(pledgeId); refresh(); } catch (err) { setAcceptError(apiErrorMessage(err)); } finally { setAccepting(false); }
  };

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-4xl space-y-5 pb-8 text-left">
        <Link to="/volunteer/relief-tasks" className="inline-flex items-center gap-1 text-sm font-medium text-dash-primary hover:underline"><ArrowLeft size={16} aria-hidden="true" />Relief Tasks</Link>

        {!validId && <ErrorState title="Invalid link" message="This task link is not valid." showRetry={false} />}
        {validId && taskState.loading && <div role="status" aria-label="Loading task" className="h-56 animate-pulse rounded-2xl border border-border bg-surface" />}
        {validId && taskState.error && <ErrorState title="Could not load this task" message={apiErrorMessage(taskState.error)} onRetry={taskState.reload} showRetry={taskState.error?.response?.status !== 404} />}

        {task && (
          <>
            <header className="space-y-2">
              <h1 className="text-2xl font-bold text-text-primary">{task.item.name} — {formatQuantity(task.quantity.pledged, task.item.unit)}</h1>
              <p className="text-sm text-text-secondary">{task.incident.title} · {task.incident.district}</p>
              <div className="flex flex-wrap gap-1.5"><TypeBadge type={task.incident.disasterType} /><PriorityBadge priority={task.request.priority} /><TaskStatusBadge status={task.taskStatus} /></div>
            </header>

            {task.hasOpenIssue && <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-text-primary">An issue on this task is with the administrators.</p>}

            <section aria-label="Quantities" className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-4">
              {[['Pledged', task.quantity.pledged], ['Collected', task.quantity.collected], ['Awaiting verification', task.quantity.pendingVerification], ['Verified delivered', task.quantity.delivered]].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-surface-hover px-3 py-2"><p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">{l}</p><p className="text-sm font-semibold text-text-primary">{formatQuantity(v, task.item.unit)}</p></div>
              ))}
            </section>

            {!isAssigned && (
              <section aria-label="Available task" className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <Row label="Pickup area">{task.pickup.area}</Row>
                  <Row label="Pickup window">{task.pickup.date ? `${String(task.pickup.date).slice(0, 10)} · ${task.pickup.timeSlot}` : null}</Row>
                  <Row label="Deliver to">{task.request.locationName}</Row>
                  <Row label="Distance from your base">{typeof task.distanceKm === 'number' ? `${task.distanceKm} km` : null}</Row>
                </dl>
                <p className="text-xs text-text-secondary">The donor’s exact address and phone number, and the drop-off details, are shown after you accept this task.</p>
                {acceptError && <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-text-primary">{acceptError}</p>}
                {task.taskStatus === 'available' && (
                  <button type="button" onClick={accept} disabled={accepting} className="inline-flex items-center gap-2 rounded-xl bg-dash-primary px-4 py-2 text-sm font-semibold text-white hover:bg-dash-primary-hover disabled:opacity-60">
                    {accepting && <Loader2 size={16} aria-hidden="true" className="animate-spin" />}Accept this task
                  </button>
                )}
              </section>
            )}

            {isAssigned && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <section aria-label="Pickup details" className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                    <h2 className="flex items-center gap-1.5 text-sm font-semibold text-text-primary"><MapPin size={16} aria-hidden="true" className="text-dash-primary" />Pickup</h2>
                    <dl className="space-y-2">
                      <Row label="Address">{task.pickup.address}</Row>
                      <Row label="Landmark">{task.pickup.landmark}</Row>
                      <Row label="Contact">{task.pickup.contactName}</Row>
                      <Row label="Phone">{task.pickup.contactPhone ? <a href={`tel:${task.pickup.contactPhone}`} className="inline-flex items-center gap-1 text-dash-primary hover:underline"><Phone size={12} aria-hidden="true" />{task.pickup.contactPhone}</a> : null}</Row>
                      <Row label="When">{task.pickup.date ? `${String(task.pickup.date).slice(0, 10)} · ${task.pickup.timeSlot}` : null}</Row>
                      <Row label="Scheduled">{task.scheduledAt ? formatDateTime(task.scheduledAt) : null}</Row>
                      <Row label="Instructions">{task.pickup.instructions}</Row>
                    </dl>
                  </section>
                  <section aria-label="Drop-off details" className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                    <h2 className="flex items-center gap-1.5 text-sm font-semibold text-text-primary"><Truck size={16} aria-hidden="true" className="text-dash-primary" />Drop-off</h2>
                    <dl className="space-y-2">
                      <Row label="Location">{task.dropoff.name}</Row>
                      <Row label="Address">{task.dropoff.address}</Row>
                      <Row label="Instructions">{task.dropoff.instructions}</Row>
                      <Row label="Required in total">{formatQuantity(task.requested, task.item.unit)}</Row>
                    </dl>
                  </section>
                </div>

                <TaskActionPanel task={task} onChanged={refresh} />

                <section aria-labelledby="task-history" className="rounded-2xl border border-border bg-surface p-4">
                  <h2 id="task-history" className="mb-3 text-sm font-semibold text-text-primary">History</h2>
                  {timelineState.loading ? <div role="status" aria-label="Loading history" className="h-16 animate-pulse rounded-xl bg-surface-hover" />
                    : timelineState.error ? <ErrorState title="Could not load history" message={apiErrorMessage(timelineState.error)} onRetry={timelineState.reload} size="small" />
                      : <PledgeTimeline events={timelineState.data?.data?.events ?? []} unit={task.item.unit} />}
                </section>
              </>
            )}
          </>
        )}
      </main>
    </DashboardLayout>
  );
}

export default ReliefTaskPage;
