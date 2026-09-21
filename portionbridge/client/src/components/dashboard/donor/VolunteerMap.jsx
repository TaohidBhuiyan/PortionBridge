import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Navigation, Layers, ChevronDown, ChevronUp, User, Users, MapPin, Radio } from 'lucide-react';

/**
 * Escapes a value for safe interpolation into Leaflet HTML popup strings.
 */
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
 * Displays volunteers and teams on an interactive Leaflet map with custom animated markers.
 */
const VolunteerMap = ({
  userLocation,
  volunteers = EMPTY_ARRAY,
  teams = EMPTY_ARRAY,
  markers = EMPTY_ARRAY,
  routeLine = null,
  onVolunteerClick,
  onTeamClick,
  onMarkerClick,
  viewerIsVolunteer = false,
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
    // Load Leaflet dynamically if not already loaded
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !window.L) {
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

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

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      if (map.dragging) {
        map.dragging.enable();
      }

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    map.invalidateSize();

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    // Generic point markers (e.g. MissionMap.jsx's donor pickup pin) —
    // real bug fix: this prop was accepted but never actually rendered;
    // only the volunteers/teams arrays below were ever drawn, so any
    // caller relying on `markers` (the volunteer's own mission map,
    // showing where the donor is) silently showed nothing for it.
    markers.forEach((markerDef) => {
      if (typeof markerDef.latitude !== 'number' || typeof markerDef.longitude !== 'number') return;

      const color = markerDef.color || '#f97316';
      const emoji = markerDef.emoji || '📍';
      const genericIcon = L.divIcon({
        className: 'custom-generic-marker',
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: ${color};
            border: 2.5px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            cursor: pointer;
          ">${emoji}</div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([markerDef.latitude, markerDef.longitude], { icon: genericIcon }).addTo(map);

      if (markerDef.popupHtml) {
        marker.bindPopup(`<div style="font-family: inherit; padding: 4px; min-width: 140px;">${markerDef.popupHtml}</div>`);
      }

      marker.on('click', () => {
        if (typeof markerDef.onClick === 'function') {
          markerDef.onClick();
        } else {
          onMarkerClick?.(markerDef);
        }
      });
      markersRef.current.push(marker);
    });

    // Route line between the volunteer's live position and the pickup
    // point — same real bug: accepted as a prop, cleaned up on re-render,
    // but never actually drawn onto the map anywhere.
    if (routeLine?.points?.length >= 2) {
      routeLineRef.current = L.polyline(routeLine.points, {
        color: routeLine.color || '#3b82f6',
        weight: 4,
        opacity: 0.75,
        dashArray: '8, 8',
      }).addTo(map);
    }

    // Add user donor location marker with radar wave aura
    if (userLocation?.latitude && userLocation?.longitude) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            <div style="
              position: absolute;
              inset: 0;
              background: rgba(37, 99, 235, 0.35);
              border-radius: 50%;
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              width: 24px;
              height: 24px;
              background: #2563eb;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 4px 12px rgba(37, 99, 235, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 10;
            ">
              <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userIcon,
      }).addTo(map);

      userMarker.bindTooltip(
        viewerIsVolunteer ? '<strong>Your Location</strong>' : '<strong>Your Location</strong> (Donor)',
        { direction: 'top', offset: [0, -17] }
      );
      userMarker.bindPopup(`
        <div style="font-family: inherit; padding: 6px; min-width: 150px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #2563eb;"></span>
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; tracking: 0.5px; color: #2563eb;">${viewerIsVolunteer ? 'Your Position' : 'Your Radar Pin'}</span>
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #111827;">${viewerIsVolunteer ? 'Your Current Location' : 'Pickup Zone (Donor)'}</div>
        </div>
      `);
      markersRef.current.push(userMarker);
    }

    // Add volunteer markers
    volunteers.forEach(volunteer => {
      if (volunteer.latitude && volunteer.longitude) {
        const isOnline = volunteer.is_online === 1 || volunteer.is_online === true;
        const markerColor = isOnline ? '#10b981' : '#6b7280';
        
        const volunteerIcon = L.divIcon({
          className: 'custom-volunteer-marker',
          html: `
            <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
              ${isOnline ? `
                <div style="
                  position: absolute;
                  inset: 0;
                  background: rgba(16, 185, 129, 0.3);
                  border-radius: 50%;
                  animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                "></div>
              ` : ''}
              <div style="
                width: 32px;
                height: 32px;
                background: ${markerColor};
                border: 2.5px solid white;
                border-radius: 50%;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 5;
              ">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([volunteer.latitude, volunteer.longitude], {
          icon: volunteerIcon,
        }).addTo(map);

        marker.bindTooltip(`
          <div style="font-size: 12px; line-height: 1.3;">
            <strong>${escapeHtml(volunteer.name)}</strong><br/>
            <span style="font-size: 11px; color: ${markerColor}; font-weight: 700;">
              ${isOnline ? '🟢 Online Volunteer' : '⚪ Offline Volunteer'}
            </span>
          </div>
        `, { direction: 'top', offset: [0, -18] });

        marker.bindPopup(`
          <div style="font-family: inherit; padding: 6px; min-width: 170px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${markerColor};"></span>
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${markerColor};">
                ${isOnline ? 'Available Volunteer' : 'Offline Volunteer'}
              </span>
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #111827; margin-bottom: 4px;">
              ${escapeHtml(volunteer.name)}
            </div>
            <div style="font-size: 12px; color: #4b5563; line-height: 1.4;">
              📍 <strong>${volunteer.distance ?? 0} km</strong> away
              ${volunteer.total_pickups ? `<br>📦 <strong>${volunteer.total_pickups}</strong> pickups` : ''}
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
              width: 38px;
              height: 38px;
              background: #9333ea;
              border: 2.5px solid white;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const marker = L.marker([team.latitude, team.longitude], {
          icon: teamIcon,
        }).addTo(map);

        marker.bindTooltip(`
          <div style="font-size: 12px; line-height: 1.3;">
            <strong>${escapeHtml(team.name)}</strong><br/>
            <span style="font-size: 11px; color: #9333ea; font-weight: 700;">👥 Volunteer Squad (${team.member_count || 1} members)</span>
          </div>
        `, { direction: 'top', offset: [0, -19] });

        marker.bindPopup(`
          <div style="font-family: inherit; padding: 6px; min-width: 170px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: #9333ea;"></span>
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #9333ea;">
                Volunteer Squad
              </span>
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #111827; margin-bottom: 4px;">
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

    const resizeObserver = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });
    if (mapRef.current) {
      resizeObserver.observe(mapRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [mapLoaded, userLocation, volunteers, teams, markers, routeLine, onVolunteerClick, onTeamClick, onMarkerClick, viewerIsVolunteer]);

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
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 p-4 bg-black/80 backdrop-blur-md' : ''} ${className}`}>
      <div
        ref={mapRef}
        className="w-full h-full rounded-2xl overflow-hidden bg-page border border-border shadow-pb-card"
        style={{ minHeight: isFullscreen ? 'calc(100vh - 32px)' : '480px' }}
      />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={centerOnUser}
          className="p-2.5 bg-surface border border-border rounded-xl shadow-md hover:bg-surface-hover text-text-primary transition-all cursor-pointer"
          title="Center radar on my location"
        >
          <Navigation className="w-4 h-4 text-dash-primary" />
        </button>
        
        <button
          onClick={toggleFullscreen}
          className="p-2.5 bg-surface border border-border rounded-xl shadow-md hover:bg-surface-hover text-text-primary transition-all cursor-pointer"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen Map'}
        >
          <Maximize2 className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur-md rounded-2xl shadow-pb-elevated border border-border p-3.5 z-[1000] min-w-[210px] transition-all">
        <button
          type="button"
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          className="flex items-center justify-between w-full gap-2 text-xs font-bold text-text-primary cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-dash-primary" />
            <span>Map Indicators</span>
          </div>
          {isLegendOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-text-muted" />
          )}
        </button>

        {isLegendOpen && (
          <div className="mt-3 space-y-2 border-t border-border/50 pt-2.5 text-xs animate-fadeIn">
            {userLocation?.latitude && userLocation?.longitude && (
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-2xs shrink-0" />
                <div className="leading-tight">
                  <span className="font-bold text-text-primary">{viewerIsVolunteer ? 'You' : 'You (Donor)'}</span>
                  <p className="text-[10px] text-text-muted">{viewerIsVolunteer ? 'Your current position' : 'Radar Origin'}</p>
                </div>
              </div>
            )}

            {markers.length > 0 && (
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow-2xs shrink-0 flex items-center justify-center text-[8px]">📦</div>
                <div className="leading-tight">
                  <span className="font-bold text-text-primary">Pickup Location</span>
                  <p className="text-[10px] text-text-muted">Donor's address</p>
                </div>
              </div>
            )}

            {volunteers.length > 0 && (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-2xs shrink-0" />
                  <div className="leading-tight">
                    <span className="font-bold text-text-primary">Online Volunteer</span>
                    <p className="text-[10px] text-emerald-600 font-semibold">Ready for pickup</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-gray-500 border-2 border-white shadow-2xs shrink-0" />
                  <div className="leading-tight">
                    <span className="font-bold text-text-primary">Offline Volunteer</span>
                    <p className="text-[10px] text-text-muted">Inactive</p>
                  </div>
                </div>
              </>
            )}

            {teams.length > 0 && (
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-md bg-purple-600 border-2 border-white shadow-2xs shrink-0" />
                <div className="leading-tight">
                  <span className="font-bold text-text-primary">Volunteer Squad</span>
                  <p className="text-[10px] text-purple-600 font-semibold">Team Squad</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading State Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/80 backdrop-blur-xs rounded-2xl z-20">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-dash-primary/30 border-t-dash-primary rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold text-text-secondary">Loading Map Tiles...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerMap;
