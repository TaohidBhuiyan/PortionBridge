import { useState, useMemo } from 'react';
import { Navigation, MapPin, Users, Crown, Circle, AlertCircle, LocateFixed } from 'lucide-react';
import VolunteerMap from '../donor/VolunteerMap';
import { StatusBadge } from '../../donation/StatusBadge';
import { useAuth } from '../../../context/AuthContext';
import { useDonationTracking, calculateETA, formatETA } from '../../../hooks/useDonationTracking';
import { useLiveLocationSharing } from '../../../hooks/useLiveLocationSharing';
import { haversineDistanceKm } from '../../../utils/geo';

const TRACKABLE_STATUSES = new Set(['accepted', 'scheduled', 'on_the_way', 'picked_up']);

/**
 * MissionMap — the volunteer's live "My Mission" map (Phase 5).
 *
 * Built entirely on existing infrastructure: VolunteerMap.jsx (extended
 * this phase with generic `markers`/`routeLine` props, same component the
 * donor discovery view already uses), LocationPermission.jsx (unchanged,
 * same donor-facing permission modal), useDonationTracking.js (unchanged
 * — room join/leave + real-time status/location listening, reused as-is),
 * and the new useLiveLocationSharing.js hook (geolocation watch + throttled
 * emit over the same room).
 *
 * @param {Object} mission - Assignment detail from volunteerApi.getAssignmentDetail
 *   (donation fields + donor_name/donor_phone/pickup_latitude/pickup_longitude/team)
 * @param {Function} [onStatusChange] - Called with the new status when a
 *   real-time 'donation_status_updated' event arrives, so the parent page
 *   can refresh (e.g. ActiveMissionCard) without a full reload
 */
export function MissionMap({ mission, onStatusChange }) {
  const { user } = useAuth();
  const [teammateLocation, setTeammateLocation] = useState(null);

  const isTeamMode = mission.assignment_mode === 'team' && mission.team;
  // The one person whose GPS should actually be shared for this specific
  // mission — the assigned team member if this is a team-mode donation,
  // otherwise the individually assigned volunteer. This is the same
  // authorization boundary tracking.handler.js#share_volunteer_location
  // enforces server-side; the frontend just needs to know it to decide
  // whose position to render as "the volunteer".
  const assignedPersonId = isTeamMode ? mission.assigned_member_id : mission.volunteer_id;
  const isMeSharing = user?.id === assignedPersonId;

  useDonationTracking(mission.id, {
    onStatusUpdate: (data) => {
      if (data?.status) {
        onStatusChange?.(data.status);
      }
    },
    onLocationUpdate: (data) => {
      // Only relevant when someone ELSE is sharing (e.g. a team leader
      // viewing the assigned member's live position) — if it's my own
      // update coming back through the socket, useLiveLocationSharing's
      // local geolocation state is already more current than this
      // round-tripped copy.
      if (!isMeSharing && data?.latitude && data?.longitude) {
        setTeammateLocation({ latitude: data.latitude, longitude: data.longitude });
      }
    },
  });

  const isTrackable = TRACKABLE_STATUSES.has(mission.status);
  const { sharing, permission, error: locationError, currentPosition, requestPermissionAndStart } =
    useLiveLocationSharing(mission.id, mission.status, isTrackable && isMeSharing);

  const volunteerPosition = isMeSharing ? currentPosition : teammateLocation;

  const hasPickupCoords = typeof mission.pickup_latitude === 'number' && typeof mission.pickup_longitude === 'number';

  const distanceKm = useMemo(() => {
    if (!volunteerPosition || !hasPickupCoords) return null;
    return haversineDistanceKm(
      volunteerPosition.latitude, volunteerPosition.longitude,
      mission.pickup_latitude, mission.pickup_longitude
    );
  }, [volunteerPosition, hasPickupCoords, mission.pickup_latitude, mission.pickup_longitude]);

  const etaMinutes = distanceKm !== null ? calculateETA(distanceKm) : null;

  const markers = hasPickupCoords ? [{
    id: 'pickup',
    latitude: mission.pickup_latitude,
    longitude: mission.pickup_longitude,
    color: '#f97316',
    emoji: '📦',
    popupHtml: `<strong>Pickup</strong><br/>${mission.donor_name || 'Donor'}${mission.pickup_full_address ? `<br/>${mission.pickup_full_address}` : ''}`,
  }] : [];

  const routeLine = (volunteerPosition && hasPickupCoords) ? {
    points: [
      [volunteerPosition.latitude, volunteerPosition.longitude],
      [mission.pickup_latitude, mission.pickup_longitude],
    ],
    color: '#3b82f6',
  } : null;

  const navigateTo = (lat, lng, address) => {
    const url = (typeof lat === 'number' && typeof lng === 'number')
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address || '')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isTrackable) {
    return (
      <div className="bg-surface rounded-lg border border-border/50 p-6 text-center">
        <p className="text-sm text-text-secondary">
          The live mission map is only available while this donation is accepted, scheduled, on the way, or picked up.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status + distance/ETA */}
      <div className="bg-surface rounded-lg border border-border/50 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-secondary">Status:</span>
          <StatusBadge status={mission.status} />
        </div>
        {distanceKm !== null ? (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-text-secondary">
              <span className="font-semibold text-text-primary">{distanceKm.toFixed(1)} km</span> to pickup (straight-line)
            </span>
            <span className="text-text-secondary">
              ETA <span className="font-semibold text-text-primary">{formatETA(etaMinutes)}</span>
            </span>
          </div>
        ) : (
          <span className="text-xs text-text-secondary">
            {hasPickupCoords ? 'Waiting for your location to calculate distance...' : 'Pickup location has no exact coordinates — distance unavailable.'}
          </span>
        )}
      </div>

      {/* Location permission / sharing state */}
      {isMeSharing && permission !== 'granted' && (
        <div className="bg-warning-soft border border-warning/30 rounded-lg p-4 flex items-start gap-3">
          <LocateFixed size={18} className="text-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">Share your location for this mission</p>
            <p className="text-xs text-text-secondary mt-0.5">
              The donor will see your live position on their tracking view while this pickup is in progress.
            </p>
            {permission === 'denied' && (
              <p className="text-xs text-danger mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> Location permission was denied. Enable it in your browser settings to share your position.
              </p>
            )}
            {locationError && <p className="text-xs text-danger mt-1">{locationError}</p>}
          </div>
          {permission !== 'denied' && (
            <button
              onClick={requestPermissionAndStart}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-dash-primary text-white text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Start Sharing
            </button>
          )}
        </div>
      )}
      {isMeSharing && sharing && (
        <div className="flex items-center gap-2 text-xs text-success px-1">
          <Circle size={8} className="fill-current animate-pulse" /> Sharing your live location
        </div>
      )}
      {!isMeSharing && isTeamMode && (
        <div className="flex items-center gap-2 text-xs text-text-secondary px-1">
          <Circle size={8} className={teammateLocation ? 'fill-success text-success' : 'fill-border text-border'} />
          {teammateLocation ? 'Showing live location from the assigned team member' : 'Waiting for the assigned team member to share their location'}
        </div>
      )}

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-border/50">
        <VolunteerMap
          userLocation={volunteerPosition}
          markers={markers}
          routeLine={routeLine}
          className="h-80"
        />
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => navigateTo(mission.pickup_latitude, mission.pickup_longitude, mission.pickup_location)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-dash-primary text-white text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Navigation size={13} /> Navigate to Donor
        </button>
        <button
          disabled
          title="No receiver location is tracked by this platform — the volunteer hands off donations directly after pickup."
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-border/50 text-text-secondary text-xs font-medium cursor-not-allowed opacity-60"
        >
          <MapPin size={13} /> Navigate to Receiver
        </button>
      </div>

      {/* Team panel */}
      {isTeamMode && (
        <div className="bg-surface rounded-lg border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-dash-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Team</h3>
          </div>
          <ul className="space-y-2">
            {mission.team.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {m.role === 'leader' ? <Crown size={13} className="text-warning" /> : <Users size={13} className="text-text-secondary" />}
                  <span className="text-text-primary">{m.name}</span>
                  {m.id === assignedPersonId && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-dash-primary-soft text-dash-primary font-medium">On this mission</span>
                  )}
                </div>
                <span className={`flex items-center gap-1 text-xs ${m.isOnline ? 'text-success' : 'text-text-secondary'}`}>
                  <Circle size={7} className={m.isOnline ? 'fill-current' : 'fill-border'} />
                  {m.isOnline ? 'Online' : 'Offline'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}