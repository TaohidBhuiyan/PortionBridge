import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApiResource } from '../../../hooks/useApiResource';
import adminOpsApi from '../../../services/adminOpsApi';
import { ErrorState } from '../../dashboard/ErrorState';
import { EmptyState } from '../../dashboard/EmptyState';
import { Modal } from '../../common/Modal';
import { apiErrorMessage, labelFor, PLEDGE_STATUS_LABELS, TASK_STATUS_LABELS } from '../../../utils/relief';
import { Pager, Pill, Skeleton, ConfirmDialog, QtyCell } from './ui';
import { STATUS_TONE, btn, primaryBtn, field } from './opsConstants';

const VIEWS = [['all', 'All'], ['unassigned', 'Unassigned'], ['active', 'Active'], ['delayed', 'Delayed'], ['failed', 'Failed'], ['attention', 'Needs attention']];

/** Picks an eligible volunteer. Eligibility (base location + coverage radius) is computed by the server. */
function VolunteerPicker({ task, mode, onClose, onDone }) {
  const [search, setSearch] = useState('');
  const [chosen, setChosen] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const { data, error: loadError, loading } = useApiResource(adminOpsApi.volunteers, { pledgeId: task.pledgeId, search, limit: 20 });
  const vols = data?.data?.volunteers ?? [];
  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await (mode === 'assign' ? adminOpsApi.assignTask : adminOpsApi.reassignTask)(task.pledgeId, chosen, reason.trim());
      toast.success(mode === 'assign' ? 'Volunteer assigned.' : 'Task reassigned.');
      onDone();
    } catch (err) { setError(apiErrorMessage(err)); setBusy(false); }
  };
  return (
    <Modal title={`${mode === 'assign' ? 'Assign' : 'Reassign'} pledge #${task.pledgeId}`} onClose={onClose} maxWidth="max-w-xl">
      <div className="space-y-3 text-sm">
        <label className="block text-xs font-medium text-text-secondary">Search volunteers by name
          <input className={field} value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        {loading ? <Skeleton label="Loading volunteers" /> : loadError ? <p role="alert" className="text-danger">{apiErrorMessage(loadError)}</p> : (
          <ul className="max-h-56 space-y-1.5 overflow-y-auto" aria-label="Volunteers">
            {vols.length === 0 && <li className="text-text-muted">No volunteers found.</li>}
            {vols.map((v) => (
              <li key={v.id}>
                <label className={`flex cursor-pointer items-start gap-2 rounded-xl border p-2 ${chosen === v.id ? 'border-dash-primary' : 'border-border'} ${v.eligible ? '' : 'opacity-60'}`}>
                  <input type="radio" name="volunteer" disabled={!v.eligible} checked={chosen === v.id} onChange={() => setChosen(v.id)} aria-label={v.name} />
                  <span>
                    <span className="font-semibold text-text-primary">{v.name}</span>
                    <span className="block text-xs text-text-secondary">{v.activeTasks} active task{v.activeTasks === 1 ? '' : 's'}{v.distanceKm !== null ? ` · ${v.distanceKm} km away` : ''}{v.isOnline ? ' · online' : ''}</span>
                    {!v.eligible && <span className="block text-xs text-danger">{v.ineligibleReason || 'Not eligible'}</span>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <label className="block text-xs font-medium text-text-secondary">Reason (required)
          <textarea rows={2} maxLength={500} className={field} value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason" />
        </label>
        {error && <p role="alert" className="text-xs font-semibold text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className={btn} onClick={onClose}>Cancel</button>
          <button type="button" className={primaryBtn} disabled={!chosen || reason.trim().length < 5 || busy} onClick={submit}>{busy ? 'Working…' : 'Confirm'}</button>
        </div>
      </div>
    </Modal>
  );
}

export function TasksTab({ filters, preset, onPreset }) {
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const view = preset.view || 'all';
  const { data, error, loading, reload } = useApiResource(adminOpsApi.tasks, { ...filters, view, page, limit: 15 });
  const list = data?.data?.tasks ?? [];
  const act = (fn, msg) => async (reason) => { await fn(reason); toast.success(msg); reload(); };
  const closeAnd = () => { setDialog(null); reload(); };

  return (
    <div className="space-y-3">
      <div role="group" aria-label="Task view" className="flex flex-wrap gap-2">
        {VIEWS.map(([v, label]) => (
          <button key={v} type="button" aria-pressed={view === v} onClick={() => { setPage(1); onPreset({ view: v }); }} className={`${btn} ${view === v ? '!border-dash-primary !text-dash-primary' : ''}`}>{label}</button>
        ))}
      </div>
      {loading ? <Skeleton label="Loading tasks" /> : error ? <ErrorState title="Could not load tasks" message={apiErrorMessage(error)} onRetry={reload} />
        : list.length === 0 ? <EmptyState title="No tasks in this view" description="Pick another view or change the filters." />
          : (
            <ul className="space-y-2">
              {list.map((t) => (
                <li key={t.pledgeId} data-testid="task-row" className="rounded-2xl border border-border bg-surface p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Pledge #{t.pledgeId} · {t.itemName}</p>
                      <p className="text-xs text-text-secondary">
                        <Link to={`/admin/operations/incidents/${t.incidentId}`} className="hover:underline">{t.incidentTitle}</Link> · <Link to={`/relief/requests/${t.requestId}`} className="hover:underline">{t.requestTitle}</Link> · {t.district}
                      </p>
                      <p className="mt-1 text-xs text-text-secondary">
                        Pledged <QtyCell value={t.quantities.pledged} unit={t.unit} /> · collected <QtyCell value={t.quantities.collected} unit={t.unit} /> · verified delivered <QtyCell value={t.quantities.verifiedDelivered} unit={t.unit} />
                        {t.quantities.pendingVerification > 0 && <> · awaiting verification <QtyCell value={t.quantities.pendingVerification} unit={t.unit} /></>}
                      </p>
                      <p className="text-xs text-text-muted">{t.volunteerName ? `Volunteer: ${t.volunteerName}` : 'No volunteer assigned'}{t.assignmentMode === 'team' ? ' (team task)' : ''}{t.hoursSinceChange !== null ? ` · last change ${t.hoursSinceChange}h ago` : ''}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Pill tone={STATUS_TONE[t.pledgeStatus]}>{labelFor(PLEDGE_STATUS_LABELS, t.pledgeStatus)}</Pill>
                      {t.taskStatus && <Pill>{labelFor(TASK_STATUS_LABELS, t.taskStatus, t.taskStatus)}</Pill>}
                      {t.unassigned && <Pill tone="warning">Unassigned</Pill>}
                      {t.delayed && <Pill tone="danger">Delayed</Pill>}
                      {t.openReports > 0 && <Pill tone="danger">{t.openReports} open report{t.openReports === 1 ? '' : 's'}</Pill>}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {t.unassigned && <button type="button" className={btn} onClick={() => setDialog({ type: 'assign', task: t })}>Assign volunteer</button>}
                    {['accepted', 'scheduled', 'on_the_way'].includes(t.taskStatus) && t.assignmentMode !== 'team' && <>
                      <button type="button" className={btn} onClick={() => setDialog({ type: 'reassign', task: t })}>Reassign</button>
                      <button type="button" className={btn} onClick={() => setDialog({ type: 'release', task: t })}>Release to pool</button>
                    </>}
                    {['pledged', 'collected'].includes(t.pledgeStatus) && <button type="button" className={btn} onClick={() => setDialog({ type: 'cancel', task: t })}>Cancel task</button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
      <Pager meta={data?.meta} onPage={setPage} />
      {(dialog?.type === 'assign' || dialog?.type === 'reassign') && <VolunteerPicker task={dialog.task} mode={dialog.type} onClose={() => setDialog(null)} onDone={closeAnd} />}
      {dialog?.type === 'release' && <ConfirmDialog title="Release task" confirmLabel="Release" reasonLabel="Why is the volunteer being released? (required)" description="The task returns to the available pool and the donor is told another volunteer can accept it." onClose={() => setDialog(null)} onConfirm={act((r) => adminOpsApi.releaseTask(dialog.task.pledgeId, r), 'Task released.')} />}
      {dialog?.type === 'cancel' && <ConfirmDialog title="Cancel task and pledge" danger confirmLabel="Cancel task" reasonLabel="Reason for cancelling (required)" description="This cancels the donor's pledge and its pickup task. It is only possible while nothing has been verified as delivered." onClose={() => setDialog(null)} onConfirm={act((r) => adminOpsApi.cancelTask(dialog.task.pledgeId, r), 'Task cancelled.')} />}
    </div>
  );
}
