import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  LayoutGrid, 
  List, 
  Plus, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { donationApi } from '../services/donationApi';
import { DonationCard } from '../components/donation/DonationCard';
import { DonationTable } from '../components/donation/DonationTable';
import { EmptyState } from '../components/dashboard/EmptyState';
import { ErrorState } from '../components/dashboard/ErrorState';
import { Button } from '../components/common/Button';
import { Package } from 'lucide-react';

/**
 * MyDonationsPage - Donation Management Center
 * Complete donation management workspace for donors
 */
export function MyDonationsPage() {
  const navigate = useNavigate();

  // State
  const [donations, setDonations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    // Load saved view mode from localStorage
    const saved = localStorage.getItem('donationViewMode');
    return saved === 'table' ? 'table' : 'grid';
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);

  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [, setCancellingId] = useState(null);

  const activeFilterCount = [categoryFilter, statusFilter].filter(Boolean).length;

  const loadDonations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters = {
        search: searchQuery || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
        page,
        limit,
      };

      const result = await donationApi.getDonorHistory(filters);

      if (result.success) {
        setDonations(result.data.donations || []);
        setTotal(result.data.pagination?.total || 0);
      } else {
        setError(result.error);
      }
    } catch {
      setError('Failed to load donations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, statusFilter, sortBy, sortOrder, page, limit]);

  const loadSummary = useCallback(async () => {
    try {
      const result = await donationApi.getDonorHistorySummary();
      if (result.success) {
        setSummary(result.data);
      }
    } catch {
      // Failed to load summary
    }
  }, []);

  // Load donations on mount and when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern used throughout this codebase
    loadDonations();
  }, [loadDonations]);

  // Load summary on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern used throughout this codebase
    loadSummary();
  }, [loadSummary]);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('donationViewMode', viewMode);
  }, [viewMode]);

  const handleFilterChange = (filter, value) => {
    if (filter === 'category') setCategoryFilter(value);
    if (filter === 'status') setStatusFilter(value);
    setPage(1); // Reset to first page on filter change
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDetails = (donationId) => {
    navigate(`/donations/${donationId}`);
  };

  const handleEdit = (donationId) => {
    navigate(`/donation/create?edit=${donationId}`);
  };

  const handleCancel = async (donationId) => {
    if (!window.confirm('Are you sure you want to cancel this donation?')) {
      return;
    }

    setCancellingId(donationId);

    try {
      const result = await donationApi.cancelDonation(donationId);

      if (result.success) {
        // Reload donations
        loadDonations();
        loadSummary();
      } else {
        alert(result.error || 'Failed to cancel donation');
      }
    } catch {
      alert('Failed to cancel donation. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-3"
        >
          <ArrowLeft size={16} />
          <span className="font-medium">Back</span>
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              My Donations
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              {summary ? `${summary.totalDonations || 0} donation${summary.totalDonations === 1 ? '' : 's'} total` : 'Track and manage everything you\u2019ve given'}
            </p>
          </div>
          <Button onClick={() => navigate('/donation/create')} icon={Plus}>
            Create Donation
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Total"
            value={summary.totalDonations || 0}
            color="primary"
          />
          <StatCard
            label="Completed"
            value={summary.completed || 0}
            color="success"
          />
          <StatCard
            label="Pending"
            value={summary.pending || 0}
            color="warning"
          />
          <StatCard
            label="Cancelled"
            value={summary.cancelled || 0}
            color="danger"
          />
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-surface rounded-xl shadow-pb-card border border-border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:w-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search by title, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg bg-input text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary transition-all"
                aria-label="Search donations"
              />
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-colors shrink-0 ${
                showFilters || activeFilterCount > 0
                  ? 'border-dash-primary bg-dash-primary-soft text-dash-primary'
                  : 'border-border bg-page text-text-secondary hover:bg-surface-hover'
              }`}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal size={15} />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-dash-primary text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5" role="group" aria-label="View mode">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-dash-primary text-white'
                  : 'text-text-secondary hover:bg-surface-hover'
              }`}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-dash-primary text-white'
                  : 'text-text-secondary hover:bg-surface-hover'
              }`}
              aria-label="Table view"
              aria-pressed={viewMode === 'table'}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-input text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary transition-all cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="food">Food</option>
                <option value="clothes">Clothes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-input text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary transition-all cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="scheduled">Scheduled</option>
                <option value="on_the_way">On The Way</option>
                <option value="picked_up">Picked Up</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('');
                  setStatusFilter('');
                  setSortBy('created_at');
                  setSortOrder('desc');
                  setPage(1);
                }}
                disabled={activeFilterCount === 0 && !searchQuery}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-border bg-page text-sm text-text-primary hover:bg-surface-hover transition-all focus:outline-none focus:ring-2 focus:ring-dash-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={14} /> Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          title="Failed to load donations"
          message={error}
          onRetry={loadDonations}
        />
      ) : donations.length === 0 ? (
        (searchQuery || activeFilterCount > 0) ? (
          <EmptyState
            icon={Search}
            title="No matching donations"
            description="No donations match your current search or filters. Try adjusting or clearing them."
            actionLabel="Clear Filters"
            onAction={() => {
              setSearchQuery('');
              setCategoryFilter('');
              setStatusFilter('');
              setPage(1);
            }}
          />
        ) : (
          <EmptyState
            icon={Package}
            title="No donations yet"
            description="You haven't created any donations yet. Start by creating your first donation to help those in need."
            actionLabel="Create Donation"
            onAction={() => navigate('/donation/create')}
          />
        )
      ) : (
        <>
          {/* Results */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {donations.map((donation, index) => (
                <div
                  key={donation.id}
                  style={{
                    animation: 'rowIn 0.25s ease backwards',
                    // Cap the stagger delay so long lists don't feel sluggish —
                    // everything past the first ~10 cards animates together.
                    animationDelay: `${Math.min(index, 10) * 25}ms`,
                  }}
                >
                  <DonationCard
                    donation={donation}
                    onViewDetails={handleViewDetails}
                    onEdit={handleEdit}
                    onCancel={handleCancel}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface rounded-xl shadow-pb-card border border-border overflow-hidden">
              <DonationTable
                donations={donations}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onCancel={handleCancel}
              />
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <p className="text-xs text-text-muted">
                Page {page} of {totalPages} &middot; {total} total
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  aria-label="Previous page"
                  className="p-2 rounded-lg border border-border bg-page text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                  .map((pageNum, idx, arr) => (
                    <span key={pageNum} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== pageNum - 1 && (
                        <span className="px-1 text-text-muted text-sm">&hellip;</span>
                      )}
                      <button
                        onClick={() => handlePageChange(pageNum)}
                        aria-current={pageNum === page ? 'page' : undefined}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-dash-primary/40 ${
                          pageNum === page
                            ? 'bg-dash-primary text-white'
                            : 'border border-border bg-page text-text-primary hover:bg-surface-hover'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </span>
                  ))}

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  aria-label="Next page"
                  className="p-2 rounded-lg border border-border bg-page text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * StatCard component for displaying statistics
 */
function StatCard({ label, value, color }) {
  const colorClasses = {
    primary: {
      bg: 'bg-dash-primary-soft',
      text: 'text-dash-primary',
      border: 'border-dash-primary/20',
    },
    success: {
      bg: 'bg-success-soft',
      text: 'text-success',
      border: 'border-success/20',
    },
    warning: {
      bg: 'bg-warning-soft',
      text: 'text-warning',
      border: 'border-warning/20',
    },
    danger: {
      bg: 'bg-danger-soft',
      text: 'text-danger',
      border: 'border-danger/20',
    },
  };

  const classes = colorClasses[color] || colorClasses.primary;

  return (
    <div className={`p-3.5 rounded-lg border ${classes.bg} ${classes.border}`}>
      <p className={`text-xs font-semibold ${classes.text} mb-1`}>{label}</p>
      <p className="text-xl font-bold text-text-primary">{value}</p>
    </div>
  );
}

/**
 * LoadingState component
 */
function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-surface rounded-xl border border-border overflow-hidden shadow-pb-card">
          <div className="aspect-video bg-surface-hover animate-pulse" />
          <div className="p-4 space-y-2.5">
            <div className="h-4 bg-surface-hover rounded animate-pulse" />
            <div className="h-3 bg-surface-hover rounded animate-pulse w-2/3" />
            <div className="h-3 bg-surface-hover rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
