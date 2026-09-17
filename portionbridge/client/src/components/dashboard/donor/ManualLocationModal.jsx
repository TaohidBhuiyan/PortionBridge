import React, { useState } from 'react';
import { X, MapPin, Compass, Check, Sparkles } from 'lucide-react';

// Common City Center Presets for quick 1-click selection
const DHAKA_PRESETS = [
  { name: 'Dhaka Central (Farmgate)', lat: 23.7561, lng: 90.3872 },
  { name: 'Gulshan 2', lat: 23.7949, lng: 90.4143 },
  { name: 'Dhanmondi 32', lat: 23.7508, lng: 90.3776 },
  { name: 'Uttara Sector 3', lat: 23.8687, lng: 90.3996 },
  { name: 'Mirpur 10 Circle', lat: 23.8069, lng: 90.3687 },
  { name: 'Banani', lat: 23.7937, lng: 90.4066 },
];

/**
 * Manual Location Entry Modal
 * Provides preset buttons + custom coordinate inputs for donors.
 */
const ManualLocationModal = ({ isOpen, onClose, onSubmit }) => {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset) => {
    setError(null);
    onSubmit({
      latitude: preset.lat,
      longitude: preset.lng,
      address: preset.name,
      accuracy: 10,
      manual: true,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const lat = Number.parseFloat(latitude);
    const lng = Number.parseFloat(longitude);

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be a number between -90 and 90.');
      return;
    }
    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      setError('Longitude must be a number between -180 and 180.');
      return;
    }

    setError(null);
    onSubmit({ latitude: lat, longitude: lng, accuracy: null, manual: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4 animate-fadeIn">
      <div className="bg-surface rounded-2xl shadow-pb-modal border border-border w-full max-w-md p-6 relative overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-dash-primary-soft text-dash-primary rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">
                Set Pickup Location
              </h3>
              <p className="text-[11px] text-text-secondary">Choose a city area preset or enter coordinates</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Area Presets */}
        <div className="mb-5">
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Quick Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DHAKA_PRESETS.map((preset, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-page border border-border hover:border-dash-primary hover:bg-dash-primary-soft hover:text-dash-primary text-text-primary transition-all text-left flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">{preset.name}</span>
                <Compass className="w-3.5 h-3.5 text-text-muted shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <span className="relative px-3 bg-surface text-[10px] font-bold uppercase tracking-wider text-text-muted">or specify coordinates</span>
        </div>

        {/* Manual Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="manual-latitude" className="block text-xs font-semibold text-text-secondary mb-1">
                Latitude
              </label>
              <input
                id="manual-latitude"
                type="number"
                step="any"
                inputMode="decimal"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="23.8103"
                className="w-full px-3 py-2 border border-border rounded-xl bg-input text-xs text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary transition-all font-mono"
              />
            </div>

            <div>
              <label htmlFor="manual-longitude" className="block text-xs font-semibold text-text-secondary mb-1">
                Longitude
              </label>
              <input
                id="manual-longitude"
                type="number"
                step="any"
                inputMode="decimal"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="90.4125"
                className="w-full px-3 py-2 border border-border rounded-xl bg-input text-xs text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary transition-all font-mono"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium text-danger bg-danger-soft p-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-border text-text-primary rounded-xl hover:bg-surface-hover transition-colors font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!latitude || !longitude}
              className="flex-1 py-2.5 px-4 bg-dash-primary hover:bg-dash-primary-hover disabled:opacity-50 text-white rounded-xl transition-colors font-bold text-xs cursor-pointer shadow-sm"
            >
              Use Custom Coordinates
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ManualLocationModal;
