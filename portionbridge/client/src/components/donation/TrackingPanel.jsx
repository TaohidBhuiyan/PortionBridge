import { MapPin, Clock, AlertCircle, Navigation } from 'lucide-react';
import VolunteerMap from '../dashboard/donor/VolunteerMap';

/**
 * TrackingPanel — shows live pickup tracking using only real data.
 *
 * Note: the backend does not geocode pickup addresses into coordinates
 * (pickup_location is a free-text string), so there is no real "distance"
 * or "ETA" figure available — a previous version of this component computed
 * those against a hardcoded Dhaka coordinate regardless of the donation's
 * actual location, which was fabricated data. That's been removed. This
 * panel shows the volunteer's real last-known location (from the
 * `volunteer_location_updated` socket event) and how long ago it arrived,
 * with an honest "not shared yet" state when no location update has come in.
 */
export function TrackingPanel({ donation, volunteer, volunteerLocation }) {
  const getStatusMessage = () => {
    switch (donation?.status) {
      case 'scheduled':
        return 'Pickup scheduled';
      case 'on_the_way':
        return 'Volunteer is on the way';
      case 'picked_up':
        return 'Donation picked up';
      case 'completed':
        return 'Pickup completed';
      default:
        return 'Waiting for volunteer';
    }
  };

  const getStatusTone = () => {
    switch (donation?.status) {
      case 'on_the_way':
        return 'text-dash-primary';
      case 'picked_up':
      case 'completed':
        return 'text-success';
      default:
        return 'text-text-secondary';
    }
  };

  // Empty state: no volunteer assigned
  if (!volunteer && donation?.status === 'pending') {
    return (
      <div className="flex items-center gap-2.5 text-text-secondary text-sm">
        <AlertCircle size={16} />
        <p>Waiting for volunteer assignment...</p>
      </div>
    );
  }

  // Empty state: assigned but pickup not yet in motion
  if (donation?.status === 'accepted' || donation?.status === 'scheduled') {
    return (
      <div className="flex items-center gap-2.5 text-text-secondary text-sm">
        <Clock size={16} />
        <p>Pickup scheduled for {donation.pickup_time ? new Date(donation.pickup_time).toLocaleString() : 'a scheduled time'}</p>
      </div>
    );
  }

  // Completed state
  if (donation?.status === 'completed') {
    return (
      <div className="flex items-center gap-2.5 text-success text-sm font-medium">
        <MapPin size={16} />
        <p>Pickup completed successfully</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${getStatusTone()}`}>
          {getStatusMessage()}
        </span>
      </div>

      {/* Real last-known volunteer location, or an honest "not shared yet" state */}
      {volunteerLocation?.latitude ? (
        <>
          <div className="rounded-lg overflow-hidden border border-border">
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
            <p className="text-xs text-text-secondary flex items-center gap-1.5">
              <Navigation size={12} />
              Last location update: {new Date(volunteerLocation.timestamp).toLocaleTimeString()}
            </p>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-page border border-border text-sm text-text-secondary">
          <MapPin size={16} className="shrink-0" />
          <p>The volunteer hasn't shared their live location yet.</p>
        </div>
      )}

      {/* Pickup Location (real, from the donation record) */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-page border border-border">
        <MapPin size={16} className="text-text-secondary shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-text-secondary">Pickup Location</p>
          <p className="text-sm font-medium text-text-primary truncate">
            {donation?.pickup_location || 'Not specified'}
          </p>
        </div>
      </div>
    </div>
  );
}
