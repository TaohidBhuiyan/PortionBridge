import { useMemo } from 'react';
import { MapPin, Clock, AlertCircle, Navigation, Radio, LocateFixed, Circle, AlertTriangle } from 'lucide-react';
import VolunteerMap from '../dashboard/donor/VolunteerMap';
import { useLiveLocationSharing } from '../../hooks/useLiveLocationSharing';
import { haversineDistanceKm } from '../../utils/geo';
import { calculateETA, formatETA } from '../../hooks/useDonationTracking';

/**
 * TrackingPanel — shows live pickup tracking using real location updates.
 *
 * Donor view  → shows the volunteer's live GPS pin on the map.
 * Volunteer view → shows the donor's pickup pin + a route line from the
 *   volunteer's own GPS to that pin, plus a "Navigate" button to open
 *   Google Maps turn-by-turn directions.
 */
export function TrackingPanel({ donation, volunteer, volunteerLocation, isVolunteer = false, currentUserId }) {

  const isAssignedVolunteer = isVolunteer && (
    donation?.assignment_mode === 'team'
      ? donation?.assigned_member_id === currentUserId
      : donation?.volunteer_id === currentUserId
  );

  const TRACKABLE_STATUSES = new Set(['accepted', 'scheduled', 'on_the_way', 'picked_up']);
  const isTrackable = TRACKABLE_STATUSES.has(donation?.status);

  // Live location sharing — only for the assigned volunteer
  const { sharing, permission, error: locationError, currentPosition, requestPermissionAndStart } =
    useLiveLocationSharing(
      donation?.id,
      donation?.status,
      isTrackable && isAssignedVolunteer
    );

  // pickup_latitude/pickup_longitude comes from volunteerApi.getAssignmentDetail;
  // when viewing via DonationDetailsPage, coords live in pickup_address_details JSON.
  const _rawLat = donation?.pickup_latitude ?? donation?.pickup_address_details?.latitude;
  const _rawLng = donation?.pickup_longitude ?? donation?.pickup_address_details?.longitude;
  // pickup_address_details stores coordinates as strings (JSON); parseFloat handles both
  const pickupLat = _rawLat !== undefined && _rawLat !== null ? parseFloat(_rawLat) : null;
  const pickupLng = _rawLng !== undefined && _rawLng !== null ? parseFloat(_rawLng) : null;
  const hasPickupCoords =
    pickupLat !== null && !isNaN(pickupLat) &&
    pickupLng !== null && !isNaN(pickupLng);

  // For volunteer view: distance from volunteer GPS to donor pickup
  const distanceKm = useMemo(() => {
    if (!isAssignedVolunteer || !currentPosition || !hasPickupCoords) return null;
    return haversineDistanceKm(
      currentPosition.latitude, currentPosition.longitude,
      pickupLat, pickupLng
    );
  }, [isAssignedVolunteer, currentPosition, hasPickupCoords, pickupLat, pickupLng]);

  const etaMinutes = distanceKm !== null ? calculateETA(distanceKm) : null;

  // Pickup location marker for the map (shown to the volunteer)
  const pickupMarkers = hasPickupCoords ? [{
    id: 'pickup',
    latitude: pickupLat,
    longitude: pickupLng,
    color: '#f97316',
    emoji: '📦',
    popupHtml: `<strong>Pickup Location</strong><br/>${donation.pickup_location || 'Donor address'}`,
  }] : [];

  // Route line: volunteer's live GPS → donor's pickup coords
  const routeLine = (currentPosition && hasPickupCoords) ? {
    points: [
      [currentPosition.latitude, currentPosition.longitude],
      [pickupLat, pickupLng],
    ],
    color: '#3b82f6',
  } : null;

  const navigateToDonor = () => {
    const lat = pickupLat;
    const lng = pickupLng;
    const addr = donation?.pickup_location;
    const url = (typeof lat === 'number' && typeof lng === 'number')
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr || '')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getStatusMessage = () => {
    switch (donation?.status) {
      case 'scheduled':  return 'Pickup scheduled';
      case 'on_the_way': return 'Volunteer is on the way';
      case 'picked_up':  return 'Donation picked up';
      case 'completed':  return 'Pickup completed';
      default:           return 'Waiting for volunteer';
    }
  };

  const getStatusTone = () => {
    switch (donation?.status) {
      case 'on_the_way':  return 'text-dash-primary';
      case 'picked_up':
      case 'completed':   return 'text-success';
      default:            return 'text-text-secondary';
    }
  };

  // ── Empty / terminal states ────────────────────────────────────────────

  if (!volunteer && donation?.status === 'pending') {
    return (
      <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-page/60 border border-dashed border-border text-text-secondary text-xs">
        <AlertCircle size={16} className="text-warning shrink-0" />
        <p>Waiting for volunteer assignment to begin live tracking.</p>
      </div>
    );
  }

  if (donation?.status === 'completed') {
    return (
      <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-success-soft/50 border border-success/20 text-success text-xs font-medium">
        <MapPin size={16} className="shrink-0" />
        <p>Pickup completed successfully.</p>
      </div>
    );
  }

  // ── VOLUNTEER VIEW ──────────────────────────────────────────────────────
  if (isAssignedVolunteer) {
    return (
      <div className="space-y-3.5">
        {/* Status header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <span className={`text-xs font-bold uppercase tracking-wider ${getStatusTone()}`}>
            {getStatusMessage()}
          </span>
          {sharing && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success-soft text-success text-[10px] font-bold uppercase tracking-wider">
              <Circle size={8} className="fill-current animate-pulse" /> Sharing Location
            </span>
          )}
        </div>

        {/* Distance + ETA bar */}
        {distanceKm !== null && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-page border border-border text-xs">
            <span className="text-text-secondary">
              Distance: <span className="font-semibold text-text-primary">{distanceKm.toFixed(1)} km</span>
            </span>
            <span className="text-text-secondary">
              ETA: <span className="font-semibold text-text-primary">{formatETA(etaMinutes)}</span>
            </span>
          </div>
        )}

        {/* Location sharing prompt */}
        {permission !== 'granted' && isTrackable && (
          <div className="bg-warning-soft border border-warning/30 rounded-xl p-3.5 flex items-start gap-3">
            <LocateFixed size={16} className="text-warning shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary">Share your location</p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                The donor will see your live position while the pickup is in progress.
              </p>
              {permission === 'denied' && (
                <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                  <AlertTriangle size={11} /> Location denied — enable it in browser settings.
                </p>
              )}
              {locationError && <p className="text-[11px] text-danger mt-1">{locationError}</p>}
            </div>
            {permission !== 'denied' && (
              <button
                onClick={requestPermissionAndStart}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-dash-primary text-white text-[11px] font-semibold hover:opacity-90 transition-opacity"
              >
                Start Sharing
              </button>
            )}
          </div>
        )}

        {/* Map — donor pickup pin + route line */}
        <div className="rounded-xl overflow-hidden border border-border/80 shadow-pb-card">
          <VolunteerMap
            userLocation={currentPosition}
            markers={pickupMarkers}
            routeLine={routeLine}
            viewerIsVolunteer={true}
            className="h-56"
          />
        </div>

        {/* Donor pickup address */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-border/60 shadow-pb-subtle">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Pickup Location</p>
            <p className="text-xs font-semibold text-text-primary truncate mt-0.5">
              {donation?.pickup_location || 'Address not specified'}
            </p>
          </div>
        </div>

        {/* Navigate button */}
        <button
          onClick={navigateToDonor}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-dash-primary text-white text-xs font-bold hover:bg-dash-primary-hover shadow-pb-elevated transition-all"
        >
          <Navigation size={14} />
          Navigate to Donor (Google Maps)
        </button>
      </div>
    );
  }

  // ── DONOR VIEW ─────────────────────────────────────────────────────────

  if (donation?.status === 'accepted' || donation?.status === 'scheduled') {
    return (
      <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-info-soft/40 border border-info/20 text-info text-xs font-medium">
        <Clock size={16} className="shrink-0" />
        <p>
          Pickup scheduled
          {donation.pickup_time
            ? ` for ${new Date(donation.pickup_time).toLocaleString()}`
            : ' — awaiting volunteer confirmation'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <span className={`text-xs font-bold uppercase tracking-wider ${getStatusTone()}`}>
          {getStatusMessage()}
        </span>
        {volunteerLocation?.latitude && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-dash-primary-soft text-dash-primary text-[10px] font-bold uppercase tracking-wider animate-pulse">
            <Radio size={12} /> Live Active
          </span>
        )}
      </div>

      {volunteerLocation?.latitude ? (
        <>
          <div className="rounded-xl overflow-hidden border border-border/80 shadow-pb-card">
            <VolunteerMap
              volunteers={[{
                ...volunteer,
                latitude: volunteerLocation.latitude,
                longitude: volunteerLocation.longitude,
                is_online: true,
              }]}
              teams={[]}
              className="h-56"
            />
          </div>
          {volunteerLocation.timestamp && (
            <p className="text-[11px] text-text-muted flex items-center gap-1.5 px-1 font-medium">
              <Navigation size={12} className="text-dash-primary" />
              Last updated: {new Date(volunteerLocation.timestamp).toLocaleTimeString()}
            </p>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-page/80 border border-border/80 text-xs text-text-secondary">
          <MapPin size={16} className="text-dash-primary shrink-0" />
          <p>The volunteer hasn't shared their live GPS location yet.</p>
        </div>
      )}

      {/* Pickup Location */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-border/60 shadow-pb-subtle">
        <div className="w-8 h-8 rounded-lg bg-dash-primary-soft text-dash-primary flex items-center justify-center shrink-0 mt-0.5">
          <MapPin size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Pickup Location</p>
          <p className="text-xs font-semibold text-text-primary truncate mt-0.5">
            {donation?.pickup_location || 'Not specified'}
          </p>
        </div>
      </div>
    </div>
  );
}
