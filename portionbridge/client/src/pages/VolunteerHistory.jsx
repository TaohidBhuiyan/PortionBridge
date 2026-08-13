import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, History, Search, ChevronLeft, ChevronRight, Utensils, Shirt, Package, MapPin, Calendar } from 'lucide-react';
import { donationApi } from '../services/donationApi';
import { StatusBadge } from '../components/donation/StatusBadge';
import { EmptyState } from '../components/dashboard/EmptyState';
import { ErrorState } from '../components/dashboard/ErrorState';
import { SkeletonCard } from '../components/dashboard/skeletons';

const CATEGORY_ICON = { food: Utensils, clothes: Shirt };
const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'on_the_way', label: 'On the Way' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];
const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'food', label: 'Food' },
  { value: 'clothes', label: 'Clothes' },
];

/**
 * VolunteerHistory — PHASE 5. Mission History page.
 *
 * Backed entirely by the endpoints Phase 1 re-enabled:
 *   GET /donations/assigned-history          (list, filtered/paginated)
 *   GET /donations/assigned-history/summary  (status counts)
 * No new backend routes. Filters exposed here are exactly the ones
 * historyQueryValidationRules accepts (status, category, search, sortBy,
 * sortOrder) — nothing the backend can't actually process.
 */
export function VolunteerHistory() {
  const navigate = useNavigate();

  const [donations, setDonations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const result = await donationApi.getVolunteerHistory({
        search: search || undefined,
        status: status || undefined,
        category: category || undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
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

    load();
  }, [search, status, category, page, refreshTrigger]);

  useEffect(() => {
    const loadSummary = async () => {
      setSummaryLoading(true);
      setSummaryError(null);

      const result = await donationApi.getVolunteerHistorySummary();

      if (result.success) {
        setSummary(result.data?.summary || null);
      } else {
        setSummaryError(result.error);
      }

      setSummaryLoading(false);
    };

    loadSummary();
  }, [refreshTrigger]);

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const totalPages = meta?.totalPages || 1;

  const formatDate = (value) => {
    if (!value) return null;
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-6xl mx-auto">
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
            <History size={20} className="text-dash-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Mission History</h1>
            <p className="text-text-secondary text-sm mt-0.5">All the missions you've been assigned.</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <SkeletonCard count={4} />
        </div>
      ) : summaryError ? (
        <div className="mb-6">
          <ErrorState
            title="Failed to load summary"
            message={summaryError}
            onRetry={() => setRefreshTrigger((t) => t + 1)}
            size="small"
          />
        </div>
      ) : summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-surface rounded-lg border border-border/50 p-3">
            <p className="text-xl font-semibold text-text-primary">{summary.total ?? 0}</p>
            <p className="text-[11px] font-medium text-text-secondary">Total Assigned</p>
          </div>
          <div className="bg-surface rounded-lg border border-border/50 p-3">
            <p className="text-xl font-semibold text-text-primary">{summary.completed ?? 0}</p>
            <p className="text-[11px] font-medium text-text-secondary">Completed</p>
          </div>
          <div className="bg-surface rounded-lg border border-border/50 p-3">
            <p className="text-xl font-semibold text-text-primary">{summary.accepted ?? 0}</p>
            <p className="text-[11px] font-medium text-text-secondary">Accepted</p>
          </div>
          <div className="bg-surface rounded-lg border border-border/50 p-3">
            <p className="text-xl font-semibold text-text-primary">{summary.scheduled ?? 0}</p>
            <p className="text-[11px] font-medium text-text-secondary">Scheduled</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search history..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
                aria-label="Search mission history"
              />
            </div>
          </div>
          <select
            value={status}
            onChange={(e) => handleFilterChange(setStatus)(e.target.value)}
            className="px-3 py-2.5 border border-border rounded-xl bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select
            value={category}
            onChange={(e) => handleFilterChange(setCategory)(e.target.value)}
            className="px-3 py-2.5 border border-border rounded-xl bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
            aria-label="Filter by category"
          >
            {CATEGORY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-2">
          <SkeletonCard count={5} />
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load mission history"
          message={error}
          onRetry={() => setRefreshTrigger((t) => t + 1)}
        />
      ) : donations.length === 0 ? (
        <EmptyState
          icon={History}
          title="No missions in your history yet"
          description="Missions you accept will show up here once they're assigned to you."
          showAction={false}
        />
      ) : (
        <>
          <div className="space-y-2 mb-6">
            {donations.map((donation) => {
              const CategoryIcon = CATEGORY_ICON[donation.category] || Package;
              return (
                <div
                  key={donation.id}
                  onClick={() => navigate(`/donations/${donation.id}`)}
                  className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border hover:border-dash-primary/30 hover:bg-surface-hover cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-dash-primary-soft flex items-center justify-center shrink-0">
                    <CategoryIcon size={18} className="text-dash-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {donation.title || `${donation.category} donation`}
                      </p>
                      <StatusBadge status={donation.status} size="small" />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-secondary">
                      {donation.pickup_location && (
                        <span className="flex items-center gap-1"><MapPin size={10} />{donation.pickup_location}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {donation.completed_at ? `Completed ${formatDate(donation.completed_at)}` : `Assigned ${formatDate(donation.created_at)}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

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
              <span className="text-sm text-text-secondary">Page {page} of {totalPages}</span>
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
