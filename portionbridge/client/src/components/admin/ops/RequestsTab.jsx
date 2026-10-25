import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApiResource } from '../../../hooks/useApiResource';
import adminOpsApi from '../../../services/adminOpsApi';
import { ErrorState } from '../../dashboard/ErrorState';
import { EmptyState } from '../../dashboard/EmptyState';
import { Modal } from '../../common/Modal';
import { apiErrorMessage, formatDateTime, labelFor, REQUEST_STATUS_LABELS, PRIORITY_LABELS } from '../../../utils/relief';
import { Pager, Pill, Skeleton, ConfirmDialog } from './ui';
import { STATUS_TONE, btn } from './opsConstants';

const FULFILLMENT = { open: 'Open', partially_fulfilled: 'Partially fulfilled', fulfilled: 'Fulfilled', cancelled: 'Cancelled' };

function QuantityHistory({ requestId, onClose }) {
  const { data, error, loading } = useApiResource(adminOpsApi.quantityHistory, requestId);
  const rows = data?.data?.history ?? [];
  return (
    <Modal title={`Quantity history · request #${requestId}`} onClose={onClose} maxWidth="max-w-2xl">
      {loading ? <Skeleton label="Loading history" /> : error ? <p role="alert" className="text-sm text-danger">{apiErrorMessage(error)}</p>
        : rows.length === 0 ? <p className="text-sm text-text-muted">No quantity changes were recorded for this request.</p> : (
          <ul className="space-y-2 text-sm">{rows.map((h) => (
            <li key={h.id} className="rounded-xl border border-border p-2.5">
              <p className="font-semibold text-text-primary">{h.itemName} ({h.unit}) · {h.changeType.replace('_', ' ')}</p>
              <p className="text-xs text-text-secondary">{h.oldQuantity ?? '—'} → {h.newQuantity ?? '—'} · request was {h.requestStatus}</p>
              <p className="text-xs text-text-muted">{h.reason || 'No reason recorded'} · {h.actorName || 'unknown'} · {formatDateTime(h.createdAt)}</p>
            </li>))}</ul>
        )}
    </Modal>
  );
}

export function RequestsTab({ filters, preset }) {
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null); // { type, request }
  const params = { ...filters, ...(preset.requestStatus ? { requestStatus: preset.requestStatus } : {}), unfulfilled: preset.unfulfilled, needsReassessment: preset.needsReassessment, page, limit: 15 };
  const { data, error, loading, reload } = useApiResource(adminOpsApi.requests, params);
  const list = data?.data?.requests ?? [];
  const act = (fn, msg) => async (reason) => { await fn(reason); toast.success(msg); reload(); };

  return (
    <div className="space-y-3">
      {loading ? <Skeleton label="Loading relief requests" /> : error ? <ErrorState title="Could not load relief requests" message={apiErrorMessage(error)} onRetry={reload} />
        : list.length === 0 ? <EmptyState title="No relief requests match" description="Change the filters to see other requests." />
          : (
            <ul className="space-y-2">
              {list.map((r) => (
                <li key={r.id} data-testid="request-row" className="rounded-2xl border border-border bg-surface p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link to={`/relief/requests/${r.id}`} className="text-sm font-semibold text-dash-primary hover:underline">{r.title}</Link>
                      <p className="text-xs text-text-secondary">
                        <Link to={`/admin/operations/incidents/${r.incidentId}`} className="hover:underline">{r.incidentTitle}</Link> · {r.locationName} · {labelFor(PRIORITY_LABELS, r.priority)} priority
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Pill tone={STATUS_TONE[r.status]}>{labelFor(REQUEST_STATUS_LABELS, r.status)}</Pill>
                      {r.status === 'approved' && <Pill tone={r.fulfillmentState === 'fulfilled' ? 'success' : 'info'}>{FULFILLMENT[r.fulfillmentState]} ({r.fulfilledItems}/{r.totalItems} items)</Pill>}
                      {r.reassessment.map((x) => <Pill key={x.code} tone="warning">Reassess: {x.text}</Pill>)}
                      {r.correctionRequestedAt && <Pill tone="warning">Correction requested</Pill>}
                    </div>
                  </div>
                  {r.correctionNote && <p className="mt-1 text-xs text-text-muted">Correction note: {r.correctionNote}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.status === 'pending_review' && <>
                      <button type="button" className={btn} onClick={() => setDialog({ type: 'approve', request: r })}>Approve</button>
                      <button type="button" className={btn} onClick={() => setDialog({ type: 'reject', request: r })}>Reject</button>
                      <button type="button" className={btn} onClick={() => setDialog({ type: 'correction', request: r })}>Request correction</button>
                    </>}
                    {['approved', 'pending_review'].includes(r.status) && !r.reassessment.some((x) => x.code === 'flagged') && <button type="button" className={btn} onClick={() => setDialog({ type: 'flag', request: r })}>Flag for reassessment</button>}
                    {r.reassessment.some((x) => x.code === 'flagged') && <button type="button" className={btn} onClick={() => setDialog({ type: 'clear', request: r })}>Clear reassessment flag</button>}
                    <button type="button" className={btn} onClick={() => setDialog({ type: 'history', request: r })}>Quantity history</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
      <Pager meta={data?.meta} onPage={setPage} />

      {dialog?.type === 'approve' && <ConfirmDialog title="Approve relief request" confirmLabel="Approve" description={`Approving "${dialog.request.title}" opens it for donor pledges. Quantities stay exactly as submitted.`} onClose={() => setDialog(null)} onConfirm={act(() => adminOpsApi.setRequestStatus(dialog.request.id, 'approved'), 'Request approved.')} />}
      {dialog?.type === 'reject' && <ConfirmDialog title="Reject relief request" danger confirmLabel="Reject" reasonLabel="Reason for rejecting (required)" onClose={() => setDialog(null)} onConfirm={act((reason) => adminOpsApi.setRequestStatus(dialog.request.id, 'rejected', reason), 'Request rejected.')} />}
      {dialog?.type === 'correction' && <ConfirmDialog title="Request a correction" confirmLabel="Send request" reasonLabel="What needs to be corrected? (sent to the requester)" onClose={() => setDialog(null)} onConfirm={act((note) => adminOpsApi.requestCorrection(dialog.request.id, note), 'Correction requested.')} />}
      {dialog?.type === 'flag' && <ConfirmDialog title="Flag for reassessment" confirmLabel="Flag" reasonLabel="Why do conditions need to be reassessed? (required)" onClose={() => setDialog(null)} onConfirm={act((reason) => adminOpsApi.flagReassessment(dialog.request.id, reason), 'Request flagged.')} />}
      {dialog?.type === 'clear' && <ConfirmDialog title="Clear reassessment flag" confirmLabel="Clear flag" description="Confirm the request has been reassessed." onClose={() => setDialog(null)} onConfirm={act(() => adminOpsApi.clearReassessment(dialog.request.id), 'Flag cleared.')} />}
      {dialog?.type === 'history' && <QuantityHistory requestId={dialog.request.id} onClose={() => setDialog(null)} />}
    </div>
  );
}
