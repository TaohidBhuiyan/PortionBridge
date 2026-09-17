import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Map as MapIcon, List, Users, User, Compass, Zap, ShieldCheck, Clock, MapPin, Sparkles } from 'lucide-react';
import { DashboardLayout } from '../components/dashboard';
import LocationPermission from '../components/dashboard/donor/LocationPermission';
import CurrentLocation from '../components/dashboard/donor/CurrentLocation';
import VolunteerCard from '../components/dashboard/donor/VolunteerCard';
import TeamCard from '../components/dashboard/donor/TeamCard';
import VolunteerMap from '../components/dashboard/donor/VolunteerMap';
import DiscoveryFilters from '../components/dashboard/donor/DiscoveryFilters';
import DiscoveryEmptyStates, { NoVolunteersState, LocationDeniedState, ErrorState } from '../components/dashboard/donor/DiscoveryEmptyStates';
import ManualLocationModal from '../components/dashboard/donor/ManualLocationModal';
import VolunteerDetailModal from '../components/dashboard/donor/VolunteerDetailModal';
import { volunteerDiscoveryApi } from '../services/volunteerDiscoveryApi';

const MAX_RADIUS_KM = 50;
const FILTER_DEBOUNCE_MS = 400;

// Quick location presets for 1-click area switching
const QUICK_LOCATION_PRESETS = [
  { name: 'Dhaka Central', lat: 23.7561, lng: 90.3872 },
  { name: 'Gulshan 2', lat: 23.7949, lng: 90.4143 },
  { name: 'Dhanmondi', lat: 23.7508, lng: 90.3776 },
  { name: 'Uttara', lat: 23.8687, lng: 90.3996 },
  { name: 'Mirpur', lat: 23.8069, lng: 90.3687 },
];

/**
 * Volunteer Discovery Page
 * Main page for donors to discover nearby volunteers and teams.
 */
const VolunteerDiscoveryPage = () => {
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
  const [viewMode, setViewMode] = useState('split'); // list, map, split
  const [showTeams, setShowTeams] = useState(false);

  // Detail Modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDetailItemTeam, setIsDetailItemTeam] = useState(false);

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

  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedFilters(filters);
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [filters]);

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

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Location Handlers
  const handleLocationGranted = useCallback((locationData) => {
    setLocation(locationData);
    setLocationPermission('granted');
  }, []);

  const handleLocationDenied = useCallback(() => {
    setLocationPermission('denied');
  }, []);

  const handleLocationBlocked = useCallback(() => {
    setLocationPermission('denied');
  }, []);

  const handleOpenManualLocation = useCallback(() => {
    setShowManualLocationModal(true);
  }, []);

  const handleManualLocationSubmit = useCallback((locationData) => {
    setShowManualLocationModal(false);
    handleLocationGranted(locationData);
  }, [handleLocationGranted]);

  const handleSelectPresetLocation = useCallback((preset) => {
    handleLocationGranted({
      latitude: preset.lat,
      longitude: preset.lng,
      address: preset.name,
      accuracy: 10,
    });
  }, [handleLocationGranted]);

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

  // Filter Handlers
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

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

  // Detail Modal Handlers
  const handleVolunteerClick = useCallback((volunteer) => {
    setSelectedItem(volunteer);
    setIsDetailItemTeam(false);
    setIsDetailModalOpen(true);
  }, []);

  const handleTeamClick = useCallback((team) => {
    setSelectedItem(team);
    setIsDetailItemTeam(true);
    setIsDetailModalOpen(true);
  }, []);

  const handleRequestPickup = useCallback((item) => {
    // Open pickup request flow or modal
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  }, []);

  const handleExpandRadius = useCallback(() => {
    setFilters(prev => ({ ...prev, radius: Math.min(prev.radius + 10, MAX_RADIUS_KM) }));
  }, []);

  useEffect(() => {
    if (location && locationPermission === 'granted') {
      fetchDiscoveryData(location, debouncedFilters);
    }
  }, [location, locationPermission, debouncedFilters, fetchDiscoveryData]);

  // If permission is unasked or prompting, display permission modal
  if (locationPermission === 'unknown' || locationPermission === 'prompt') {
    return (
      <DashboardLayout>
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
      </DashboardLayout>
    );
  }

  const onlineVolunteersCount = volunteers.filter(v => v.is_online === 1 || v.is_online === true).length;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Modern Hero Banner Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-900 text-white p-6 sm:p-8 shadow-pb-modal border border-white/10">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Title & Subtitle */}
            <div className="max-w-xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-violet-200 text-xs font-semibold tracking-wider uppercase border border-white/10">
                <Compass className="w-3.5 h-3.5 text-violet-400 animate-spin-slow" />
                Live Volunteer Network
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Discover Nearby Volunteers & Squads
              </h1>
              <p className="text-violet-200/80 text-sm leading-relaxed">
                Connect directly with verified logistics volunteers in your area for immediate, zero-waste food and relief pickups.
              </p>
            </div>

            {/* Live Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center min-w-[95px]">
                <p className="text-[10px] font-bold text-violet-200 uppercase tracking-wider">Volunteers</p>
                <p className="text-xl font-extrabold text-white mt-0.5">{volunteers.length}</p>
                <span className="text-[10px] text-emerald-400 font-semibold">{onlineVolunteersCount} online</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center min-w-[95px]">
                <p className="text-[10px] font-bold text-violet-200 uppercase tracking-wider">Squads</p>
                <p className="text-xl font-extrabold text-white mt-0.5">{teams.length}</p>
                <span className="text-[10px] text-purple-300 font-semibold">Active Teams</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center min-w-[95px]">
                <p className="text-[10px] font-bold text-violet-200 uppercase tracking-wider">Avg. ETA</p>
                <p className="text-xl font-extrabold text-white mt-0.5">~15m</p>
                <span className="text-[10px] text-violet-300 font-semibold">Fast Pickup</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center min-w-[95px]">
                <p className="text-[10px] font-bold text-violet-200 uppercase tracking-wider">Radius</p>
                <p className="text-xl font-extrabold text-white mt-0.5">{filters.radius}km</p>
                <span className="text-[10px] text-indigo-300 font-semibold">Search Range</span>
              </div>
            </div>

          </div>

          {/* Quick Location Presets Bar */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-violet-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Areas:
            </span>
            {QUICK_LOCATION_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPresetLocation(preset)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all backdrop-blur-md border cursor-pointer ${
                  location?.address === preset.name
                    ? 'bg-white text-violet-900 border-white font-bold shadow-sm'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

        </div>

        {/* Top Control Toolbar (View Mode Switcher + Location Bar) */}
        <div className="space-y-4">
          <CurrentLocation
            location={location}
            onRefresh={handleRefreshLocation}
            isRefreshing={isRefreshingLocation}
            onManualLocation={handleOpenManualLocation}
          />
        </div>

        {/* Location Denied State */}
        {locationPermission === 'denied' && (
          <LocationDeniedState
            onEnableLocation={() => setLocationPermission('prompt')}
            onManualLocation={handleOpenManualLocation}
          />
        )}

        {/* Main Content Layout */}
        {locationPermission === 'granted' && location && (
          <div className="space-y-4">
            
            {/* View Mode Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface border border-border rounded-2xl p-2 shadow-pb-card">
              
              {/* Volunteers / Teams Tab Switcher */}
              <div className="flex items-center gap-1 bg-page p-1 rounded-xl border border-border">
                <button
                  onClick={() => setShowTeams(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    !showTeams
                      ? 'bg-dash-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Volunteers</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    !showTeams ? 'bg-white/20 text-white' : 'bg-surface text-text-secondary'
                  }`}>
                    {volunteers.length}
                  </span>
                </button>

                <button
                  onClick={() => setShowTeams(true)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    showTeams
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Squad Teams</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    showTeams ? 'bg-white/20 text-white' : 'bg-surface text-text-secondary'
                  }`}>
                    {teams.length}
                  </span>
                </button>
              </div>

              {/* View Layout Mode (List, Map, Split) */}
              <div className="flex items-center gap-1 bg-page p-1 rounded-xl border border-border self-end sm:self-auto" role="group" aria-label="View mode">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-surface text-text-primary shadow-2xs border border-border'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">List</span>
                </button>

                <button
                  onClick={() => setViewMode('split')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'split'
                      ? 'bg-surface text-text-primary shadow-2xs border border-border'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  aria-label="Split view"
                >
                  <div className="w-3.5 h-3.5 flex gap-0.5 items-center">
                    <div className="w-1.5 h-3 bg-current rounded-xs" />
                    <div className="w-1.5 h-3 bg-current rounded-xs" />
                  </div>
                  <span className="hidden sm:inline">Split</span>
                </button>

                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'map'
                      ? 'bg-surface text-text-primary shadow-2xs border border-border'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  aria-label="Map view"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Map</span>
                </button>
              </div>

            </div>

            {/* Split / List Grid Area */}
            <div className={`grid gap-6 ${
              viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
            }`}>
              
              {/* Left Column - Filters & Cards List */}
              {viewMode !== 'map' && (
                <div className={`space-y-4 ${viewMode === 'split' ? 'lg:col-span-6 xl:col-span-5' : ''}`}>
                  
                  {/* Filter Toolbar */}
                  <DiscoveryFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onReset={handleResetFilters}
                    totalCount={showTeams ? teams.length : volunteers.length}
                  />

                  {/* Loading Skeleton */}
                  {loading && (
                    <DiscoveryEmptyStates type="loading" />
                  )}

                  {/* Error State */}
                  {error && !loading && (
                    <ErrorState error={error} onRetry={() => fetchDiscoveryData(location, debouncedFilters)} />
                  )}

                  {/* Empty Results State */}
                  {!loading && !error && volunteers.length === 0 && teams.length === 0 && (
                    <NoVolunteersState
                      onExpandRadius={handleExpandRadius}
                      onResetFilters={handleResetFilters}
                    />
                  )}

                  {/* Volunteers Card List */}
                  {!loading && !error && !showTeams && volunteers.length > 0 && (
                    <div className="grid gap-4">
                      {volunteers.map((volunteer) => (
                        <VolunteerCard
                          key={volunteer.id}
                          volunteer={volunteer}
                          onViewDetails={handleVolunteerClick}
                          onRequestPickup={handleRequestPickup}
                          disabled={false}
                        />
                      ))}
                    </div>
                  )}

                  {/* Teams Card List */}
                  {!loading && !error && showTeams && teams.length > 0 && (
                    <div className="grid gap-4">
                      {teams.map((team) => (
                        <TeamCard
                          key={team.id}
                          team={team}
                          onViewDetails={handleTeamClick}
                          onRequestPickup={handleRequestPickup}
                          disabled={false}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Right Column - Map Display */}
              {(viewMode === 'map' || viewMode === 'split') && (
                <div className={`${
                  viewMode === 'split' 
                    ? 'lg:col-span-6 xl:col-span-7 lg:sticky lg:top-20 lg:self-start' 
                    : 'w-full'
                }`}>
                  <VolunteerMap
                    userLocation={location}
                    volunteers={volunteers}
                    teams={teams}
                    onVolunteerClick={handleVolunteerClick}
                    onTeamClick={handleTeamClick}
                    className="h-[520px] lg:h-[680px]"
                  />
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* Manual Location Entry Modal */}
      <ManualLocationModal
        isOpen={showManualLocationModal}
        onClose={() => setShowManualLocationModal(false)}
        onSubmit={handleManualLocationSubmit}
      />

      {/* Interactive Quick Detail Modal */}
      <VolunteerDetailModal
        item={selectedItem}
        isTeam={isDetailItemTeam}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onRequestPickup={handleRequestPickup}
      />

    </DashboardLayout>
  );
};

export { VolunteerDiscoveryPage };
export default VolunteerDiscoveryPage;
