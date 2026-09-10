import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Navigation, MapPin, Loader2, CheckCircle2, Crosshair, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { reverseGeocode, searchAddressNominatim } from '../../../utils/geocoding';

const DEFAULT_CENTER = { lat: 23.8103, lng: 90.4125 }; // Dhaka center

function createPinIcon(L) {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        background: #2563eb;
        color: #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
        border: 2.5px solid #ffffff;
      ">
        <svg style="transform: rotate(45deg); width: 20px; height: 20px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 7.2c0 7.3-8 11.8-8 11.8z"/>
          <circle cx="12" cy="9" r="2.5" fill="currentColor"/>
        </svg>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });
}

/**
 * AddressLocationPicker Component
 *
 * Provides:
 * 1. Interactive Leaflet map with draggable marker and click-to-pin.
 * 2. Real-time address/area search that flies to and allocates pin on the map.
 * 3. One-click GPS location detection that auto-populates coordinates and reverse-geocodes
 *    Area, Thana/Upazila, District, Division, and Postal Code.
 */
export function AddressLocationPicker({
  latitude,
  longitude,
  onChange,
  className = '',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const handlePositionSelectedRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(() => typeof window !== 'undefined' && Boolean(window.L));
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Dynamically load Leaflet if not already present
  useEffect(() => {
    if (typeof window === 'undefined' || window.L) return;

    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Update pin and trigger reverse-geocoding
  const handlePositionSelected = useCallback(async (lat, lng, flyTo = true, zoomLevel = 16) => {
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;

    // Update or create marker position
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const customIcon = createPinIcon(L);
      const marker = L.marker([lat, lng], {
        draggable: true,
        icon: customIcon,
      }).addTo(mapInstanceRef.current);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        handlePositionSelectedRef.current?.(pos.lat, pos.lng, false);
      });

      markerRef.current = marker;
    }

    if (flyTo) {
      mapInstanceRef.current.setView([lat, lng], zoomLevel, { animate: true });
    }

    // Perform reverse geocoding to fill geographical info
    setIsReverseGeocoding(true);
    const geoDetails = await reverseGeocode(lat, lng);
    setIsReverseGeocoding(false);

    onChange?.({
      latitude: lat,
      longitude: lng,
      area: geoDetails?.area || '',
      thana: geoDetails?.thana || '',
      district: geoDetails?.district || '',
      division: geoDetails?.division || '',
      postalCode: geoDetails?.postalCode || '',
      road: geoDetails?.road || '',
      displayName: geoDetails?.displayName || '',
    });
  }, [onChange]);

  // Keep ref up to date
  useEffect(() => {
    handlePositionSelectedRef.current = handlePositionSelected;
  }, [handlePositionSelected]);

  // Initialize Leaflet Map once container and Leaflet script are available
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || !window.L) return;
    if (mapInstanceRef.current) return;

    const L = window.L;
    const initialLat = typeof latitude === 'number' ? latitude : DEFAULT_CENTER.lat;
    const initialLng = typeof longitude === 'number' ? longitude : DEFAULT_CENTER.lng;
    const hasInitialCoords = typeof latitude === 'number' && typeof longitude === 'number';

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: hasInitialCoords ? 16 : 12,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Click anywhere on map to allocate / move pin
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      handlePositionSelectedRef.current?.(lat, lng, false);
    });

    mapInstanceRef.current = map;

    // Place initial marker if coords exist
    if (hasInitialCoords) {
      const customIcon = createPinIcon(L);
      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: customIcon,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        handlePositionSelectedRef.current?.(pos.lat, pos.lng, false);
      });

      markerRef.current = marker;
    }

    // Invalidate size to handle modal animation / flex render bounds
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(resizeTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [mapLoaded, latitude, longitude]);

  // Keep marker position synced if latitude/longitude props change externally
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      const L = window.L;
      if (markerRef.current) {
        const currentPos = markerRef.current.getLatLng();
        if (Math.abs(currentPos.lat - latitude) > 0.00001 || Math.abs(currentPos.lng - longitude) > 0.00001) {
          markerRef.current.setLatLng([latitude, longitude]);
        }
      } else {
        const customIcon = createPinIcon(L);
        const marker = L.marker([latitude, longitude], {
          draggable: true,
          icon: customIcon,
        }).addTo(mapInstanceRef.current);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          handlePositionSelectedRef.current?.(pos.lat, pos.lng, false);
        });

        markerRef.current = marker;
      }
    }
  }, [latitude, longitude]);

  // Handle Current Location / GPS detection
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        const { latitude: lat, longitude: lng } = pos.coords;
        toast.success('GPS location acquired!');
        await handlePositionSelected(lat, lng, true, 16);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        toast.error('Could not detect location. Please allow location access or select manually on map.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  // Handle Search Input
  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchAddressNominatim(val);
      setSearchResults(results);
      setIsSearching(false);
      setShowResults(true);
    }, 450);
  };

  const handleSelectSearchResult = async (result) => {
    setShowResults(false);
    setSearchQuery(result.displayName);

    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;

    // Move or create marker
    if (markerRef.current) {
      markerRef.current.setLatLng([result.lat, result.lng]);
    } else {
      const customIcon = createPinIcon(L);
      const marker = L.marker([result.lat, result.lng], {
        draggable: true,
        icon: customIcon,
      }).addTo(mapInstanceRef.current);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        handlePositionSelectedRef.current?.(pos.lat, pos.lng, false);
      });

      markerRef.current = marker;
    }

    mapInstanceRef.current.setView([result.lat, result.lng], 16, { animate: true });

    onChange?.({
      latitude: result.lat,
      longitude: result.lng,
      area: result.area || '',
      thana: result.thana || '',
      district: result.district || '',
      division: result.division || '',
      postalCode: result.postalCode || '',
      road: result.road || '',
      displayName: result.displayName || '',
    });

    toast.success('Location allocated on map!');
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const results = await searchAddressNominatim(searchQuery);
    setIsSearching(false);

    if (results.length > 0) {
      handleSelectSearchResult(results[0]);
    } else {
      toast.error('Location not found. Try entering Area or District name.');
    }
  };

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Search Bar & GPS Locate Button */}
      <div className="flex flex-col sm:flex-row gap-2 relative">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              onFocus={() => {
                if (searchResults.length > 0) setShowResults(true);
              }}
              placeholder="Search area, road or landmark to allocate on map..."
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-border bg-input text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/20 focus:border-dash-primary"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              {isSearching ? (
                <Loader2 size={14} className="animate-spin text-dash-primary" />
              ) : (
                <Search size={15} className="text-text-secondary" />
              )}
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowResults(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-[1000] bg-surface border border-border rounded-lg shadow-xl overflow-hidden max-h-56 overflow-y-auto">
              {searchResults.map((res, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-surface-hover border-b border-border/40 last:border-0 flex items-start gap-2 transition-colors"
                >
                  <MapPin size={14} className="text-dash-primary shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary truncate">{res.area || res.thana || 'Location'}</p>
                    <p className="text-[11px] text-text-secondary truncate">{res.displayName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </form>

        {/* GPS Current Location button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-dash-primary/10 hover:bg-dash-primary/20 text-dash-primary border border-dash-primary/30 rounded-lg text-xs font-semibold transition-all whitespace-nowrap disabled:opacity-60 cursor-pointer"
        >
          {isLocating ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Locating GPS...</span>
            </>
          ) : (
            <>
              <Crosshair size={14} />
              <span>Auto-detect via GPS</span>
            </>
          )}
        </button>
      </div>

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-border h-52 sm:h-60 w-full bg-surface">
        <div ref={mapContainerRef} className="h-full w-full z-0" />

        {/* Loading overlay while leaflet or reverse geocode runs */}
        {(!mapLoaded || isReverseGeocoding) && (
          <div className="absolute inset-0 bg-surface/50 backdrop-blur-[1px] z-[500] flex items-center justify-center gap-2 text-xs text-text-primary font-medium pointer-events-none">
            <Loader2 size={16} className="animate-spin text-dash-primary" />
            <span>{isReverseGeocoding ? 'Detecting Area & Thana...' : 'Loading map...'}</span>
          </div>
        )}

        {/* Map instruction pill on top */}
        <div className="absolute top-2 left-2 right-2 sm:right-auto z-[400] bg-surface/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-border/60 shadow-sm text-[11px] text-text-secondary flex items-center gap-1.5 pointer-events-none">
          <Navigation size={12} className="text-dash-primary shrink-0" />
          <span>Click anywhere or drag pin to fine-tune pickup spot</span>
        </div>

        {/* Coordinates badge at bottom left */}
        <div className="absolute bottom-2 left-2 z-[400] bg-surface/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-border/70 shadow-sm text-[11px] flex items-center gap-1.5">
          {hasCoords ? (
            <>
              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
              <span className="font-mono text-text-primary font-medium">
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-text-secondary">No pin placed yet</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
