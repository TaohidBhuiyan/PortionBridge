import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LifeBuoy, Map as MapIcon, List, Globe2, LocateFixed, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { DashboardLayout } from '../components/dashboard';
import { DisasterMap } from '../components/relief/DisasterMap';
import { IncidentFilters } from '../components/relief/IncidentFilters';
import { IncidentList } from '../components/relief/IncidentList';
import { MapLegend } from '../components/relief/MapLegend';
import { useAuth } from '../context/AuthContext';
import { useApiResource } from '../hooks/useApiResource';
import { useGeolocationOnce } from '../hooks/useGeolocationOnce';
import reliefApi from '../services/reliefApi';
import { DEFAULT_FILTERS, buildIncidentParams, countActiveFilters, hasMapLocation, haversineKm, toNumber } from '../utils/relief';

const NEARBY_FETCH_LIMIT = 200; // backend maximum page size
const RADIUS_OPTIONS = [25, 50, 100, 200];
const PAGE_SIZES = [25, 50, 100];

const segment = (active) => `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-dash-primary ${active ? 'bg-dash-primary text-white' : 'text-text-secondary hover:bg-surface-hover'}`;

/**
 * Disaster Response — nationwide map + list of verified incidents.
 *
 * Nationwide is the default and is never restricted by location. "Nearby" is an
 * opt-in extra: the browser's location prompt only appears after the donor
 * chooses it, one position reading is taken (no tracking), and a denial simply
 * returns the donor to the full nationwide view.
 */
export function DisasterReliefPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [resetKey, setResetKey] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [mode, setMode] = useState('nationwide'); // 'nationwide' | 'nearby'
  const [radiusKm, setRadiusKm] = useState(50);
  const [view, setView] = useState('map'); // below lg only: 'map' | 'list'
  const [selectedId, setSelectedId] = useState(null);

  const geo = useGeolocationOnce();
  const nearbyActive = mode === 'nearby' && geo.status === 'granted';

  const params = useMemo(
    () => (nearbyActive ? buildIncidentParams(filters, { page: 1, limit: NEARBY_FETCH_LIMIT }) : buildIncidentParams(filters, { page, limit })),
    [filters, page, limit, nearbyActive]
  );
  const { data, error, loading, reload } = useApiResource(reliefApi.listIncidents, params);

  const fetched = useMemo(() => data?.data?.incidents ?? [], [data]);
  const meta = data?.meta;

  // Nearby: filter + order the fetched incidents by distance in the browser (the API has no radius query).
  const { incidents, distances, withoutLocation } = useMemo(() => {
    if (!nearbyActive) return { incidents: fetched, distances: null, withoutLocation: fetched.filter((i) => !hasMapLocation(i)).length };
    const origin = geo.position;
    const map = new Map();
    const inRange = [];
    let missing = 0;
    fetched.forEach((incident) => {
      if (!hasMapLocation(incident)) { missing += 1; return; }
      const km = haversineKm(origin, { lat: toNumber(incident.latitude), lng: toNumber(incident.longitude) });
      if (km <= radiusKm) { map.set(incident.id, km); inRange.push(incident); }
    });
    inRange.sort((a, b) => map.get(a.id) - map.get(b.id));
    return { incidents: inRange, distances: map, withoutLocation: missing };
  }, [fetched, nearbyActive, geo.position, radiusKm]);

  const updateFilters = useCallback((partial) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
    setSelectedId(null);
  }, []);
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setResetKey((k) => k + 1);
    setPage(1);
    setSelectedId(null);
  }, []);

  const chooseNearby = () => {
    setMode('nearby');
    if (geo.status !== 'granted') geo.request(); // the ONLY place the browser permission prompt is triggered
  };
  const chooseNationwide = () => {
    setMode('nationwide');
    setSelectedId(null);
  };

  const hasFilters = countActiveFilters(filters) > 0;
  const totalItems = meta?.totalItems ?? 0;
  const first = totalItems === 0 ? 0 : ((meta?.page ?? 1) - 1) * (meta?.limit ?? limit) + 1;
  const last = Math.min(totalItems, (meta?.page ?? 1) * (meta?.limit ?? limit));
  const openIncident = useCallback((id) => navigate(`/relief/incidents/${id}`), [navigate]);

  return (
    <DashboardLayout>
      <main className="mx-auto text-left max-w-7xl space-y-4 pb-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary"><LifeBuoy size={26} aria-hidden="true" className="text-dash-primary" />Disaster Relief</h1>
            <p className="mt-1 max-w-2xl text-sm text-text-secondary">
              Verified disasters and relief needs across Bangladesh. Browse the whole country, or switch to Nearby to see incidents close to you.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Discovery mode" className="inline-flex rounded-xl border border-border bg-surface p-1">
              <button type="button" aria-pressed={mode === 'nationwide'} onClick={chooseNationwide} className={segment(mode === 'nationwide')}><Globe2 size={16} aria-hidden="true" />Nationwide</button>
              <button type="button" aria-pressed={mode === 'nearby'} onClick={chooseNearby} className={segment(mode === 'nearby')}><LocateFixed size={16} aria-hidden="true" />Nearby</button>
            </div>
            <div role="group" aria-label="View" className="inline-flex rounded-xl border border-border bg-surface p-1 lg:hidden">
              <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')} className={segment(view === 'map')}><MapIcon size={16} aria-hidden="true" />Map</button>
              <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')} className={segment(view === 'list')}><List size={16} aria-hidden="true" />List</button>
            </div>
          </div>
        </header>

        <IncidentFilters filters={filters} onChange={updateFilters} onClear={clearFilters} isAdmin={isAdmin} resetKey={resetKey} />

        {mode === 'nearby' && geo.status === 'requesting' && (
          <p role="status" className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-secondary"><Info size={16} aria-hidden="true" />Waiting for your browser to share your location… Nationwide results are shown meanwhile.</p>
        )}
        {mode === 'nearby' && ['denied', 'unavailable', 'error'].includes(geo.status) && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-warning-soft px-4 py-3 text-sm text-text-primary">
            <span>
              {geo.status === 'denied' && 'Location permission was denied, so Nearby can’t be used. You can still browse every incident nationwide below.'}
              {geo.status === 'unavailable' && 'Your location is not available on this device right now. You can still browse every incident nationwide below.'}
              {geo.status === 'error' && 'We could not read your location in time. You can still browse every incident nationwide below.'}
            </span>
            <span className="flex gap-2">
              {geo.status !== 'denied' && <button type="button" onClick={geo.request} className="rounded-lg px-3 py-1.5 font-semibold text-dash-primary hover:bg-surface">Try again</button>}
              <button type="button" onClick={chooseNationwide} className="rounded-lg bg-dash-primary px-3 py-1.5 font-semibold text-white hover:bg-dash-primary-hover">Browse nationwide</button>
            </span>
          </div>
        )}
        {nearbyActive && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-secondary">
            <label className="inline-flex items-center gap-2 font-medium text-text-primary">
              Within
              <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="rounded-lg border border-border bg-input px-2 py-1 text-sm">
                {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{r} km</option>)}
              </select>
              of your location
            </label>
            <span className="text-xs text-text-muted">
              Searches the {NEARBY_FETCH_LIMIT} most recent matching incidents{totalItems > NEARBY_FETCH_LIMIT ? ` (of ${totalItems})` : ''}.
              {withoutLocation > 0 && ` ${withoutLocation} without a map location can’t be placed and are hidden — switch to Nationwide to see them.`}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-text-secondary" aria-live="polite">
          {loading && <span>Loading incidents…</span>}
          {!loading && !error && (
            <span>
              {nearbyActive
                ? `${incidents.length} incident${incidents.length === 1 ? '' : 's'} within ${radiusKm} km`
                : `Showing ${first}–${last} of ${totalItems} incident${totalItems === 1 ? '' : 's'}`}
              {!nearbyActive && withoutLocation > 0 && ` · ${withoutLocation} on this page ${withoutLocation === 1 ? 'has' : 'have'} no map location (listed, not mapped)`}
            </span>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className={`${view === 'map' ? 'block' : 'hidden'} lg:block`}>
            <div className="h-[62vh] min-h-[360px] lg:h-[calc(100vh-19rem)] lg:min-h-[520px]">
              <DisasterMap
                incidents={incidents}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onOpen={openIncident}
                userLocation={nearbyActive ? geo.position : null}
                radiusKm={nearbyActive ? radiusKm : null}
              />
            </div>
          </div>

          <div className={`${view === 'list' ? 'block' : 'hidden'} lg:block`}>
            <div className="lg:max-h-[calc(100vh-19rem)] lg:overflow-y-auto lg:pr-1">
              <IncidentList
                incidents={incidents}
                loading={loading}
                error={error}
                onRetry={reload}
                selectedId={selectedId}
                onSelect={(id) => { setSelectedId(id); setView('map'); }}
                distances={distances}
                hasFilters={hasFilters}
                onClearFilters={clearFilters}
                emptyMessage={nearbyActive ? `No mapped incidents within ${radiusKm} km. Try a larger radius or browse nationwide.` : undefined}
              />
            </div>
            {!nearbyActive && !loading && !error && meta && meta.totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <button type="button" disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 font-medium text-text-primary disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft size={16} aria-hidden="true" />Previous</button>
                <span className="text-text-secondary">Page {meta.page} of {meta.totalPages}</span>
                <button type="button" disabled={meta.page >= meta.totalPages} onClick={() => setPage(meta.page + 1)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 font-medium text-text-primary disabled:cursor-not-allowed disabled:opacity-50">Next<ChevronRight size={16} aria-hidden="true" /></button>
              </nav>
            )}
            {!nearbyActive && !loading && !error && meta && totalItems > PAGE_SIZES[0] && (
              <label className="mt-2 flex items-center justify-end gap-2 text-xs text-text-secondary">
                Per page
                <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="rounded-lg border border-border bg-input px-2 py-1 text-xs text-text-primary">
                  {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            )}
          </div>
        </div>

        <MapLegend showUnverified={isAdmin || filters.mine} />
      </main>
    </DashboardLayout>
  );
}

export default DisasterReliefPage;
