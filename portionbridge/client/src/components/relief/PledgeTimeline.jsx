import { Clock } from 'lucide-react';
import { formatDateTime, formatQuantity, labelFor, REPORT_TYPE_LABELS } from '../../utils/relief';
import { ReportStatusBadge } from './TaskBadges';

const DONATION_STATUS_TEXT = {
  pending: 'Waiting for a volunteer',
  accepted: 'A volunteer accepted the pickup',
  scheduled: 'Pickup scheduled',
  on_the_way: 'Volunteer on the way',
  picked_up: 'Supplies picked up',
  completed: 'Delivery verified — task completed',
  cancelled: 'Task cancelled',
};

/**
 * Chronological history of one pledge: donation status changes plus pickup / delivery / problem
 * reports, exactly as returned by the server. `unit` formats report quantities.
 * Internal notes only appear when the server included them (administrators / the volunteer).
 */
export function PledgeTimeline({ events = [], unit }) {
  if (!events.length) return <p className="text-sm text-text-secondary">No activity yet.</p>;
  return (
    <ol className="space-y-3" aria-label="Pledge history">
      {events.map((e, i) => (
        <li key={`${e.kind}-${e.id ?? i}-${e.at}`} className="flex gap-3">
          <Clock size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-dash-primary" />
          <div className="min-w-0 text-sm">
            {e.kind === 'status' ? (
              <p className="font-medium text-text-primary">
                {labelFor(DONATION_STATUS_TEXT, e.to, e.to)}
                {e.by ? <span className="font-normal text-text-secondary"> · {e.by}</span> : null}
              </p>
            ) : (
              <>
                <p className="flex flex-wrap items-center gap-2 font-medium text-text-primary">
                  {labelFor(REPORT_TYPE_LABELS, e.type, 'Report')}
                  {e.quantity !== null && e.quantity !== undefined ? <span className="font-normal">{formatQuantity(e.quantity, unit)}</span> : null}
                  <ReportStatusBadge status={e.status} />
                </p>
                {e.verifiedQuantity !== null && e.verifiedQuantity !== undefined && e.status === 'verified' && (
                  <p className="text-xs text-text-secondary">Verified: {formatQuantity(e.verifiedQuantity, unit)}</p>
                )}
                {e.notes && <p className="mt-0.5 whitespace-pre-wrap break-words text-xs text-text-secondary">Note: {e.notes}</p>}
                {e.reviewNotes && <p className="mt-0.5 whitespace-pre-wrap break-words text-xs text-text-secondary">Review: {e.reviewNotes}</p>}
              </>
            )}
            <p className="text-xs text-text-muted">{formatDateTime(e.at)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
