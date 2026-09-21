import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Compass, MapPin, AlertTriangle, Filter, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../components/dashboard';
import { donationApi } from '../services/donationApi';
import { profileApi } from '../services/profileApi';
import { teamApi } from '../services/teamApi';
import { useAuth } from '../context/AuthContext';
import { DonationCard } from '../components/donation/DonationCard';
import { EmptyState } from '../components/dashboard/EmptyState';
import { ErrorState } from '../components/dashboard/ErrorState';
import { SkeletonCard } from '../components/dashboard/skeletons';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'food', label: 'Food Rescue' },
  { value: 'clothes', label: 'Clothes & Wearables' },
];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest First' },
  { value: 'pickup_time', label: 'Pickup Time' },
  { value: 'quantity', label: 'Quantity' },
];

const PAGE_SIZE = 9;
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 50;
const DEFAULT_RADIUS_KM = 10;

export function VolunteerOpportunities() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);

  // Phase 4: team leaders can accept a donation on behalf of their team
  // instead of (or as well as) individually — fetched once, not part of
  // the donation-list refresh cycle.
  const [myTeam, setMyTeam] = useState(null);
  useEffect(() => {
    let cancelled = false;
    teamApi.getMyTeam().then((result) => {
      if (!cancelled && result.success && result.data?.team) {
        setMyTeam(result.data.team);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const isTeamLeader = Boolean(myTeam && user && myTeam.leader_id === user.id);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [radius, setRadius] = useState(DEFAULT_RADIUS_KM);
  const [radiusTouched, setRadiusTouched] = useState(false);

  // Phase 3: nearby-donation discovery is always centered on the
  // volunteer's own persisted base location — never a client-sent/live-GPS
  // coordinate (the backend ignores those now; only `nearby`+`radius` are
  // sent). radius is still the volunteer's own choice.
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

  const hasLocation = savedLocation !== null;
  const effectiveRadius = radiusTouched || !savedLocation ? radius : savedLocation.coverageRadius;

  const [debouncedRadius, setDebouncedRadius] = useState(DEFAULT_RADIUS_KM);
  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedRadius(effectiveRadius), 400);
    return () => clearTimeout(timeoutId);
  }, [effectiveRadius]);

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
          nearby: true,
          radius: debouncedRadius,
        }),
      });

      if (result.success) {
        setDonations(result.data?.donations || []);
        setMeta(result.meta || null);
      } else {
        if (result.status === 403 && result.error?.includes('Set your base address')) {
          setError('Set your base address first — this is what donors near you and the nearby-donation radius are both based on.');
        } else {
          setError(result.error);
        }
        setDonations([]);
      }

      setLoading(false);
    };

    loadOpportunities();
  }, [search, locationFilter, category, sortBy, sortOrder, page, refreshTrigger, hasLocation, debouncedRadius]);

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
    if (acceptingId) return;
    setAcceptingId(donationId);

    const result = await donationApi.acceptDonation(donationId);

    if (result.success) {
      toast.success('Donation accepted! Check your Active Mission on the dashboard.');
      setRefreshTrigger((t) => t + 1);
    } else if (result.status === 409) {
      toast.error('This donation is no longer available.');
      setRefreshTrigger((t) => t + 1);
    } else if (result.status === 401) {
      toast.error('Your session has expired. Please log in again.');
    } else if (result.status === 403 && result.error?.includes('coverage radius')) {
      // Phase 3: accept-time radius check — this donation was outside the
      // volunteer's own coverage radius (can happen even for a donation
      // seen in the unfiltered/full list, since browsing without `nearby`
      // isn't itself a radius guarantee).
      toast.error(result.error);
      setRefreshTrigger((t) => t + 1);
    } else if (result.status === 403 && result.error?.includes('no pickup location on file')) {
      toast.error(result.error);
    } else if (result.status === 403 && result.error?.includes('Set your base address')) {
      toast.error(result.error);
    } else if (result.status === 403) {
      toast.error("You don't have permission to accept this donation.");
    } else {
      toast.error(result.error || 'Failed to accept donation. Please try again.');
    }

    setAcceptingId(null);
  };

  const handleAcceptForTeam = async (donationId) => {
    if (acceptingId || !myTeam) return;
    setAcceptingId(donationId);

    const result = await donationApi.acceptDonationForTeam(donationId, myTeam.id);

    if (result.success) {
      toast.success(`Donation accepted for ${myTeam.name}! Assign a pickup member from the mission page.`);
      setRefreshTrigger((t) => t + 1);
    } else if (result.status === 409) {
      toast.error('This donation is no longer available.');
      setRefreshTrigger((t) => t + 1);
    } else if (result.status === 401) {
      toast.error('Your session has expired. Please log in again.');
    } else if (result.status === 403 && result.error?.includes('coverage radius')) {
      toast.error(result.error);
      setRefreshTrigger((t) => t + 1);
    } else if (result.status === 403 && result.error?.includes('no pickup location on file')) {
      toast.error(result.error);
    } else if (result.status === 403 && result.error?.includes("team's base location")) {
      toast.error(result.error);
    } else if (result.status === 403) {
      toast.error("Your team doesn't have permission to accept this donation.");
    } else {
      toast.error(result.error || 'Failed to accept donation for your team. Please try again.');
    }

    setAcceptingId(null);
  };

  const totalPages = meta?.totalPages || (meta?.totalItems ? Math.ceil(meta.totalItems / PAGE_SIZE) : 1);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero Header */}
        <div className="pb-volunteer-hero rounded-2xl p-6 sm:p-7 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dash-primary to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Compass size={24} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                  Nearby Opportunities
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                  Browse available food & item donation requests around you and start a mission.
                </p>
              </div>
            </div>

            {hasLocation && (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface/80 border border-border/80 shadow-sm">
                <MapPin size={14} className="text-emerald-500" />
                <span className="text-xs font-semibold text-text-primary">
                  Radius: <span className="text-dash-primary">{effectiveRadius} km</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Location Alerts */}
        {!hasLocation && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-4 text-xs sm:text-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-amber-500 shrink-0" />
              <span className="text-text-primary font-medium">
                Set your base address on the dashboard to view nearby donations with exact distances.
              </span>
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="pb-glass-card rounded-2xl p-4 sm:p-5 border border-border/60 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search donation titles, details..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary/40 focus:border-dash-primary transition-all"
              />
            </div>

            <input
              type="text"
              placeholder="Filter location..."
              value={locationFilter}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="px-3.5 py-2.5 border border-border rounded-xl bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary/40 focus:border-dash-primary transition-all min-w-[150px]"
            />

            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-3.5 py-2.5 border border-border rounded-xl bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary/40 focus:border-dash-primary transition-all"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3.5 py-2.5 border border-border rounded-xl bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary/40 focus:border-dash-primary transition-all"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-border rounded-xl bg-surface text-text-primary text-sm font-medium hover:bg-surface-hover transition-colors"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              <ArrowUpDown size={14} /> {sortOrder === 'asc' ? 'Asc' : 'Desc'}
            </button>
          </div>

          {hasLocation && (
            <div className="pt-3 border-t border-border/50 flex flex-col sm:flex-row sm:items-center gap-3">
              <label htmlFor="opportunity-radius" className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider shrink-0">
                <Filter size={14} className="text-dash-primary" />
                Distance Radius: <span className="text-dash-primary font-bold">{effectiveRadius} km</span>
              </label>
              <input
                id="opportunity-radius"
                type="range"
                min={MIN_RADIUS_KM}
                max={MAX_RADIUS_KM}
                step={1}
                value={effectiveRadius}
                onChange={(e) => handleRadiusChange(parseInt(e.target.value, 10))}
                className="w-full max-w-md accent-dash-primary cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Opportunity Cards Grid */}
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
              ? 'Try expanding your distance radius, or check back soon as new requests arrive.'
              : 'Check back soon — new donation requests appear here as donors submit them.'}
            showAction={false}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {donations.map((donation, index) => (
                <div
                  key={donation.id}
                  style={{ animation: 'rowIn 0.25s ease backwards', animationDelay: `${Math.min(index, 10) * 25}ms` }}
                >
                  <DonationCard
                    donation={donation}
                    onAccept={handleAccept}
                    onAcceptForTeam={isTeamLeader ? handleAcceptForTeam : undefined}
                    teamName={myTeam?.name}
                    accepting={acceptingId === donation.id}
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2.5 rounded-xl border border-border bg-surface text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-semibold text-text-primary px-3">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2.5 rounded-xl border border-border bg-surface text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}