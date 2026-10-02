import { useState, useEffect } from 'react';
import { Users, Navigation, MapPin, Loader2, AlertCircle, Info } from 'lucide-react';
import { AssignmentModeSelection, AutoAssignRecommendation, VolunteerSelection } from '../dashboard/donor';

/**
 * Step 6: Assignment Selection (Rendered as part of Step 2 / Pickup & Logistics)
 * Allows donor to choose assignment mode and optionally select a volunteer.
 * Volunteer selection is OPTIONAL — form can proceed without it; the system will
 * auto-assign the best available volunteer after submission if none is chosen.
 *
 * Coordinates are used for nearby-volunteer search but are NOT required to render
 * this section. If missing, a soft GPS-capture prompt is shown alongside the UI.
 */
export function Step6Assignment({ onChange, onValidationChange, errors, pickupLocation }) {
  const [assignmentMode, setAssignmentMode] = useState('auto');
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Coordinates from pickupLocation prop — may be null if user hasn't used GPS.
  // Parse as float: DB often returns coords as strings, and .toFixed() requires a number.
  const latRaw = pickupLocation?.latitude ?? null;
  const lngRaw = pickupLocation?.longitude ?? null;
  const latitude  = latRaw  !== null ? parseFloat(latRaw)  : null;
  const longitude = lngRaw  !== null ? parseFloat(lngRaw)  : null;
  const hasCoords = Boolean(latitude && longitude && !isNaN(latitude) && !isNaN(longitude));

  useEffect(() => {
    onChange('assignmentMode', assignmentMode);
    onChange('selectedVolunteer', selectedVolunteer);
    onChange('volunteerId', selectedVolunteer?.id || null);

    // Volunteer selection is always optional — this section never blocks the form.
    onValidationChange?.(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentMode, selectedVolunteer, latitude, longitude]);

  const handleModeChange = (mode) => {
    setAssignmentMode(mode);
    setSelectedVolunteer(null);
  };

  const handleVolunteerSelect = (volunteer) => {
    setSelectedVolunteer(volunteer);
  };

  const handleConfirmAssignment = (volunteer) => {
    setSelectedVolunteer(volunteer);
  };

  const handleDetectCoordinates = () => {
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support geolocation.');
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setIsLocating(false);
        onChange('pickupAddress', {
          ...pickupLocation,
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      },
      () => {
        setIsLocating(false);
        setLocationError('Could not retrieve your location. Volunteer search will use a wider area.');
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="space-y-7">
      {/* Ribbon Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-dash-primary-soft text-dash-primary flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">Volunteer Matching &amp; Assignment</h3>
            <p className="text-xs text-text-muted">Choose automated smart pairing or manually select a verified volunteer</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-dash-primary-soft text-dash-primary">
          Optional
        </span>
      </div>

      {/* Soft GPS tip (non-blocking) — shown only when no coords */}
      {!hasCoords && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Info size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              <span className="font-semibold">Tip:</span> Sharing your GPS location helps us find the closest volunteers. You can still continue without it.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDetectCoordinates}
            disabled={isLocating}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLocating ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
            {isLocating ? 'Detecting...' : 'Enable GPS'}
          </button>
        </div>
      )}

      {/* Coordinates badge if captured */}
      {hasCoords && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl w-fit">
          <MapPin size={13} />
          <span className="font-mono">GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
        </div>
      )}

      {locationError && (
        <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50/50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{locationError}</span>
        </div>
      )}

      {/* Assignment Mode + Volunteer UI — always shown */}
      <AssignmentModeSelection
        selectedMode={assignmentMode}
        onModeChange={handleModeChange}
      />

      {assignmentMode === 'auto' ? (
        <AutoAssignRecommendation
          latitude={latitude}
          longitude={longitude}
          onConfirm={handleConfirmAssignment}
          onAlternativeSelect={() => setAssignmentMode('manual')}
        />
      ) : (
        <VolunteerSelection
          latitude={latitude}
          longitude={longitude}
          onSelect={handleVolunteerSelect}
          selectedVolunteer={selectedVolunteer}
        />
      )}

      {errors?.assignment && (
        <p className="text-danger text-xs font-medium flex items-center gap-1">
          <AlertCircle size={14} />
          {errors.assignment}
        </p>
      )}
    </div>
  );
}