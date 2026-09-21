import { MapPin, Clock, AlertCircle, Navigation, Radio } from 'lucide-react';
import VolunteerMap from '../dashboard/donor/VolunteerMap';

/**
 * TrackingPanel — shows live pickup tracking using real location updates.
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
      <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-page/60 border border-dashed border-border text-text-secondary text-xs">
        <AlertCircle size={16} className="text-warning shrink-0" />
        <p>Waiting for volunteer assignment to begin live tracking.</p>
      </div>
    );
  }

  // Empty state: assigned but pickup not yet in motion
  if (donation?.status === 'accepted' || donation?.status === 'scheduled') {
    return (
      <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-info-soft/40 border border-info/20 text-info text-xs font-medium">
        <Clock size={16} className="shrink-0" />
        <p>Pickup scheduled for {donation.pickup_time ? new Date(donation.pickup_time).toLocaleString() : 'a scheduled time'}</p>
      </div>
    );
  }

  // Completed state
  if (donation?.status === 'completed') {
    return (
      <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-success-soft/50 border border-success/20 text-success text-xs font-medium">
        <MapPin size={16} className="shrink-0" />
        <p>Pickup completed successfully.</p>
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

      {/* Real last-known volunteer location, or an honest "not shared yet" state */}
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

