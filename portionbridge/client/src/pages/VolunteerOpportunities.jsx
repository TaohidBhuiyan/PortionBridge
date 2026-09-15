import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Compass, MapPin, LocateFixed, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../components/dashboard';
import { donationApi } from '../services/donationApi';
import { profileApi } from '../services/profileApi';
import { DonationCard } from '../components/donation/DonationCard';
import { EmptyState } from '../components/dashboard/EmptyState';
import { ErrorState } from '../components/dashboard/ErrorState';
import { SkeletonCard } from '../components/dashboard/skeletons';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'food', label: 'Food' },
  { value: 'clothes', label: 'Clothes' },
];

// Matches the backend's ALLOWED_SORT_FIELDS whitelist exactly
// (donation.validator.js) — no option is offered here that the backend
// doesn't actually support. 'distance' only makes sense once we have the
// volunteer's location, so it's appended to this list conditionally below
// rather than listed here statically.
const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest First' },
  { value: 'pickup_time', label: 'Pickup Time' },
  { value: 'quantity', label: 'Quantity' },
];

const PAGE_SIZE = 9;

// Radius bounds — kept in sync with the backend's MIN/MAX_OPPORTUNITY_RADIUS_KM
// (donation.validator.js) so this slider never offers a value the backend
// would reject.
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 50;
const DEFAULT_RADIUS_KM = 10;

/**
 * VolunteerOpportunities — browse/discover pending donation requests
 * available for a volunteer to accept.
 *
 * Backed by the existing GET /donations browse endpoint (via
 * donationApi.browseDonations) and PATCH /donations/:id/accept. Radius
 * filtering (this phase) sends the volunteer's own browser-geolocation
 * coordinates + a selected radius (1-50 km, default 10) as query params;
 * the backend computes real distance server-side with Haversine and
 * enforces the radius there too, so nothing here can be bypassed by
 * tampering with frontend state. Without location permission, the page
 * falls back to the previous behavior (plain text location filter, no
 * distance shown) rather than pretending to filter by distance.
 */
export function VolunteerOpportunities() {

  const [donations, setDonations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);
  // Bumped to trigger a re-fetch (retry button, post-accept refresh)
  // without calling setState from outside the effect body — see the
  // effect below for why this indirection exists.
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filters — only ones the backend's browseDonationsValidationRules
  // actually supports (category, search, sortBy, sortOrder, page).
  // "location" doubles as the free-text location filter the backend query
  // already supports (matched against pickup_location/description).
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [radius, setRadius] = useState(DEFAULT_RADIUS_KM);
  const [radiusTouched, setRadiusTouched] = useState(false);

  // Volunteer's own location for the nearby-radius filter.
  // 'idle' (not yet requested) -> 'loading' -> 'granted' | 'denied' | 'unsupported'.
  // Requested only on explicit user action (the banner's "Enable Location"
  // button below) rather than automatically in an effect on mount — same
  // pattern as the donor Discovery page's LocationPermission flow, and
  // avoids a setState-in-effect that the project's lint config flags.
  const [coords, setCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationStatus('granted');
        setPage(1);
      },
      () => {
        setCoords(null);
        setLocationStatus('denied');
        // No location after all — "Nearest First" no longer makes sense,
        // so fall back the same way the backend itself would.
        setSortBy((prev) => (prev === 'distance' ? 'created_at' : prev));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const hasLiveLocation = locationStatus === 'granted' && coords !== null;

  // Fallback: the volunteer's own saved base location (set via the
  // "My Base Location" card on the dashboard — BaseLocationCard.jsx /
  // profileApi.updateVolunteerLocation), fetched once on mount. Lets a
  // volunteer who's set this up browse nearby opportunities without
  // having to grant live GPS on every visit; live GPS still wins when
  // it's actually granted, since it's more precise.
  const [savedLocation, setSavedLocation] = useState(null);
  useEffect(() => {
    let cancelled = false;
    profileApi.getProfile().then((result) => {
      const vp = result?.data?.volunteerProfile;
      if (!cancelled && vp?.latitude != null && vp?.longitude != null) {
        setSavedLocation({
          latitude: Number(vp.latitude),
          longitude: Number(vp.longitude),
          coverageRadius: vp.coverage_radius ? Number(vp.coverage_radius) : DEFAULT_RADIUS_KM,
        });
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const effectiveCoords = hasLiveLocation ? coords : savedLocation;
  const hasLocation = effectiveCoords !== null;
  const usingSavedLocation = !hasLiveLocation && savedLocation !== null;

  // The radius slider defaults to the volunteer's saved coverage_radius
  // (once it arrives) until they actually touch the slider themselves —
  // computed at render time rather than synced via an effect, so there's
  // no setState-in-effect to fight with the project's lint rule.
  const effectiveRadius = radiusTouched || !savedLocation ? radius : savedLocation.coverageRadius;

  // Debounced the same way as the donor Discovery page's radius slider —
  // dragging shouldn't fire one request per pixel of drag.
  const [debouncedRadius, setDebouncedRadius] = useState(DEFAULT_RADIUS_KM);
  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedRadius(effectiveRadius), 400);
    return () => clearTimeout(timeoutId);
  }, [effectiveRadius]);

  // The fetch is defined inline inside the effect (rather than as an
  // outer useCallback called from the effect) to match the project's
  // established data-fetching convention — see Phase 2's
  // VolunteerStatisticsCards.jsx/ActiveMissionCard.jsx for the same
  // pattern, and the Phase 2 report for why (React Compiler's
  // react-hooks/set-state-in-effect rule). Anything that needs to trigger
  // a refresh from outside this effect (retry button, post-accept) bumps
  // `refreshTrigger` instead of calling the fetch function directly.
  useEffect(() => {
    const loadOpportunities = async () => {
      setLoading(true);
      setError(null);

      const result = await donationApi.browseDonations({
        search: search || undefined,
        location: locationFilter || undefined,
        category: category || undefined,
        sortBy,
        sortOrder,
        page,
        limit: PAGE_SIZE,
        ...(hasLocation && {
          latitude: effectiveCoords.latitude,
          longitude: effectiveCoords.longitude,
          radius: debouncedRadius,
        }),
      });

      if (result.success) {
        setDonations(result.data?.donations || []);
        setMeta(result.meta || null);
      } else {
        setError(result.error);
        setDonations([]);
      }

      setLoading(false);
    };

    loadOpportunities();
  }, [search, locationFilter, category, sortBy, sortOrder, page, refreshTrigger, hasLocation, effectiveCoords, debouncedRadius]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleLocationChange = (value) => {
    setLocationFilter(value);
    setPage(1);
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
    setPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setPage(1);
  };

  const handleRadiusChange = (value) => {
    setRadius(value);
    setRadiusTouched(true);
    setPage(1);
  };

  const sortOptions = hasLocation
    ? [{ value: 'distance', label: 'Nearest First' }, ...SORT_OPTIONS]
    : SORT_OPTIONS;

  const handleAccept = async (donationId) => {
    if (acceptingId) return; // guard against double-click / overlapping accepts
    setAcceptingId(donationId);

    const result = await donationApi.acceptDonation(donationId);

    if (result.success) {
      toast.success('Donation accepted! Check your Active Mission on the dashboard.');
      // Re-fetch rather than optimistically mutating local state — the
      // accepted donation is no longer "pending" so it should simply drop
      // out of this pending-only list, and the backend is the source of
      // truth for what's actually available now.
      setRefreshTrigger((t) => t + 1);
    } else if (result.status === 409) {
      // Another volunteer won the race — the audit's required "already
      // accepted" case. Never shown as a success.
      toast.error('This donation is no longer available.');
      setRefreshTrigger((t) => t + 1);
    } else if (result.status === 401) {
      toast.error('Your session has expired. Please log in again.');
    } else if (result.status === 403) {
      toast.error("You don't have permission to accept this donation.");
    } else {
      toast.error(result.error || 'Failed to accept donation. Please try again.');
    }

    setAcceptingId(null);
  };

  const totalPages = meta?.totalPages || (meta?.totalItems ? Math.ceil(meta.totalItems / PAGE_SIZE) : 1);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-dash-primary-soft flex items-center justify-center shrink-0">
              <Compass size={20} className="text-dash-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
                Nearby Opportunities
              </h1>
              <p className="text-text-secondary text-sm mt-0.5">
                Browse available donation requests and accept one to start a mission.
              </p>
            </div>
          </div>
        </div>

      {/* Location banner — only shown when we don't have a location to filter
          by, so the volunteer understands why results aren't distance-limited
          rather than silently getting an unfiltered list. */}
      {!hasLocation && (
        <div className="flex items-center gap-3 bg-dash-primary-soft border border-dash-primary/20 rounded-xl px-4 py-3 mb-4 text-sm">
          <AlertTriangle size={18} className="text-dash-primary shrink-0" />
          <span className="text-text-primary flex-1">
            {locationStatus === 'loading'
              ? 'Getting your location…'
              : locationStatus === 'unsupported'
                ? "Your browser doesn't support location — showing all opportunities instead of nearby ones."
                : 'Enable location to see donation requests near you, with real distance for each.'}
          </span>
          {locationStatus !== 'loading' && locationStatus !== 'unsupported' && (
            <button
              onClick={requestLocation}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dash-primary text-white text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <LocateFixed size={14} />
              Enable Location
            </button>
          )}
        </div>
      )}

      {/* Using the saved base location (set on the dashboard) rather than
          live GPS — quietly informative, not an alert, since this is the
          normal/expected path for a volunteer who's set an address. */}
      {usingSavedLocation && (
        <div className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-2.5 mb-4 text-sm">
          <MapPin size={16} className="text-text-secondary shrink-0" />
          <span className="text-text-secondary flex-1">
            Using your saved base location. For more precise results, you can use your live location instead.
          </span>
          <button
            onClick={requestLocation}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors"
          >
            <LocateFixed size={14} />
            Use Live Location
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-surface rounded-xl shadow-pb-card border border-border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search opportunities..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
                aria-label="Search opportunities"
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="Location..."
            value={locationFilter}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="px-3 py-2.5 border border-border rounded-xl bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all min-w-[140px]"
            aria-label="Filter by location"
          />

          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-3 py-2.5 border border-border rounded-xl bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
            aria-label="Filter by category"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-2.5 border border-border rounded-xl bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
            aria-label="Sort by"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <button
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="px-3 py-2.5 border border-border rounded-xl bg-page text-text-primary text-sm hover:bg-surface-hover transition-colors"
            aria-label="Toggle sort order"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>

        {/* Radius slider — only meaningful once we have the volunteer's
            location; range/step mirror the donor Discovery page's slider
            (DiscoveryFilters.jsx) and the backend's 1-50 km bounds exactly. */}
        {hasLocation && (
          <div className="mt-3 pt-3 border-t border-border">
            <label htmlFor="opportunity-radius" className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              <MapPin size={14} />
              Search Radius: {effectiveRadius} km
            </label>
            <input
              id="opportunity-radius"
              type="range"
              min={MIN_RADIUS_KM}
              max={MAX_RADIUS_KM}
              step={1}
              value={effectiveRadius}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value, 10))}
              className="w-full max-w-sm accent-dash-primary"
              aria-label="Search radius in kilometers"
            />
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <SkeletonCard count={6} />
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load opportunities"
          message={error}
          onRetry={() => setRefreshTrigger((t) => t + 1)}
        />
      ) : donations.length === 0 ? (
        <EmptyState
          icon={Compass}
          title={hasLocation ? `No donation opportunities within ${effectiveRadius} km` : 'No donation opportunities available right now'}
          description={hasLocation
            ? 'Try expanding your search radius, or check back soon as new requests come in.'
            : 'Check back soon — new donation requests appear here as donors submit them.'}
          showAction={false}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            {donations.map((donation, index) => (
              <div
                key={donation.id}
                style={{ animation: 'rowIn 0.25s ease backwards', animationDelay: `${Math.min(index, 10) * 25}ms` }}
              >
                <DonationCard
                  donation={donation}
                  onAccept={handleAccept}
                  accepting={acceptingId === donation.id}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-border text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-text-secondary">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-border text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
    </DashboardLayout>
  );
}