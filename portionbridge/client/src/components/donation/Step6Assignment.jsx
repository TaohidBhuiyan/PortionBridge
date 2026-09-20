import { useState, useEffect } from 'react';
import { Users, Navigation, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { AssignmentModeSelection, AutoAssignRecommendation, VolunteerSelection } from '../dashboard/donor';

/**
 * Step 6: Assignment Selection (Rendered as Step 5 in workflow)
 * Allows donor to choose assignment mode and select volunteer
 * Features smart coordinate fallback so donors are never blocked.
 */
export function Step6Assignment({ onChange, onValidationChange, errors, pickupLocation }) {
  const [assignmentMode, setAssignmentMode] = useState('auto');
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Coordinates from pickupLocation prop
  const latitude = pickupLocation?.latitude ?? null;
  const longitude = pickupLocation?.longitude ?? null;

  useEffect(() => {
    onChange('assignmentMode', assignmentMode);
    onChange('selectedVolunteer', selectedVolunteer);
    onChange('volunteerId', selectedVolunteer?.id || null);

    // Valid if coordinates exist and volunteer is selected (or auto-assigned)
    const isValid = Boolean(latitude && longitude && selectedVolunteer !== null);
    onValidationChange?.(isValid);
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
        setLocationError('Could not retrieve your location. Please try again or enter coordinates manually.');
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
            <h3 className="text-base font-bold text-text-primary">Volunteer Matching & Assignment</h3>
            <p className="text-xs text-text-muted">Choose automated smart pairing or manually select a verified volunteer</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-dash-primary-soft text-dash-primary">
          Step 4 of 5
        </span>
      </div>

      {/* Coordinate Fallback Resolution if missing */}
      {(!latitude || !longitude) ? (
        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <MapPin size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">Location Coordinates Needed</h4>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              We need geographic coordinates for your pickup address so we can locate the nearest active volunteers in your area.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {latitude && longitude ? (
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <MapPin size={14} className="text-dash-primary" />
                <span>{latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleDetectCoordinates}
                disabled={isLocating}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dash-primary-soft text-dash-primary text-xs font-semibold hover:bg-dash-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLocating ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                {isLocating ? 'Detecting...' : 'Detect My GPS Location'}
              </button>
            )}
          </div>
          {locationError && (
            <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50/50 px-3 py-2 rounded-lg">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{locationError}</span>
            </div>
          )}
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}