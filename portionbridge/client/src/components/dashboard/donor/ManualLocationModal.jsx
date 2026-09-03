import { useState } from 'react';
import { X, MapPin } from 'lucide-react';

/**
 * Manual Location Entry Modal
 *
 * Fallback for donors who have denied or don't have browser geolocation.
 * Accepts a latitude/longitude pair directly — the discovery API already
 * takes raw coordinates (see volunteerDiscoveryApi / backend
 * volunteerDiscovery routes), so no geocoding service is needed to make
 * this functional.
 */
const ManualLocationModal = ({ isOpen, onClose, onSubmit }) => {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      style={{ animation: 'fadeIn 0.2s ease' }}
    >
      <div
        className="bg-surface rounded-xl shadow-pb-modal border border-border w-full max-w-sm p-6"
        style={{ animation: 'modalIn 0.2s ease' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-dash-primary" />
            <h3 className="text-lg font-semibold text-text-primary">
              Enter Your Location
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-text-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-text-secondary mb-4">
          Enter coordinates for your pickup area. You can find these by searching your address on any map app and copying the shown coordinates.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="manual-latitude" className="block text-sm font-medium text-text-secondary mb-1">
              Latitude
            </label>
            <input
              id="manual-latitude"
              type="number"
              step="any"
              inputMode="decimal"
              required
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g. 23.8103"
              className="w-full px-3 py-2 border border-border rounded-lg bg-input text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary transition-all"
            />
          </div>

          <div>
            <label htmlFor="manual-longitude" className="block text-sm font-medium text-text-secondary mb-1">
              Longitude
            </label>
            <input
              id="manual-longitude"
              type="number"
              step="any"
              inputMode="decimal"
              required
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g. 90.4125"
              className="w-full px-3 py-2 border border-border rounded-lg bg-input text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary transition-all"
            />
          </div>

          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border text-text-primary rounded-lg hover:bg-surface-hover transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-dash-primary text-white rounded-lg hover:opacity-90 transition-colors font-medium"
            >
              Use This Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualLocationModal;
