import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Map as MapIcon, List } from 'lucide-react';
import LocationPermission from '../components/dashboard/donor/LocationPermission';
import CurrentLocation from '../components/dashboard/donor/CurrentLocation';
import VolunteerCard from '../components/dashboard/donor/VolunteerCard';
import TeamCard from '../components/dashboard/donor/TeamCard';
import VolunteerMap from '../components/dashboard/donor/VolunteerMap';
import DiscoveryFilters from '../components/dashboard/donor/DiscoveryFilters';
import DiscoveryEmptyStates, { NoVolunteersState, LocationDeniedState, ErrorState } from '../components/dashboard/donor/DiscoveryEmptyStates';
import ManualLocationModal from '../components/dashboard/donor/ManualLocationModal';
import { volunteerDiscoveryApi } from '../services/volunteerDiscoveryApi';

// Keep this in sync with DiscoveryFilters.jsx's radius <input type="range">
// max — the slider is the single source of truth for how far "expand
// radius" is allowed to go, so the two never disagree.
const MAX_RADIUS_KM = 50;

// How long to wait after the user stops changing filters (e.g. dragging
// the radius slider) before actually firing the API request.
const FILTER_DEBOUNCE_MS = 400;

/**
 * Volunteer Discovery Page
 * Main page for donors to discover nearby volunteers and teams
 */
const VolunteerDiscoveryPage = () => {
  const navigate = useNavigate();
  
  // Location state
  const [location, setLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('unknown');
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  const [showManualLocationModal, setShowManualLocationModal] = useState(false);
  
  // Data state
  const [volunteers, setVolunteers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // View state
  const [viewMode, setViewMode] = useState('list'); // list, map, split
  const [showTeams, setShowTeams] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    radius: 10,
    availableOnly: true,
    onlineOnly: false,
    specialty: null,
    sortBy: 'distance',
    sortOrder: 'asc',
    page: 1,
    limit: 20,
  });

  // BUG FIX: `filters` updates immediately so the slider itself stays
  // responsive, but the actual API call now fires off this debounced copy
  // instead — dragging the radius slider used to send one request per
  // "onChange" tick. `debouncedFilters` only catches up FILTER_DEBOUNCE_MS
  // after the user stops moving it.
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedFilters(filters);
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [filters]);

  // BUG FIX: previously two separate un-coordinated fetches (volunteers had
  // its own loading/error state; teams had none at all, so switching to the
  // Teams tab while data was mid-flight could show a stale/empty list with
  // no loading indicator). Combined into one request pair sharing one
  // AbortController, so a newer request (e.g. radius changed again before
  // the last one resolved) always cancels the in-flight one — an older,
  // slower response can never overwrite a newer result.
  const abortControllerRef = useRef(null);

  const fetchDiscoveryData = useCallback(async (locationData, filtersToUse) => {
    if (!locationData) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const [volunteersResult, teamsResult] = await Promise.all([
      volunteerDiscoveryApi.findNearbyVolunteers(
        {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          radius: filtersToUse.radius,
          availableOnly: filtersToUse.availableOnly,
          onlineOnly: filtersToUse.onlineOnly,
          specialty: filtersToUse.specialty,
          search: filtersToUse.search,
          sortBy: filtersToUse.sortBy,
          sortOrder: filtersToUse.sortOrder,
          page: filtersToUse.page,
          limit: filtersToUse.limit,
        },
        { signal: controller.signal }
      ),
      volunteerDiscoveryApi.findNearbyTeams(
        {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          radius: filtersToUse.radius,
          search: filtersToUse.search,
          page: filtersToUse.page,
          limit: filtersToUse.limit,
        },
        { signal: controller.signal }
      ),
    ]);

    // This exact request pair was superseded by a newer one (or the
    // component unmounted) while it was in flight — its response is stale,
    // so it's dropped silently instead of touching state.
    if (controller.signal.aborted) return;

    if (volunteersResult.success) {
      setVolunteers(volunteersResult.data.volunteers || []);
    } else if (!volunteersResult.aborted) {
      setError(volunteersResult.error);
    }

    if (teamsResult.success) {
      setTeams(teamsResult.data.teams || []);
    }

    setLoading(false);
  }, []);

  // Cancel any in-flight discovery request on unmount.
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Handle location permission granted
  const handleLocationGranted = useCallback((locationData) => {
    setLocation(locationData);
    setLocationPermission('granted');
    // Fetching itself is handled by the effect below, keyed off `location`
    // + `locationPermission` — avoids firing the request twice (once here,
    // once from the effect) the way the previous version did.
  }, []);

  // Handle location permission denied
  const handleLocationDenied = useCallback(() => {
    setLocationPermission('denied');
  }, []);

  // BUG FIX: this used to land on locationPermission = 'blocked', a state
  // VolunteerDiscoveryPage's render logic never actually handled — every
  // exit from the LocationPermission modal (the X button, "Cancel", and
  // "Use Manual Location") funneled here and produced a blank page with no
  // way forward except a manual location button that also opens the modal
  // now. There's no separate 'blocked' UI to keep in sync, so this now
  // reuses the existing, already-actionable "denied" state instead.
  const handleLocationBlocked = useCallback(() => {
    setLocationPermission('denied');
  }, []);

  // Opens the real manual-location flow (address input + geocoding) rather
  // than re-triggering the browser GPS prompt.
  const handleOpenManualLocation = useCallback(() => {
    setShowManualLocationModal(true);
  }, []);

  const handleManualLocationSubmit = useCallback((locationData) => {
    setShowManualLocationModal(false);
    // Reuses the exact same path a granted GPS permission takes — no
    // separate manual-location discovery logic.
    handleLocationGranted(locationData);
  }, [handleLocationGranted]);

  // Refresh location
  const handleRefreshLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    
    setIsRefreshingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setIsRefreshingLocation(false);
      },
      () => {
        setIsRefreshingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      radius: 10,
      availableOnly: true,
      onlineOnly: false,
      specialty: null,
      sortBy: 'distance',
      sortOrder: 'asc',
      page: 1,
      limit: 20,
    });
  }, []);

  // Handle volunteer click
  const handleVolunteerClick = useCallback(() => {
    // Navigate to volunteer profile or show modal
  }, []);

  // Handle team click
  const handleTeamClick = useCallback(() => {
    // Navigate to team profile or show modal
  }, []);

  // Handle request pickup — the button calling this is always disabled
  // (VolunteerCard.jsx/TeamCard.jsx now show "(Coming Soon)" on it
  // directly), since there's no preferred-volunteer field anywhere in the
  // donation schema/API yet. Kept as a real, wired-up handler rather than
  // removed so implementing the feature later is a one-line change here.
  const handleRequestPickup = useCallback(() => {}, []);

  // Expand search radius
  // BUG FIX: this used to add +10 with no ceiling, so repeated clicks could
  // push the value past DiscoveryFilters.jsx's slider max (50) — the label
  // would read e.g. "60 km" while the slider itself stayed visually pinned
  // at 50, an impossible-to-represent state. Capped at MAX_RADIUS_KM so the
  // slider can always faithfully represent whatever radius is active.
  const handleExpandRadius = useCallback(() => {
    setFilters(prev => ({ ...prev, radius: Math.min(prev.radius + 10, MAX_RADIUS_KM) }));
  }, []);

  // Fetch data whenever location or the (debounced) filters change.
  useEffect(() => {
    if (location && locationPermission === 'granted') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch pattern used throughout this codebase
      fetchDiscoveryData(location, debouncedFilters);
    }
  }, [location, locationPermission, debouncedFilters, fetchDiscoveryData]);

  // Show location permission modal if not granted
  if (locationPermission === 'unknown' || locationPermission === 'prompt') {
    return (
      <div className="min-h-screen bg-page">
        <LocationPermission
          onLocationGranted={handleLocationGranted}
          onLocationDenied={handleLocationDenied}
          onLocationBlocked={handleLocationBlocked}
          onManualLocation={handleOpenManualLocation}
        />
        <ManualLocationModal
          isOpen={showManualLocationModal}
          onClose={() => setShowManualLocationModal(false)}
          onSubmit={handleManualLocationSubmit}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <div className="bg-surface border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-surface-hover rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2"
              >
                <ArrowLeft className="w-5 h-5 text-text-secondary" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-text-primary">
                  Discover Volunteers
                </h1>
                <p className="text-xs text-text-secondary">
                  Find nearby volunteers and teams
                </p>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-page border border-border rounded-xl p-1" role="group" aria-label="View mode">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary'
                } focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2`}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'map'
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary'
                } focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2`}
                aria-label="Map view"
                aria-pressed={viewMode === 'map'}
              >
                <MapIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'split'
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary'
                } focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2`}
                aria-label="Split view"
                aria-pressed={viewMode === 'split'}
              >
                <div className="w-4 h-4 flex gap-0.5">
                  <div className="w-1.5 h-4 bg-current rounded-sm" />
                  <div className="w-1.5 h-4 bg-current rounded-sm" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Location Display */}
        <div className="mb-6">
          <CurrentLocation
            location={location}
            onRefresh={handleRefreshLocation}
            isRefreshing={isRefreshingLocation}
            onManualLocation={handleOpenManualLocation}
          />
        </div>

        {/* Location Denied State */}
        {locationPermission === 'denied' && (
          <div className="mb-6">
            <LocationDeniedState
              onEnableLocation={() => setLocationPermission('prompt')}
              onManualLocation={handleOpenManualLocation}
            />
          </div>
        )}

        {/* Content */}
        {locationPermission === 'granted' && location && (
          <div className={`grid gap-6 ${
            viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
          }`}>
            {/* Left Column - Filters & List */}
            <div className="space-y-6">
              {/* Filters */}
              <DiscoveryFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onReset={handleResetFilters}
                totalCount={volunteers.length}
              />

              {/* Toggle between Volunteers/Teams */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTeams(false)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    !showTeams
                      ? 'bg-dash-primary text-white'
                      : 'bg-page border border-border text-text-primary'
                  }`}
                >
                  Volunteers
                </button>
                <button
                  onClick={() => setShowTeams(true)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    showTeams
                      ? 'bg-dash-primary text-white'
                      : 'bg-page border border-border text-text-primary'
                  }`}
                >
                  Teams
                </button>
              </div>

              {/* Loading State */}
              {loading && (
                <DiscoveryEmptyStates type="loading" />
              )}

              {/* Error State */}
              {error && !loading && (
                <ErrorState error={error} onRetry={() => fetchDiscoveryData(location, debouncedFilters)} />
              )}

              {/* No Results State */}
              {!loading && !error && volunteers.length === 0 && teams.length === 0 && (
                <NoVolunteersState
                  onExpandRadius={handleExpandRadius}
                  onResetFilters={handleResetFilters}
                />
              )}

              {/* Volunteers List */}
              {!loading && !error && !showTeams && volunteers.length > 0 && (
                <div className="grid gap-4">
                  {volunteers.map((volunteer) => (
                    <VolunteerCard
                      key={volunteer.id}
                      volunteer={volunteer}
                      onViewDetails={handleVolunteerClick}
                      onRequestPickup={handleRequestPickup}
                      disabled={true} // Disabled until future phase
                    />
                  ))}
                </div>
              )}

              {/* Teams List */}
              {!loading && !error && showTeams && teams.length > 0 && (
                <div className="grid gap-4">
                  {teams.map((team) => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      onViewDetails={handleTeamClick}
                      onRequestPickup={handleRequestPickup}
                      disabled={true} // Disabled until future phase
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Map */}
            {(viewMode === 'map' || viewMode === 'split') && (
              <div className="lg:sticky lg:top-20 lg:self-start">
                <VolunteerMap
                  userLocation={location}
                  volunteers={volunteers}
                  teams={teams}
                  onVolunteerClick={handleVolunteerClick}
                  onTeamClick={handleTeamClick}
                  className="h-[500px] lg:h-[600px]"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <ManualLocationModal
        isOpen={showManualLocationModal}
        onClose={() => setShowManualLocationModal(false)}
        onSubmit={handleManualLocationSubmit}
      />
    </div>
  );
};

export default VolunteerDiscoveryPage;

