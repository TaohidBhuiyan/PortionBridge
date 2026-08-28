import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Map as MapIcon, List } from 'lucide-react';
import LocationPermission from '../components/dashboard/donor/LocationPermission';
import CurrentLocation from '../components/dashboard/donor/CurrentLocation';
import VolunteerCard from '../components/dashboard/donor/VolunteerCard';
import TeamCard from '../components/dashboard/donor/TeamCard';
import VolunteerMap from '../components/dashboard/donor/VolunteerMap';
import DiscoveryFilters from '../components/dashboard/donor/DiscoveryFilters';
import DiscoveryEmptyStates, { NoVolunteersState, LocationDeniedState, ErrorState } from '../components/dashboard/donor/DiscoveryEmptyStates';
import { volunteerDiscoveryApi } from '../services/volunteerDiscoveryApi';

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

  // Fetch nearby volunteers
  const fetchNearbyVolunteers = useCallback(async (locationData) => {
    if (!locationData) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await volunteerDiscoveryApi.findNearbyVolunteers({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        radius: filters.radius,
        availableOnly: filters.availableOnly,
        onlineOnly: filters.onlineOnly,
        specialty: filters.specialty,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page,
        limit: filters.limit,
      });
      
      if (result.success) {
        setVolunteers(result.data.volunteers || []);
      } else {
        setError(result.error);
      }
    } catch {
      setError('Failed to fetch volunteers');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch nearby teams
  const fetchNearbyTeams = useCallback(async (locationData) => {
    if (!locationData) return;
    
    try {
      const result = await volunteerDiscoveryApi.findNearbyTeams({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        radius: filters.radius,
        search: filters.search,
        page: filters.page,
        limit: filters.limit,
      });
      
      if (result.success) {
        setTeams(result.data.teams || []);
      }
    } catch {
      // Error fetching teams
    }
  }, [filters]);

  // Handle location permission granted
  const handleLocationGranted = useCallback((locationData) => {
    setLocation(locationData);
    setLocationPermission('granted');
    fetchNearbyVolunteers(locationData);
    fetchNearbyTeams(locationData);
  }, [fetchNearbyVolunteers, fetchNearbyTeams]);

  // Handle location permission denied
  const handleLocationDenied = useCallback(() => {
    setLocationPermission('denied');
  }, []);

  // Handle location permission blocked
  const handleLocationBlocked = useCallback(() => {
    setLocationPermission('blocked');
  }, []);

  // Refresh location
  const handleRefreshLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    
    setIsRefreshingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setLocation(locationData);
        setIsRefreshingLocation(false);
        fetchNearbyVolunteers(locationData);
        fetchNearbyTeams(locationData);
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
  }, [fetchNearbyVolunteers, fetchNearbyTeams]);

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

  // Handle request pickup (disabled for now - future phase)
  const handleRequestPickup = useCallback(() => {
    alert('Pickup requests will be available in the next phase!');
  }, []);

  // Expand search radius
  const handleExpandRadius = useCallback(() => {
    setFilters(prev => ({ ...prev, radius: prev.radius + 10 }));
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    if (location && locationPermission === 'granted') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch pattern used throughout this codebase
      fetchNearbyVolunteers(location);
      fetchNearbyTeams(location);
    }
  }, [filters, location, locationPermission, fetchNearbyVolunteers, fetchNearbyTeams]);

  // Show location permission modal if not granted
  if (locationPermission === 'unknown' || locationPermission === 'prompt') {
    return (
      <div className="min-h-screen bg-page">
        <LocationPermission
          onLocationGranted={handleLocationGranted}
          onLocationDenied={handleLocationDenied}
          onLocationBlocked={handleLocationBlocked}
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
            onManualLocation={() => setLocationPermission('denied')}
          />
        </div>

        {/* Location Denied State */}
        {locationPermission === 'denied' && (
          <div className="mb-6">
            <LocationDeniedState
              onEnableLocation={() => setLocationPermission('prompt')}
              onManualLocation={() => setLocationPermission('prompt')}
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
                <ErrorState error={error} onRetry={() => fetchNearbyVolunteers(location)} />
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
    </div>
  );
};

export default VolunteerDiscoveryPage;

