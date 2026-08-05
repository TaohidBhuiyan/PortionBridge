import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Plus, 
  ArrowLeft,
  ChevronDown,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { donationApi } from '../services/donationApi';
import { DonationCard } from '../components/donation/DonationCard';
import { DonationTable } from '../components/donation/DonationTable';
import { EmptyState } from '../components/dashboard/EmptyState';
import { ErrorState } from '../components/dashboard/ErrorState';
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
    return saved || 'card';
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [total, setTotal] = useState(0);

  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  // Load donations on mount and when filters change
  useEffect(() => {
    loadDonations();
  }, [searchQuery, categoryFilter, statusFilter, sortBy, sortOrder, page, limit]);

  // Load summary on mount
  useEffect(() => {
    loadSummary();
  }, []);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('donationViewMode', viewMode);
  }, [viewMode]);

  const loadDonations = async () => {
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
    } catch (err) {
      setError('Failed to load donations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const result = await donationApi.getDonorHistorySummary();
      if (result.success) {
        setSummary(result.data);
      }
    } catch (err) {
      // Failed to load summary
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handleFilterChange = (filter, value) => {
    if (filter === 'category') setCategoryFilter(value);
    if (filter === 'status') setStatusFilter(value);
    setPage(1); // Reset to first page on filter change
  };

  const handleSortChange = (value) => {
    if (value === sortBy) {
      // Toggle order if same sort field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(value);
      setSortOrder('desc');
    }
    setPage(1);
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
    } catch (err) {
      alert('Failed to cancel donation. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Donations
            </h1>
            {summary && (
              <p className="text-gray-600 dark:text-gray-400">
                Total: {summary.totalDonations || 0} donations
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/donation/create')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-400 via-purple-600 to-purple-900 hover:from-purple-500 hover:via-purple-700 hover:to-purple-950 text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label="Create new donation"
          >
            <Plus size={18} />
            Create Donation
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total"
            value={summary.totalDonations || 0}
            color="purple"
          />
          <StatCard
            label="Completed"
            value={summary.completed || 0}
            color="green"
          />
          <StatCard
            label="Pending"
            value={summary.pending || 0}
            color="yellow"
          />
          <StatCard
            label="Cancelled"
            value={summary.cancelled || 0}
            color="red"
          />
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow border-2 border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search donations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                aria-label="Search donations"
              />
            </div>
          </div>
          <div className="flex items-center gap-2" role="group" aria-label="View mode">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              aria-label="Table view"
              aria-pressed={viewMode === 'table'}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t-2 border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="food">Food</option>
                <option value="clothes">Clothes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all appearance-none cursor-pointer"
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
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Clear Filters
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
        <EmptyState
          icon={Package}
          title="No donations yet"
          description="You haven't created any donations yet. Start by creating your first donation to help those in need."
          actionLabel="Create Donation"
          onAction={() => navigate('/donation/create')}
        />
      ) : (
        <>
          {/* Results */}
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {donations.map((donation) => (
                <DonationCard
                  key={donation.id}
                  donation={donation}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEdit}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
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
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <ChevronDown size={20} className="rotate-90" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    pageNum === page
                      ? 'bg-purple-500 text-white'
                      : 'border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <ChevronDown size={20} className="-rotate-90" />
              </button>
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
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-950/30',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-950/30',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800',
    },
    yellow: {
      bg: 'bg-yellow-100 dark:bg-yellow-950/30',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-800',
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-950/30',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
    },
  };

  const classes = colorClasses[color] || colorClasses.purple;

  return (
    <div className={`p-4 rounded-xl border-2 ${classes.bg} ${classes.border}`}>
      <p className={`text-sm font-medium ${classes.text} mb-1`}>{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
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
        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="aspect-video bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
