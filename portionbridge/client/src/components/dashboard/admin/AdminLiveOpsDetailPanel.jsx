import { X, Crown, Users, UserCheck, MapPin, Navigation as RouteIcon, Circle, Package } from 'lucide-react';
import { StatusBadge } from '../../donation/StatusBadge';

function Row({ label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary font-medium text-right">{value}</span>
    </div>
  );
}

/**
 * AdminLiveOpsDetailPanel — click-through detail for a volunteer or team
 * marker on the Phase 6 Live Operations Map. Pure presentation; all data
 * (mission, position, distance/ETA) is computed by the parent page from
 * the same REST snapshot + Socket.io state the map markers use — no
 * separate fetch happens when a marker is clicked.
 */
export function AdminLiveOpsDetailPanel({ entity, onClose }) {
  if (!entity) return null;

  const isTeam = entity.type === 'team';

  return (
    <div className="bg-surface rounded-lg border border-border/50 p-4 relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Close"
      >
        <X size={16} />
      </button>

      <div className="flex items-center gap-2.5 mb-3 pr-6">
        <div className="w-9 h-9 rounded-full bg-dash-primary-soft flex items-center justify-center shrink-0">
          {isTeam ? <Users size={16} className="text-dash-primary" /> : <UserCheck size={16} className="text-dash-primary" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">{entity.name}</p>
          <span className={`inline-flex items-center gap-1 text-[11px] ${entity.isOnline ? 'text-success' : 'text-text-secondary'}`}>
            <Circle size={7} className={entity.isOnline ? 'fill-current' : 'fill-border'} />
            {entity.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {isTeam && (
        <div className="mb-3 pb-3 border-b border-border/30">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Members</p>
          <ul className="space-y-1">
            {entity.members?.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-text-primary">
                  {m.role === 'leader' ? <Crown size={11} className="text-warning" /> : <Users size={11} className="text-text-secondary" />}
                  {m.name}
                </span>
                <span className={`flex items-center gap-1 ${m.isOnline ? 'text-success' : 'text-text-secondary'}`}>
                  <Circle size={6} className={m.isOnline ? 'fill-current' : 'fill-border'} />
                  {m.isOnline ? 'Online' : 'Offline'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {entity.mission ? (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Current Mission</p>
            <StatusBadge status={entity.mission.status} size="small" />
          </div>
          <Row label="Donation ID" value={`#${entity.mission.donationId}`} />
          <Row label="Donor" value={entity.mission.donorName} />
          <Row
            label="Pickup Location"
            value={entity.mission.pickupLocation ? (
              <span className="flex items-center gap-1 justify-end"><MapPin size={11} /> {entity.mission.pickupLocation}</span>
            ) : '—'}
          />
          <Row label="Destination / Receiver" value="Not tracked by this platform" />
          <Row
            label="Distance to Pickup"
            value={entity.distanceKm !== null && entity.distanceKm !== undefined ? `${entity.distanceKm.toFixed(1)} km` : 'Unavailable'}
          />
          <Row
            label="ETA"
            value={entity.etaMinutes !== null && entity.etaMinutes !== undefined ? `${Math.round(entity.etaMinutes)} min` : 'Unavailable'}
          />
          {!entity.hasPosition && (
            <p className="text-[11px] text-text-secondary mt-2 flex items-center gap-1">
              <RouteIcon size={11} /> No live position received yet for this mission.
            </p>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2 text-xs text-text-secondary py-2">
          <Package size={13} /> No active mission right now.
        </div>
      )}
    </div>
  );
}