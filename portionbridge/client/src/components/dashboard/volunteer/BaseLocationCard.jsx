import { useState, useCallback, useEffect } from 'react';
import { MapPin, LocateFixed, Loader2, Check, Navigation, ShieldCheck, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { reverseGeocode, searchAddressNominatim } from '../../../utils/geocoding';

const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 50;

export function BaseLocationCard({ savedLocation, onSave, title = 'Base Location' }) {
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState(null);
  const [radius, setRadius] = useState(savedLocation?.coverageRadius || 10);
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleAddressSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchAddressNominatim(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Address search failed:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleAddressSearch(searchQuery);
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleAddressSearch]);

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
      toast.success('Location saved successfully.');
      setPending(null);
    } else {
      toast.error(result?.error || 'Failed to save location.');
    }
  };

  const displayAddress = pending?.baseAddress || savedLocation?.baseAddress;
  const displayRadius = pending ? radius : (savedLocation?.coverageRadius || null);

  return (
    <div className="pb-glass-card rounded-2xl p-5 border border-border/60 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-dash-primary-soft text-dash-primary flex items-center justify-center shrink-0 border border-dash-primary/20">
            <MapPin size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary tracking-tight">{title}</h3>
            <p className="text-[11px] text-text-muted">Serves nearby donation opportunity matching</p>
          </div>
        </div>
        {displayAddress && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck size={12} /> Active Base
          </span>
        )}
      </div>

      {displayAddress ? (
        <div className="p-3 rounded-xl bg-surface/80 border border-border/70 mb-3">
          <p className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
            <Navigation size={13} className="text-dash-primary shrink-0" />
            {displayAddress}
          </p>
          {displayRadius && (
            <p className="text-[11px] font-medium text-text-secondary mt-1 ml-4.5">
              Coverage Radius: <span className="text-dash-primary font-bold">{displayRadius} km</span>
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-text-muted mb-3 italic">
          No base location set yet — set your location to prioritize nearby food rescue missions.
        </p>
      )}

      {pending && (
        <div className="mt-3 p-3.5 rounded-xl bg-dash-primary-soft/30 border border-dash-primary/20 mb-3">
          <div className="flex items-center justify-between text-xs font-semibold text-text-primary mb-2">
            <span>Coverage Radius</span>
            <span className="text-dash-primary font-bold">{radius} km</span>
          </div>
          <input
            id="base-location-radius"
            type="range"
            min={MIN_RADIUS_KM}
            max={MAX_RADIUS_KM}
            step={1}
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value, 10))}
            className="w-full accent-dash-primary cursor-pointer"
          />
        </div>
      )}

      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={handleDetect}
          disabled={locating}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary hover:bg-surface-hover transition-colors disabled:opacity-50"
        >
          {locating ? <Loader2 size={14} className="animate-spin text-dash-primary" /> : <LocateFixed size={14} className="text-dash-primary" />}
          {savedLocation?.baseAddress ? 'Update Location' : 'Use Current GPS Location'}
        </button>

        <button
          onClick={() => setShowAddressSearch(!showAddressSearch)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary hover:bg-surface-hover transition-colors"
        >
          <Search size={14} className="text-dash-primary" />
          Enter Address Manually
        </button>

        {pending && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dash-primary text-white text-xs font-bold hover:bg-dash-primary-hover shadow-sm transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Confirm & Save
          </button>
        )}
      </div>

      {showAddressSearch && (
        <div className="mt-3 p-3.5 rounded-xl bg-surface/80 border border-border/70">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 rounded-lg border border-border bg-page text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-dash-primary/20 focus:border-dash-primary"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowAddressSearch(false)}
              className="p-2 rounded-lg border border-border bg-page text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {searching && (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={16} className="animate-spin text-dash-primary" />
              <span className="ml-2 text-xs text-text-muted">Searching...</span>
            </div>
          )}

          {!searching && searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setPending({
                      latitude: result.lat,
                      longitude: result.lng,
                      baseAddress: result.displayName,
                    });
                    setShowAddressSearch(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="w-full text-left p-2.5 rounded-lg border border-border/60 bg-page hover:bg-surface-hover transition-colors"
                >
                  <p className="text-xs font-medium text-text-primary line-clamp-2">{result.displayName}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {result.district && result.district !== result.division ? `${result.district}, ` : ''}
                    {result.division}
                  </p>
                </button>
              ))}
            </div>
          )}

          {!searching && searchQuery && searchResults.length === 0 && (
            <p className="text-xs text-text-muted py-4 text-center">No results found. Try a different search term.</p>
          )}
        </div>
      )}
    </div>
  );
}
