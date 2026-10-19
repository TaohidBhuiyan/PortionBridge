import { useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { iconForType } from '../../utils/reliefIcons';
import {
  BANGLADESH_CENTER, BANGLADESH_ZOOM, SEVERITY_COLORS, SEVERITIES, INCIDENT_STATUS_LABELS,
  hasMapLocation, groupByPosition, typeLabel, labelFor, toNumber,
} from '../../utils/relief';

const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

/** Marker visual state is derived ONLY from fields the backend returned. */
function markerState(incident) {
  if (incident.status === 'resolved') return 'resolved';
  return incident.isVerified === true ? 'verified' : 'unverified';
}

function buildIcon(incidents) {
  const top = incidents[0]; // groups are ordered most-severe first
  const color = SEVERITY_COLORS[top.severity] || '#64748b';
  const state = incidents.every((i) => i.status === 'resolved') ? 'resolved' : markerState(incidents.find((i) => i.status !== 'resolved'));
  // `state` and `color` come from fixed lookups, never from user-supplied text.
  let inner;
  if (incidents.length > 1) {
    inner = `<span class="pb-marker__count" aria-hidden="true">${incidents.length}</span>`;
  } else {
    const Icon = iconForType(top.disasterType);
    inner = renderToStaticMarkup(<Icon size={15} color="#ffffff" strokeWidth={2.4} aria-hidden="true" />);
  }
  return L.divIcon({
    className: 'pb-marker-wrap',
    html: `<span class="pb-marker pb-marker--${state}" style="background:${color}">${inner}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

function appendIncident(root, incident, onOpen) {
  const section = document.createElement('div');
  section.className = 'pb-popup__item';

  const title = document.createElement('strong');
  title.className = 'pb-popup__title';
  title.textContent = incident.title || 'Untitled incident';
  section.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'pb-popup__meta';
  const severity = SEVERITIES.find((s) => s.value === incident.severity)?.label;
  meta.textContent = [typeLabel(incident.disasterType), severity && `${severity} severity`, labelFor(INCIDENT_STATUS_LABELS, incident.status)]
    .filter(Boolean).join(' · ');
  section.appendChild(meta);

  const verification = document.createElement('div');
  verification.className = 'pb-popup__meta';
  verification.textContent = incident.isVerified === true ? 'Verified by administrators' : 'Not verified';
  section.appendChild(verification);

  const place = [incident.district, incident.affectedArea].filter(Boolean).join(' · ');
  if (place) {
    const where = document.createElement('div');
    where.className = 'pb-popup__meta';
    where.textContent = place;
    section.appendChild(where);
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'pb-popup__button';
  button.textContent = 'View details';
  button.setAttribute('aria-label', `View details: ${incident.title || 'incident'}`);
  button.addEventListener('click', () => onOpen && onOpen(incident.id));
  section.appendChild(button);
  root.appendChild(section);
}

/** Popup built from DOM nodes + textContent: user-written text can never inject markup. */
function buildPopup(incidents, onOpen) {
  const root = document.createElement('div');
  root.className = 'pb-popup';
  if (incidents.length > 1) {
    const heading = document.createElement('div');
    heading.className = 'pb-popup__heading';
    heading.textContent = `${incidents.length} incidents at this location`;
    root.appendChild(heading);
  }
  incidents.forEach((incident) => appendIncident(root, incident, onOpen));
  return root;
}

/**
 * Interactive Leaflet map of incidents. Only incidents with valid coordinates
 * get a marker; the rest are the caller's responsibility to list elsewhere.
 * Leaflet is bundled (npm) and OpenStreetMap supplies only the base tiles —
 * all incident data comes from props.
 */
export function DisasterMap({ incidents = [], selectedId = null, onSelect, onOpen, userLocation = null, radiusKm = null, className = '' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const userLayerRef = useRef(null);
  const markersRef = useRef(new Map());
  const fitKeyRef = useRef(null);
  const handlers = useRef({ onSelect, onOpen });

  useEffect(() => {
    handlers.current = { onSelect, onOpen };
  }, [onSelect, onOpen]);

  // create the map once
  useEffect(() => {
    const map = L.map(containerRef.current, {
      center: BANGLADESH_CENTER,
      zoom: BANGLADESH_ZOOM,
      minZoom: 6,
      maxBounds: [[17.5, 85.0], [29.5, 95.5]],
      maxBoundsViscosity: 0.8,
      zoomControl: true,
      scrollWheelZoom: true,
    });
    L.tileLayer(OSM_TILES, { maxZoom: 18, attribution: OSM_ATTRIBUTION }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    userLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(containerRef.current);
    }
    const markers = markersRef.current;
    return () => {
      if (observer) observer.disconnect();
      markers.clear();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      userLayerRef.current = null;
      fitKeyRef.current = null;
    };
  }, []);

  // (re)build markers whenever the incident set changes
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    markersRef.current.clear();

    const groups = groupByPosition(
      incidents.filter(hasMapLocation).map((incident) => ({
        incident, lat: toNumber(incident.latitude), lng: toNumber(incident.longitude),
      }))
    );
    const points = groups;

    groups.forEach((group) => {
      const { lat, lng, incidents: here } = group;
      const marker = L.marker([lat, lng], {
        icon: buildIcon(here),
        title: here.length > 1
          ? `${here.length} incidents at this location`
          : `${here[0].title || 'Incident'} — ${typeLabel(here[0].disasterType)}`,
        keyboard: true,
        riseOnHover: true,
      });
      marker.bindPopup(() => buildPopup(here, (id) => handlers.current.onOpen && handlers.current.onOpen(id)), { maxWidth: 280, maxHeight: 320 });
      marker.on('click', () => handlers.current.onSelect && handlers.current.onSelect(here[0].id));
      marker.addTo(layer);
      here.forEach((incident) => markersRef.current.set(incident.id, marker));
    });

    // re-frame only when the set of incidents actually changed
    const key = incidents.filter(hasMapLocation).map((i) => i.id).sort((a, b) => a - b).join(',');
    if (fitKeyRef.current !== key) {
      fitKeyRef.current = key;
      if (points.length === 0) {
        map.setView(BANGLADESH_CENTER, BANGLADESH_ZOOM);
      } else if (points.length === 1) {
        map.setView([points[0].lat, points[0].lng], 9);
      } else {
        map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])).pad(0.2), { maxZoom: 10 });
      }
    }
  }, [incidents]);

  // reflect selection on the markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const selectedMarker = markersRef.current.get(selectedId);
    new Set(markersRef.current.values()).forEach((marker) => {
      const el = marker.getElement();
      if (el) el.classList.toggle('is-selected', marker === selectedMarker);
    });
    const selected = markersRef.current.get(selectedId);
    if (selected && !map.getBounds().contains(selected.getLatLng())) map.panTo(selected.getLatLng());
  }, [selectedId, incidents]);

  // "You are here" marker + search radius (Nearby mode)
  useEffect(() => {
    const layer = userLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!userLocation) return;
    const at = [userLocation.lat, userLocation.lng];
    L.circleMarker(at, { radius: 7, weight: 3, color: '#ffffff', fillColor: '#0284c7', fillOpacity: 1 })
      .bindTooltip('Your location').addTo(layer);
    if (radiusKm) {
      L.circle(at, { radius: radiusKm * 1000, weight: 1.5, color: '#0284c7', fillColor: '#0ea5e9', fillOpacity: 0.07, interactive: false }).addTo(layer);
    }
  }, [userLocation, radiusKm]);

  return (
    <div
      ref={containerRef}
      data-testid="disaster-map"
      role="region"
      aria-label="Map of disaster incidents in Bangladesh"
      className={`pb-disaster-map h-full w-full overflow-hidden rounded-2xl border border-border ${className}`}
    />
  );
}
