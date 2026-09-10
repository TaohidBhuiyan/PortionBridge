import { useEffect, useRef, useState } from 'react';
import { Maximize2, Navigation, Layers, ChevronDown, ChevronUp, User, Users, MapPin } from 'lucide-react';

/**
 * Escapes a value for safe interpolation into an HTML string. Needed
 * because Leaflet's bindPopup() renders its string argument as raw HTML
 * (no built-in escaping) — unlike JSX, which escapes by default. Every
 * user-controlled field (volunteer/team display names) going into a
 * popup string must go through this first.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

const EMPTY_ARRAY = [];

/**
 * Volunteer Map Component
 * Displays volunteers and teams on an interactive map using Leaflet
 */
const VolunteerMap = ({
  userLocation,
  volunteers = EMPTY_ARRAY,
  teams = EMPTY_ARRAY,
  markers = EMPTY_ARRAY,
  routeLine = null,
  onVolunteerClick,
  onTeamClick,
  className = ''
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routeLineRef = useRef(null);
  const hasCenteredRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(true);

  useEffect(() => {
    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !window.L) {
        // Load CSS if not already present
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Load JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          setMapLoaded(true);
        };
        document.head.appendChild(script);
      } else {
        setMapLoaded(true);
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.L) return;

    const L = window.L;

    if (!mapInstanceRef.current) {
      // Initialize map
      const map = L.map(mapRef.current, {
        center: [userLocation?.latitude || 23.8103, userLocation?.longitude || 90.4125],
        zoom: 13,
        zoomControl: false,
        dragging: true,
        tap: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        boxZoom: true,
        keyboard: true,
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add zoom control to bottom right
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      // Explicitly ensure dragging is enabled
      if (map.dragging) {
        map.dragging.enable();
      }

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Invalidate size immediately so dragging bounds calculate correctly
    map.invalidateSize();

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Clear existing route line
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    // Add user location marker
    if (userLocation?.latitude && userLocation?.longitude) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="
            width: 26px;
            height: 26px;
            background: #2563eb;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userIcon,
      }).addTo(map);

      userMarker.bindTooltip('<strong>Your Location</strong> (Donor)', { direction: 'top', offset: [0, -13] });
      userMarker.bindPopup(`
        <div style="font-family: inherit; padding: 4px; min-width: 140px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #2563eb;"></span>
            <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #2563eb;">Current Location</span>
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #111827;">You (Donor)</div>
        </div>
      `);
      markersRef.current.push(userMarker);
    }

    // Add volunteer markers
    volunteers.forEach(volunteer => {
      if (volunteer.latitude && volunteer.longitude) {
        const isOnline = volunteer.is_online === 1 || volunteer.is_online === true;
        const markerColor = isOnline ? '#16a34a' : '#6b7280';
        
        const volunteerIcon = L.divIcon({
          className: 'custom-volunteer-marker',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              background: ${markerColor};
              border: 2.5px solid white;
              border-radius: 50%;
              box-shadow: 0 3px 8px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            ">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([volunteer.latitude, volunteer.longitude], {
          icon: volunteerIcon,
        }).addTo(map);

        marker.bindTooltip(`
          <div style="font-size: 12px; line-height: 1.3;">
            <strong>${escapeHtml(volunteer.name)}</strong><br/>
            <span style="font-size: 11px; color: ${markerColor}; font-weight: 600;">
              ${isOnline ? '🟢 Available Volunteer' : '⚪ Offline Volunteer'}
            </span>
          </div>
        `, { direction: 'top', offset: [0, -16] });

        marker.bindPopup(`
          <div style="font-family: inherit; padding: 4px; min-width: 160px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${markerColor};"></span>
              <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${markerColor};">
                ${isOnline ? 'Available Volunteer' : 'Offline Volunteer'}
              </span>
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 4px;">
              ${escapeHtml(volunteer.name)}
            </div>
            <div style="font-size: 12px; color: #4b5563; line-height: 1.4;">
              📍 <strong>${volunteer.distance ?? 0} km</strong> away
              ${volunteer.phone ? `<br>📞 ${escapeHtml(volunteer.phone)}` : ''}
            </div>
          </div>
        `);

        marker.on('click', () => onVolunteerClick?.(volunteer));
        markersRef.current.push(marker);
      }
    });

    // Add team markers
    teams.forEach(team => {
      if (team.latitude && team.longitude) {
        const teamIcon = L.divIcon({
          className: 'custom-team-marker',
          html: `
            <div style="
              width: 36px;
              height: 36px;
              background: #9333ea;
              border: 2.5px solid white;
              border-radius: 8px;
              box-shadow: 0 3px 8px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            ">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([team.latitude, team.longitude], {
          icon: teamIcon,
        }).addTo(map);

        marker.bindTooltip(`
          <div style="font-size: 12px; line-height: 1.3;">
            <strong>${escapeHtml(team.name)}</strong><br/>
            <span style="font-size: 11px; color: #9333ea; font-weight: 600;">👥 Volunteer Team (${team.member_count || 1} members)</span>
          </div>
        `, { direction: 'top', offset: [0, -18] });

        marker.bindPopup(`
          <div style="font-family: inherit; padding: 4px; min-width: 160px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: #9333ea;"></span>
              <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #9333ea;">
                Volunteer Team
              </span>
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 4px;">
              ${escapeHtml(team.name)}
            </div>
            <div style="font-size: 12px; color: #4b5563; line-height: 1.4;">
              👥 <strong>${team.member_count || 1} members</strong><br>
              📍 <strong>${team.distance ?? 0} km</strong> away
            </div>
          </div>
        `);

        marker.on('click', () => onTeamClick?.(team));
        markersRef.current.push(marker);
      }
    });

    // Add custom markers (pickup pins)
    markers.forEach(markerData => {
      if (markerData.latitude && markerData.longitude) {
        const pinColor = markerData.color || '#f59e0b';
        const pinIcon = L.divIcon({
          className: 'custom-pin-marker',
          html: `
            <div style="
              width: 30px;
              height: 30px;
              background: ${pinColor};
              border: 2.5px solid white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 2px 8px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        });

        const marker = L.marker([markerData.latitude, markerData.longitude], {
          icon: pinIcon,
        }).addTo(map);

        if (markerData.popupHtml) {
          marker.bindPopup(markerData.popupHtml);
        }

        if (markerData.onClick) {
          marker.on('click', () => markerData.onClick(markerData));
        }

        markersRef.current.push(marker);
      }
    });

    // Add route line if provided
    if (routeLine && routeLine.length >= 2) {
      const latLngs = routeLine.map(point => [point.latitude, point.longitude]);
      const polyline = L.polyline(latLngs, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10',
      }).addTo(map);

      routeLineRef.current = polyline;
    }

    // Fit bounds or center only on initial load so user panning/dragging is not reset
    if (!hasCenteredRef.current) {
      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds().pad(0.15));
        hasCenteredRef.current = true;
      } else if (userLocation?.latitude && userLocation?.longitude) {
        map.setView([userLocation.latitude, userLocation.longitude], 13);
        hasCenteredRef.current = true;
      }
    }

    // Auto-update map dimensions on container resize or layout mode switches
    const resizeObserver = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });
    if (mapRef.current) {
      resizeObserver.observe(mapRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [mapLoaded, userLocation, volunteers, teams, markers, routeLine, onVolunteerClick, onTeamClick]);

  const centerOnUser = () => {
    if (mapInstanceRef.current && userLocation?.latitude && userLocation?.longitude) {
      mapInstanceRef.current.setView([userLocation.latitude, userLocation.longitude], 14);
      mapInstanceRef.current.invalidateSize();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => {
      const next = !prev;
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
      return next;
    });
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}>
      <div
        ref={mapRef}
        className="w-full h-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800"
        style={{ minHeight: isFullscreen ? '100vh' : '400px' }}
      />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={centerOnUser}
          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Center on my location"
        >
          <Navigation className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          <Maximize2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-[1000] min-w-[210px] transition-all">
        <button
          type="button"
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          className="flex items-center justify-between w-full gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-dash-primary" />
            <span>Map Indicators</span>
          </div>
          {isLegendOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>

        {isLegendOpen && (
          <div className="mt-2.5 space-y-2 border-t border-gray-100 dark:border-gray-700 pt-2 text-xs">
            {/* You */}
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-xs flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
              <div className="leading-tight">
                <span className="font-semibold text-gray-900 dark:text-gray-100">You</span>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Current Location (Donor)</p>
              </div>
            </div>

            {/* Available Volunteer */}
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-green-600 border-2 border-white shadow-xs flex items-center justify-center text-white shrink-0">
                <User className="w-3 h-3" />
              </div>
              <div className="leading-tight">
                <span className="font-semibold text-gray-900 dark:text-gray-100">Available Volunteer</span>
                <p className="text-[10px] text-green-600 dark:text-green-400">Online & ready</p>
              </div>
            </div>

            {/* Offline Volunteer */}
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-gray-500 border-2 border-white shadow-xs flex items-center justify-center text-white shrink-0">
                <User className="w-3 h-3" />
              </div>
              <div className="leading-tight">
                <span className="font-semibold text-gray-900 dark:text-gray-100">Offline Volunteer</span>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Currently inactive</p>
              </div>
            </div>

            {/* Volunteer Team */}
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-purple-600 border-2 border-white shadow-xs flex items-center justify-center text-white shrink-0">
                <Users className="w-3 h-3" />
              </div>
              <div className="leading-tight">
                <span className="font-semibold text-gray-900 dark:text-gray-100">Volunteer Team</span>
                <p className="text-[10px] text-purple-600 dark:text-purple-400">Squad / Group</p>
              </div>
            </div>

            {/* Pickup Marker if markers exist */}
            {markers.length > 0 && (
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-500 border-2 border-white shadow-xs flex items-center justify-center text-white shrink-0">
                  <MapPin className="w-3 h-3" />
                </div>
                <div className="leading-tight">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Pickup Location</span>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">Donation point</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dash-primary mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerMap;
