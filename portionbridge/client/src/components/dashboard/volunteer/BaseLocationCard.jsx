import { useState } from 'react';
import { MapPin, LocateFixed, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { reverseGeocode } from '../../../utils/geocoding';

const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 50;

/**
 * BaseLocationCard — lets a volunteer (or a team leader, on behalf of the
 * team) set/update a saved base location: latitude/longitude + a
 * human-readable label (via reverse geocoding) + a coverage radius.
 *
 * Shared between VolunteerProfilePage.jsx and VolunteerTeam.jsx rather
 * than duplicated, since the two only differ in what they save the
 * result to (profileApi.updateVolunteerLocation vs teamApi.updateTeam).
 *
 * This is what backs volunteer_profiles.latitude/longitude/coverage_radius
 * and teams.latitude/longitude/coverage_radius — columns that already
 * existed (donor-side "Discover Volunteers/Teams" reads them) but had no
 * write path anywhere in the app before this. Saving here also means
 * VolunteerOpportunities.jsx has a location to fall back on when live GPS
 * isn't granted.
 *
 * Location is only requested on an explicit button press (never
 * automatically in an effect), matching the donor Discovery page's
 * LocationPermission pattern elsewhere in this codebase.
 */
export function BaseLocationCard({ savedLocation, onSave, title = 'Base Location' }) {
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState(null); // { latitude, longitude, baseAddress }
  const [radius, setRadius] = useState(savedLocation?.coverageRadius || 10);

  const handleDetect = () => {
    if (!navigator.geolocation) {
      toast.error("Your browser doesn't support location detection.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const geo = await reverseGeocode(latitude, longitude);
        setPending({
          latitude,
          longitude,
          baseAddress: geo?.displayName || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        });
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast.error('Could not get your location. Check location permission and try again.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    if (!pending) return;
    setSaving(true);
    const result = await onSave({
      latitude: pending.latitude,
      longitude: pending.longitude,
      coverageRadius: radius,
      baseAddress: pending.baseAddress,
    });
    setSaving(false);
    if (result?.success) {
      toast.success('Location saved.');
      setPending(null);
    } else {
      toast.error(result?.error || 'Failed to save location.');
    }
  };

  const displayAddress = pending?.baseAddress || savedLocation?.baseAddress;
  const displayRadius = pending ? radius : (savedLocation?.coverageRadius || null);

  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={16} className="text-dash-primary" />
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>

      {displayAddress ? (
        <p className="text-sm text-text-secondary mb-1">
          {displayAddress}
          {displayRadius && ` · ${displayRadius} km radius`}
        </p>
      ) : (
        <p className="text-sm text-text-muted mb-1">Not set yet — nearby opportunities can't be prioritized without it.</p>
      )}

      {pending && (
        <div className="mt-3">
          <label htmlFor="base-location-radius" className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Coverage Radius: {radius} km
          </label>
          <input
            id="base-location-radius"
            type="range"
            min={MIN_RADIUS_KM}
            max={MAX_RADIUS_KM}
            step={1}
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value, 10))}
            className="w-full max-w-sm accent-dash-primary"
          />
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={handleDetect}
          disabled={locating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors disabled:opacity-50"
        >
          {locating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
          {savedLocation?.baseAddress ? 'Update to My Current Location' : 'Use My Current Location'}
        </button>

        {pending && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dash-primary text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Save
          </button>
        )}
      </div>
    </div>
  );
}
