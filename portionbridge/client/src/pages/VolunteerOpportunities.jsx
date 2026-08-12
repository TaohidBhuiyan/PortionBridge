import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import toast from 'react-hot-toast';
import { donationApi } from '../services/donationApi';
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
// doesn't actually support.
const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest First' },
  { value: 'pickup_time', label: 'Pickup Time' },
  { value: 'quantity', label: 'Quantity' },
];

const PAGE_SIZE = 9;

/**
 * VolunteerOpportunities — browse/discover pending donation requests
 * available for a volunteer to accept.
 *
 * Backed entirely by the existing GET /donations browse endpoint (via
 * donationApi.browseDonations, Phase 3 addition to the existing service —
 * no new discovery API) and PATCH /donations/:id/accept (via
 * donationApi.acceptDonation). No location/distance filtering is exposed
 * beyond the backend's plain text `location` search, since the backend
 * doesn't calculate distance — showing a fabricated "1.2 km" was explicitly
 * out of scope.
 */
export function VolunteerOpportunities() {
  const navigate = useNavigate();

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
  }, [search, locationFilter, category, sortBy, sortOrder, page, refreshTrigger]);

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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back</span>
        </button>
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

      {/* Search and Filters */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-4 mb-6">
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
            {SORT_OPTIONS.map((opt) => (
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
          title="No donation opportunities available right now"
          description="Check back soon — new donation requests appear here as donors submit them."
          showAction={false}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            {donations.map((donation) => (
              <DonationCard
                key={donation.id}
                donation={donation}
                onAccept={handleAccept}
                accepting={acceptingId === donation.id}
              />
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
  );
}