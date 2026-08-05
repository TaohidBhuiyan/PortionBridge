import { useEffect, useRef, useState } from 'react';
import { MapPin, Maximize2, Navigation, Layers } from 'lucide-react';

/**
 * Volunteer Map Component
 * Displays volunteers and teams on an interactive map using Leaflet
 */
const VolunteerMap = ({ 
  userLocation, 
  volunteers = [], 
  teams = [], 
  onVolunteerClick, 
  onTeamClick,
  className = '' 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !window.L) {
        // Load CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

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
      }
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.L) return;

    if (!mapInstanceRef.current) {
      // Initialize map
      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [userLocation?.latitude || 23.8103, userLocation?.longitude || 90.4125],
        zoom: 13,
        zoomControl: false,
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

      mapInstanceRef.current = map;
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const L = window.L;
    const map = mapInstanceRef.current;

    // Add user location marker
    if (userLocation?.latitude && userLocation?.longitude) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="
            width: 24px;
            height: 24px;
            background: #3b82f6;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            position: relative;
          ">
            <div style="
              position: absolute;
              width: 8px;
              height: 8px;
              background: white;
              border-radius: 50%;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
            "></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userIcon,
      }).addTo(map);

      userMarker.bindPopup('<strong>Your Location</strong>');
      markersRef.current.push(userMarker);

      // Center map on user location
      map.setView([userLocation.latitude, userLocation.longitude], 13);
    }

    // Add volunteer markers
    volunteers.forEach(volunteer => {
      if (volunteer.latitude && volunteer.longitude) {
        const isOnline = volunteer.is_online === 1 || volunteer.is_online === true;
        const markerColor = isOnline ? '#22c55e' : '#9ca3af';
        
        const volunteerIcon = L.divIcon({
          className: 'custom-volunteer-marker',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              background: ${markerColor};
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
            ">
              👤
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([volunteer.latitude, volunteer.longitude], {
          icon: volunteerIcon,
        }).addTo(map);

        marker.bindPopup(`
          <div style="min-width: 150px;">
            <strong>${volunteer.name}</strong><br>
            ${volunteer.distance} km away<br>
            ${isOnline ? '<span style="color: green;">Available</span>' : '<span style="color: gray;">Offline</span>'}
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
              background: #a855f7;
              border: 3px solid white;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
            ">
              👥
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([team.latitude, team.longitude], {
          icon: teamIcon,
        }).addTo(map);

        marker.bindPopup(`
          <div style="min-width: 150px;">
            <strong>${team.name}</strong><br>
            ${team.member_count} members<br>
            ${team.distance} km away
          </div>
        `);

        marker.on('click', () => onTeamClick?.(team));
        markersRef.current.push(marker);
      }
    });

    // Fit bounds to show all markers
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [mapLoaded, userLocation, volunteers, teams, onVolunteerClick, onTeamClick]);

  const centerOnUser = () => {
    if (mapInstanceRef.current && userLocation?.latitude && userLocation?.longitude) {
      mapInstanceRef.current.setView([userLocation.latitude, userLocation.longitude], 14);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
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
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Layers className="w-4 h-4" />
          <span className="font-medium">Legend:</span>
        </div>
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
            <span className="text-gray-600 dark:text-gray-400">You</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
            <span className="text-gray-600 dark:text-gray-400">Available Volunteer</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-white" />
            <span className="text-gray-600 dark:text-gray-400">Offline Volunteer</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-purple-500 border-2 border-white" />
            <span className="text-gray-600 dark:text-gray-400">Team</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerMap;
