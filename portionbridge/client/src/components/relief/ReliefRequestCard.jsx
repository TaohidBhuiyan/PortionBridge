import { Link } from 'react-router-dom';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { RequestStatusBadge, PriorityBadge } from './IncidentBadges';
import { ProgressBar } from './ReliefItemCard';
import { formatQuantity, formatDateTime } from '../../utils/relief';

/** Summary card for one relief request on the incident page; links to the full request. */
export function ReliefRequestCard({ request }) {
  const items = Array.isArray(request.items) ? request.items : [];
  const summary = request.summary;
  return (
    <li data-testid="relief-request-card" className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            <Link to={`/relief/requests/${request.id}`} className="hover:text-dash-primary hover:underline">{request.title || 'Relief request'}</Link>
          </h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-text-secondary"><MapPin size={12} aria-hidden="true" />{request.locationName || 'Location unavailable'}</p>
        </div>
        <div className="flex flex-wrap gap-1.5"><RequestStatusBadge status={request.status} isExpired={request.isExpired} /><PriorityBadge priority={request.priority} /></div>
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-xs text-text-muted">No supplies listed yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.slice(0, 4).map((item) => (
            <li key={item.id}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                <span className="font-medium text-text-primary">{item.name}</span>
                <span className="text-text-secondary">{formatQuantity(item.quantities?.delivered, item.unit)} of {formatQuantity(item.quantities?.requested, item.unit)} delivered</span>
              </div>
              <ProgressBar quantities={item.quantities} />
            </li>
          ))}
          {items.length > 4 && <li className="text-xs text-text-muted">+ {items.length - 4} more item{items.length - 4 === 1 ? '' : 's'}</li>}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
        <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden="true" />Updated {formatDateTime(request.updatedAt)}{summary ? ` · ${summary.fulfilledItems} of ${summary.totalItems} items fulfilled` : ''}</span>
        <Link to={`/relief/requests/${request.id}`} className="inline-flex items-center gap-0.5 font-semibold text-dash-primary hover:underline">View request <ChevronRight size={14} aria-hidden="true" /></Link>
      </div>
    </li>
  );
}
