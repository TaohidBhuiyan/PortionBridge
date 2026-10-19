import { Link } from 'react-router-dom';
import { MapPin, MapPinOff, Clock, Navigation, Radar } from 'lucide-react';
import { EmptyState } from '../dashboard/EmptyState';
import { ErrorState } from '../dashboard/ErrorState';
import { TypeBadge, SeverityBadge, IncidentStatusBadge, VerificationBadge } from './IncidentBadges';
import { hasMapLocation, formatDateTime, apiErrorMessage } from '../../utils/relief';

function IncidentSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-2xl border border-border bg-surface p-4" aria-hidden="true">
      <div className="h-4 w-2/3 rounded bg-surface-hover" />
      <div className="flex gap-2"><div className="h-5 w-16 rounded-full bg-surface-hover" /><div className="h-5 w-20 rounded-full bg-surface-hover" /></div>
      <div className="h-3 w-1/2 rounded bg-surface-hover" />
    </div>
  );
}

export function IncidentListSkeleton({ count = 4 }) {
  return (
    <div role="status" aria-label="Loading incidents" className="space-y-3">
      {Array.from({ length: count }, (_, i) => <IncidentSkeleton key={i} />)}
    </div>
  );
}

function IncidentCard({ incident, selected, onSelect, distanceKm }) {
  const onMap = hasMapLocation(incident);
  const place = [incident.district, incident.affectedArea].filter(Boolean).join(' · ');
  return (
    <article
      data-testid="incident-card"
      aria-current={selected ? 'true' : undefined}
      className={`rounded-2xl border bg-surface p-4 transition-colors ${selected ? 'border-dash-primary ring-2 ring-dash-primary/25' : 'border-border hover:bg-surface-hover'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug text-text-primary">
          <Link to={`/relief/incidents/${incident.id}`} className="hover:text-dash-primary hover:underline focus-visible:outline-2 focus-visible:outline-dash-primary">
            {incident.title || 'Untitled incident'}
          </Link>
        </h3>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <TypeBadge type={incident.disasterType} />
        <SeverityBadge severity={incident.severity} />
        <IncidentStatusBadge status={incident.status} isVerified={incident.isVerified} />
        <VerificationBadge isVerified={incident.isVerified} />
      </div>
      {place && <p className="mt-2 flex items-center gap-1 text-xs text-text-secondary"><MapPin size={12} aria-hidden="true" />{place}</p>}
      {incident.description && <p className="mt-2 line-clamp-2 text-xs text-text-secondary">{incident.description}</p>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
        <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden="true" />Updated {formatDateTime(incident.updatedAt || incident.createdAt)}</span>
        <span className="inline-flex items-center gap-2">
          {typeof distanceKm === 'number' && <span className="inline-flex items-center gap-1 font-medium text-dash-primary"><Navigation size={12} aria-hidden="true" />{distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)} km away</span>}
          {onMap ? (
            <button type="button" onClick={() => onSelect(incident.id)} className="rounded-md px-2 py-1 font-semibold text-dash-primary hover:bg-dash-primary-soft focus-visible:outline-2 focus-visible:outline-dash-primary">
              Show on map
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-hover px-2 py-0.5 font-medium text-text-secondary"><MapPinOff size={12} aria-hidden="true" />No map location</span>
          )}
        </span>
      </div>
    </article>
  );
}

/**
 * Incident list with explicit loading / error / empty states. Incidents without
 * coordinates are always listed (flagged "No map location") — never dropped.
 */
export function IncidentList({ incidents, loading, error, onRetry, selectedId, onSelect, distances, onClearFilters, hasFilters, emptyMessage }) {
  if (loading) return <IncidentListSkeleton />;
  if (error) return <ErrorState title="Could not load incidents" message={apiErrorMessage(error)} onRetry={onRetry} size="small" />;
  if (!incidents || incidents.length === 0) {
    return (
      <EmptyState
        icon={Radar}
        title="No incidents match"
        description={emptyMessage || (hasFilters ? 'Try widening the filters or clearing the search.' : 'There are no active, verified incidents to show right now.')}
        actionLabel="Clear filters"
        onAction={onClearFilters}
        showAction={Boolean(hasFilters && onClearFilters)}
        size="small"
      />
    );
  }
  return (
    <div className="space-y-3">
      {incidents.map((incident) => (
        <IncidentCard key={incident.id} incident={incident} selected={incident.id === selectedId} onSelect={onSelect} distanceKm={distances ? distances.get(incident.id) : undefined} />
      ))}
    </div>
  );
}
