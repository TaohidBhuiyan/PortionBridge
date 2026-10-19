import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, ShieldQuestion, MapPinOff, ExternalLink, Package } from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { DisasterMap } from '../components/relief/DisasterMap';
import { TypeBadge, SeverityBadge, IncidentStatusBadge, VerificationBadge } from '../components/relief/IncidentBadges';
import { ReliefRequestCard } from '../components/relief/ReliefRequestCard';
import { useApiResource } from '../hooks/useApiResource';
import reliefApi from '../services/reliefApi';
import {
  SOURCE_TYPE_LABELS, apiErrorMessage, formatDateTime, hasMapLocation, labelFor, safeHttpUrl, typeLabel,
} from '../utils/relief';

// module-level so the fetcher identity is stable across renders (useApiResource re-fetches when it changes)
const fetchIncidentRequests = (params) => reliefApi.listIncidentRequests(params.id, { limit: 50 });

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-text-primary">{children || <span className="text-text-muted">Unavailable</span>}</dd>
    </div>
  );
}

function VerificationBanner({ incident }) {
  if (incident.isVerified === true) {
    return (
      <div role="status" className="flex items-start gap-3 rounded-2xl border border-border bg-success-soft p-4 text-sm text-text-primary">
        <ShieldCheck size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-success" />
        <p><strong>Verified.</strong> An administrator has confirmed this incident{incident.verifiedAt ? ` on ${formatDateTime(incident.verifiedAt)}` : ''}.</p>
      </div>
    );
  }
  return (
    <div role="status" className="flex items-start gap-3 rounded-2xl border border-border bg-warning-soft p-4 text-sm text-text-primary">
      <ShieldQuestion size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-warning" />
      <p><strong>Not verified.</strong> This is a report that has not been confirmed by an administrator. Details may be incomplete or change.</p>
    </div>
  );
}

function RequestsSection({ state }) {
  const { data, error, loading, reload } = state;
  if (loading) {
    return <div role="status" aria-label="Loading relief requests" className="h-28 animate-pulse rounded-2xl border border-border bg-surface" />;
  }
  if (error) return <ErrorState title="Could not load relief requests" message={apiErrorMessage(error)} onRetry={reload} size="small" />;
  const requests = data?.data?.requests ?? [];
  if (requests.length === 0) {
    return <EmptyState icon={Package} title="No verified relief requests yet" description="Relief requests appear here once they have been reviewed and approved." showAction={false} size="small" />;
  }
  return <ul className="space-y-3">{requests.map((r) => <ReliefRequestCard key={r.id} request={r} />)}</ul>;
}

export function DisasterIncidentPage() {
  const { id } = useParams();
  const incidentId = Number(id);
  const validId = Number.isInteger(incidentId) && incidentId > 0;

  const incidentState = useApiResource(reliefApi.getIncident, validId ? incidentId : null, { enabled: validId });
  const incident = incidentState.data?.data?.incident;
  const requestsState = useApiResource(
    fetchIncidentRequests,
    { id: incidentId },
    { enabled: validId && Boolean(incident) }
  );

  const sourceUrl = safeHttpUrl(incident?.sourceReference);

  return (
    <DashboardLayout>
      <main className="mx-auto text-left max-w-5xl space-y-5 pb-8">
        <Link to="/relief" className="inline-flex items-center gap-1 text-sm font-medium text-dash-primary hover:underline"><ArrowLeft size={16} aria-hidden="true" />All disasters</Link>

        {!validId && <ErrorState title="Invalid link" message="This incident link is not valid." showRetry={false} />}
        {validId && incidentState.loading && <div role="status" aria-label="Loading incident" className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />}
        {validId && incidentState.error && <ErrorState title="Could not load this incident" message={apiErrorMessage(incidentState.error)} onRetry={incidentState.reload} showRetry={incidentState.error?.response?.status !== 404} />}

        {incident && (
          <>
            <header className="space-y-3">
              <h1 className="text-2xl font-bold leading-tight text-text-primary">{incident.title || 'Untitled incident'}</h1>
              <div className="flex flex-wrap gap-1.5">
                <TypeBadge type={incident.disasterType} />
                <SeverityBadge severity={incident.severity} />
                <IncidentStatusBadge status={incident.status} isVerified={incident.isVerified} />
                <VerificationBadge isVerified={incident.isVerified} />
              </div>
            </header>

            <VerificationBanner incident={incident} />

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
              <section aria-label="Incident details" className="space-y-5 rounded-2xl border border-border bg-surface p-5">
                <div>
                  <h2 className="mb-1 text-sm font-semibold text-text-primary">What happened</h2>
                  {/* rendered as plain text by React — never as HTML */}
                  <p className="whitespace-pre-wrap break-words text-sm text-text-secondary">{incident.description || 'No description has been provided.'}</p>
                </div>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Detail label="Disaster type">{typeLabel(incident.disasterType)}</Detail>
                  <Detail label="Status">{labelFor({ reported: 'Reported', under_review: 'Under review', verified: 'Verified', active: 'Active', resolved: 'Resolved', rejected: 'Rejected' }, incident.status)}</Detail>
                  <Detail label="District">{incident.district}</Detail>
                  <Detail label="Affected area">{incident.affectedArea}</Detail>
                  <Detail label="Reported">{formatDateTime(incident.createdAt)}</Detail>
                  <Detail label="Last updated">{formatDateTime(incident.updatedAt)}</Detail>
                  {incident.verifiedAt && <Detail label="Verified on">{formatDateTime(incident.verifiedAt)}</Detail>}
                  {incident.resolvedAt && <Detail label="Resolved on">{formatDateTime(incident.resolvedAt)}</Detail>}
                  <Detail label="Source type">{labelFor(SOURCE_TYPE_LABELS, incident.sourceType)}</Detail>
                  {incident.address && <Detail label="Address (visible to you only)">{incident.address}</Detail>}
                </dl>
                <p className="text-xs text-text-muted">Upazila is not recorded separately yet; the affected area above is what was reported.</p>
              </section>

              <aside className="space-y-4" aria-label="Location">
                <div className="h-72 lg:h-80">
                  {hasMapLocation(incident) ? (
                    <DisasterMap incidents={[incident]} selectedId={incident.id} />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface p-4 text-center text-sm text-text-secondary">
                      <MapPinOff size={28} aria-hidden="true" className="text-text-muted" />
                      No map location was provided for this incident.
                    </div>
                  )}
                </div>
                {hasMapLocation(incident) && incident.coordinatesApproximate && <p className="text-xs text-text-muted">The marker shows an approximate area (about 1 km), not an exact address.</p>}
              </aside>
            </div>

            {(incident.sourceReference || incident.verificationNotes || incident.reporterName || incident.verifierName) && (
              <section aria-label="Moderation details" className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="mb-3 text-sm font-semibold text-text-primary">Moderation details <span className="font-normal text-text-muted">(administrators only)</span></h2>
                <dl className="grid gap-4 sm:grid-cols-2">
                  {incident.reporterName && <Detail label="Reported by">{incident.reporterName}</Detail>}
                  {incident.verifierName && <Detail label="Reviewed by">{incident.verifierName}</Detail>}
                  {incident.sourceReference && (
                    <Detail label="Source reference">
                      {sourceUrl ? (
                        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-dash-primary hover:underline">{sourceUrl}<ExternalLink size={12} aria-hidden="true" /></a>
                      ) : <span className="break-words">{incident.sourceReference}</span>}
                    </Detail>
                  )}
                  {incident.verificationNotes && <Detail label="Review notes"><span className="whitespace-pre-wrap break-words">{incident.verificationNotes}</span></Detail>}
                </dl>
              </section>
            )}

            <section aria-labelledby="relief-requests-heading" className="space-y-3">
              <h2 id="relief-requests-heading" className="text-lg font-semibold text-text-primary">Relief requests</h2>
              <RequestsSection state={requestsState} />
              <p className="text-xs text-text-muted">Open a request to see exactly what is still needed and, as a donor, pledge supplies. Delivered quantities are counted only after an administrator verifies them.</p>
            </section>
          </>
        )}
      </main>
    </DashboardLayout>
  );
}

export default DisasterIncidentPage;
