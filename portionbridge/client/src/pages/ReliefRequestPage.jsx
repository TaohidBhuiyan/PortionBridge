import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Building2, Hourglass, Info, Package } from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { RequestStatusBadge, PriorityBadge } from '../components/relief/IncidentBadges';
import { ReliefItemCard } from '../components/relief/ReliefItemCard';
import { PledgeDialog } from '../components/relief/PledgeDialog';
import { useAuth } from '../context/AuthContext';
import { useApiResource } from '../hooks/useApiResource';
import reliefApi from '../services/reliefApi';
import { apiErrorMessage, formatDateTime } from '../utils/relief';

function SummaryTile({ label, value }) {
  return (
    <div className="rounded-xl bg-surface-hover px-3 py-2 text-center">
      <p className="text-lg font-bold text-text-primary">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">{label}</p>
    </div>
  );
}

export function ReliefRequestPage() {
  const { id } = useParams();
  const requestId = Number(id);
  const validId = Number.isInteger(requestId) && requestId > 0;
  const { user } = useAuth();
  const { data, error, loading, reload } = useApiResource(reliefApi.getRequest, validId ? requestId : null, { enabled: validId });
  const request = data?.data?.request;
  const [pledging, setPledging] = useState(null); // the item being pledged
  const [pledged, setPledged] = useState(false);
  const isDonor = user?.role === 'donor';
  // Only donors can pledge, only against an approved, unexpired request — the server enforces the same rules.
  const canPledge = isDonor && request?.status === 'approved' && !request?.isExpired;
  const incidentState = useApiResource(reliefApi.getIncident, request ? request.incidentId : null, { enabled: Boolean(canPledge) });
  const incident = incidentState.data?.data?.incident;
  const items = request?.items ?? [];
  const summary = request?.summary;

  return (
    <DashboardLayout>
      <main className="mx-auto text-left max-w-4xl space-y-5 pb-8">
        <Link to={request ? `/relief/incidents/${request.incidentId}` : '/relief'} className="inline-flex items-center gap-1 text-sm font-medium text-dash-primary hover:underline">
          <ArrowLeft size={16} aria-hidden="true" />{request ? 'Back to incident' : 'All disasters'}
        </Link>

        {!validId && <ErrorState title="Invalid link" message="This relief request link is not valid." showRetry={false} />}
        {validId && loading && <div role="status" aria-label="Loading relief request" className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />}
        {validId && error && <ErrorState title="Could not load this relief request" message={apiErrorMessage(error)} onRetry={reload} showRetry={error?.response?.status !== 404} />}

        {request && (
          <>
            <header className="space-y-3">
              <h1 className="text-2xl font-bold leading-tight text-text-primary">{request.title || 'Relief request'}</h1>
              <div className="flex flex-wrap gap-1.5"><RequestStatusBadge status={request.status} isExpired={request.isExpired} /><PriorityBadge priority={request.priority} /></div>
              <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-text-secondary">
                <li className="inline-flex items-center gap-1.5"><MapPin size={14} aria-hidden="true" />{request.locationName || 'Location unavailable'}</li>
                {request.requestingOrganization && <li className="inline-flex items-center gap-1.5"><Building2 size={14} aria-hidden="true" />{request.requestingOrganization}</li>}
                <li className="inline-flex items-center gap-1.5"><Clock size={14} aria-hidden="true" />Last updated {formatDateTime(request.updatedAt)}</li>
                {request.expiresAt && <li className="inline-flex items-center gap-1.5"><Hourglass size={14} aria-hidden="true" />{request.isExpired ? 'Expired' : 'Needed by'} {formatDateTime(request.expiresAt)}</li>}
              </ul>
              {request.description && <p className="whitespace-pre-wrap break-words text-sm text-text-secondary">{request.description}</p>}
              {request.address && <p className="text-xs text-text-muted">Delivery address (visible to you only): {request.address}</p>}
              {request.reviewNotes && <p className="text-xs text-text-muted">Review notes: {request.reviewNotes}</p>}
            </header>

            {summary && (
              <section aria-label="Request progress" className="rounded-2xl border border-border bg-surface p-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <SummaryTile label="Items" value={summary.totalItems} />
                  <SummaryTile label="Fulfilled" value={summary.fulfilledItems} />
                  <SummaryTile label="Partly delivered" value={summary.partiallyDeliveredItems} />
                  <SummaryTile label="Not started" value={summary.openItems} />
                </div>
              </section>
            )}

            <section aria-labelledby="needs-heading" className="space-y-3">
              <h2 id="needs-heading" className="text-lg font-semibold text-text-primary">Supplies needed</h2>
              {items.length === 0 ? (
                <EmptyState icon={Package} title="No supplies listed" description="No items are currently listed for this request." showAction={false} size="small" />
              ) : (
                <ul className="space-y-3">{items.map((item) => <ReliefItemCard key={item.id} item={item} onPledge={canPledge ? setPledging : undefined} />)}</ul>
              )}
            </section>

            <section aria-label="How to read these numbers" className="flex gap-3 rounded-2xl border border-border bg-surface p-4 text-xs text-text-secondary">
              <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-dash-primary" />
              <div className="space-y-1">
                <p><strong className="text-text-primary">Pledged</strong> supplies are promised by donors but have <em>not</em> been delivered yet. <strong className="text-text-primary">Delivered</strong> supplies have reached the location.</p>
                <p><strong className="text-text-primary">Still needed</strong> is the required quantity minus what has been delivered; <strong className="text-text-primary">open to pledge</strong> is what no donor has promised yet. The progress bar’s solid part is delivered only.</p>
                <p>{isDonor ? 'Choose an item above to pledge. Your pledge is a promise until a volunteer delivers it and an administrator verifies it.' : 'Donors can pledge supplies from this page.'}</p>
              </div>
            </section>
          </>
        )}
        {pledged && (
          <p role="status" className="rounded-xl bg-success-soft px-4 py-3 text-sm text-text-primary">
            Your pledge was recorded. <Link to="/donor/relief-pledges" className="font-semibold text-dash-primary hover:underline">View My Relief Pledges</Link>
          </p>
        )}
        {pledging && (
          <PledgeDialog
            item={pledging}
            request={request}
            incident={incident}
            onClose={() => setPledging(null)}
            onPledged={() => { setPledged(true); reload(); }}
            onStale={reload}
          />
        )}
      </main>
    </DashboardLayout>
  );
}

export default ReliefRequestPage;
