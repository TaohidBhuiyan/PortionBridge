import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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
  Download,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { donationApi } from '../services/donationApi';
import { DonationCard } from '../components/donation/DonationCard';
import { DonationTable } from '../components/donation/DonationTable';
import { EmptyState } from '../components/dashboard/EmptyState';
import { ErrorState } from '../components/dashboard/ErrorState';
import { DashboardLayout } from '../components/dashboard';
import { Button } from '../components/common/Button';
import { ConfirmActionModal } from '../components/common/ConfirmActionModal';
import { Package } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  const [confirmCancelId, setConfirmCancelId] = useState(null);

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
    setConfirmCancelId(donationId);
  };

  const handleConfirmCancel = async () => {
    if (!confirmCancelId) return;

    setCancellingId(confirmCancelId);

    try {
      const result = await donationApi.cancelDonation(confirmCancelId);

      if (result.success) {
        toast.success('Donation cancelled successfully');
        // Reload donations
        loadDonations();
        loadSummary();
      } else {
        toast.error(result.error || 'Failed to cancel donation');
      }
    } catch {
      toast.error('Failed to cancel donation. Please try again.');
    } finally {
      setCancellingId(null);
      setConfirmCancelId(null);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (donations.length === 0) {
      toast.error('No donations to export');
      return;
    }

    const headers = ['Title', 'Category', 'Status', 'Quantity', 'Unit', 'Pickup Date', 'Created At'];
    const rows = donations.map(d => [
      d.title,
      d.category,
      d.status,
      d.quantity,
      d.quantity_unit,
      d.pickup_date ? new Date(d.pickup_date).toLocaleDateString() : 'N/A',
      d.created_at ? new Date(d.created_at).toLocaleDateString() : 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `donation-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully');
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (donations.length === 0) {
      toast.error('No donations to export');
      return;
    }

    const doc = new jsPDF();
    const tableColumn = ['Title', 'Category', 'Status', 'Quantity', 'Unit', 'Pickup Date'];
    const tableRows = donations.map(d => [
      d.title,
      d.category,
      d.status,
      d.quantity,
      d.quantity_unit,
      d.pickup_date ? new Date(d.pickup_date).toLocaleDateString() : 'N/A',
    ]);

    doc.setFontSize(18);
    doc.text('Donation History', 14, 22);
    doc.setFontSize(11);
    doc.text(`Exported on ${new Date().toLocaleDateString()}`, 14, 30);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
      },
    });

    doc.save(`donation-history-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exported successfully');
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto pb-12 space-y-6">
          {/* Hero Header Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dash-primary via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-xl">
            {/* Background Decorative Circles */}
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute right-1/3 -top-12 w-48 h-48 bg-purple-400/20 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium backdrop-blur-md transition-colors mb-3"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Dashboard</span>
                </button>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                  <Package className="w-8 h-8 text-amber-300 shrink-0" />
                  My Donation History
                </h1>
                <p className="text-white/80 text-sm mt-1 max-w-xl">
                  {summary
                    ? `You've created ${summary.total || 0} donation mission${summary.total === 1 ? '' : 's'} to nourish communities.`
                    : 'Track, manage, and export all your contributions in one place.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleExportCSV}
                  disabled={donations.length === 0}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  title="Export to CSV"
                >
                  <FileSpreadsheet size={16} className="text-emerald-300" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={donations.length === 0}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  title="Export to PDF"
                >
                  <FileText size={16} className="text-rose-300" />
                  <span>Export PDF</span>
                </button>
                <button
                  onClick={() => navigate('/donation/create')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-dash-primary hover:bg-white/90 font-bold text-xs shadow-lg hover:shadow-white/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus size={16} />
                  <span>Create Donation</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Strip */}
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10">
                  <p className="text-[11px] font-medium text-white/70 uppercase tracking-wider">Total Donations</p>
                  <p className="text-2xl font-extrabold mt-0.5">{summary.total || 0}</p>
                </div>
                <div className="bg-emerald-500/20 backdrop-blur-md rounded-xl p-3.5 border border-emerald-400/20">
                  <p className="text-[11px] font-medium text-emerald-200 uppercase tracking-wider">Completed</p>
                  <p className="text-2xl font-extrabold text-emerald-300 mt-0.5">{summary.completed || 0}</p>
                </div>
                <div className="bg-amber-500/20 backdrop-blur-md rounded-xl p-3.5 border border-amber-400/20">
                  <p className="text-[11px] font-medium text-amber-200 uppercase tracking-wider">In Progress / Pending</p>
                  <p className="text-2xl font-extrabold text-amber-300 mt-0.5">{summary.pending || 0}</p>
                </div>
                <div className="bg-rose-500/20 backdrop-blur-md rounded-xl p-3.5 border border-rose-400/20">
                  <p className="text-[11px] font-medium text-rose-200 uppercase tracking-wider">Cancelled</p>
                  <p className="text-2xl font-extrabold text-rose-300 mt-0.5">{summary.cancelled || 0}</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls Bar: Search, Category Quick Pills, and View Mode */}
          <div className="bg-surface rounded-2xl shadow-pb-card border border-border p-4 space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search by donation title, category, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-input text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary transition-all"
                  aria-label="Search donations"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* View Toggle & Filter Modal Button */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    showFilters || activeFilterCount > 0
                      ? 'border-dash-primary bg-dash-primary-soft text-dash-primary shadow-sm'
                      : 'border-border bg-page text-text-secondary hover:bg-surface-hover'
                  }`}
                  aria-expanded={showFilters}
                >
                  <SlidersHorizontal size={15} />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-dash-primary text-white text-[10px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-1 bg-surface-hover p-1 rounded-xl border border-border" role="group" aria-label="View mode">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-surface text-dash-primary shadow-sm font-semibold'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                    aria-label="Grid view"
                    aria-pressed={viewMode === 'grid'}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'table'
                        ? 'bg-surface text-dash-primary shadow-sm font-semibold'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                    aria-label="Table view"
                    aria-pressed={viewMode === 'table'}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Category Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-medium">
              <span className="text-text-muted text-[11px] font-semibold uppercase tracking-wider shrink-0 mr-1">Category:</span>
              <button
                onClick={() => handleFilterChange('category', '')}
                className={`px-3 py-1.5 rounded-full transition-all shrink-0 ${
                  !categoryFilter
                    ? 'bg-dash-primary text-white font-semibold shadow-sm'
                    : 'bg-surface-hover text-text-secondary hover:text-text-primary border border-border'
                }`}
              >
                All Categories
              </button>
              <button
                onClick={() => handleFilterChange('category', 'food')}
                className={`px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
                  categoryFilter === 'food'
                    ? 'bg-amber-500 text-white font-semibold shadow-sm'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                }`}
              >
                <span>🍲</span> Food Initiative
              </button>
              <button
                onClick={() => handleFilterChange('category', 'clothes')}
                className={`px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
                  categoryFilter === 'clothes'
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20'
                }`}
              >
                <span>👕</span> Clothing & Wear
              </button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                    Category Filter
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-input text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary transition-all cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    <option value="food">Food</option>
                    <option value="clothes">Clothes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                    Status Filter
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-input text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary transition-all cursor-pointer"
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
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-page text-sm text-text-primary hover:bg-surface-hover transition-all focus:outline-none focus:ring-2 focus:ring-dash-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={14} /> Clear All Filters
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
                title="No matching donations found"
                description="No donations match your search parameters. Try adjusting or clearing your filters."
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
                title="No donations posted yet"
                description="You haven't created any donation listings yet. Share your excess food or clothing to help families in need today."
                actionLabel="Create First Donation"
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
                      className="transition-transform duration-200 hover:-translate-y-1"
                      style={{
                        animation: 'rowIn 0.25s ease backwards',
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
                <div className="bg-surface rounded-2xl shadow-pb-card border border-border overflow-hidden">
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-4 border-t border-border">
                  <p className="text-xs text-text-muted">
                    Showing Page <span className="font-semibold text-text-primary">{page}</span> of <span className="font-semibold text-text-primary">{totalPages}</span> ({total} total items)
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      aria-label="Previous page"
                      className="p-2 rounded-xl border border-border bg-surface text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-dash-primary/40 shadow-sm"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                      .map((pageNum, idx, arr) => (
                        <span key={pageNum} className="flex items-center">
                          {idx > 0 && arr[idx - 1] !== pageNum - 1 && (
                            <span className="px-1.5 text-text-muted text-xs">&hellip;</span>
                          )}
                          <button
                            onClick={() => handlePageChange(pageNum)}
                            aria-current={pageNum === page ? 'page' : undefined}
                            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-dash-primary/40 ${
                              pageNum === page
                                ? 'bg-dash-primary text-white shadow-md'
                                : 'border border-border bg-surface text-text-primary hover:bg-surface-hover'
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
                      className="p-2 rounded-xl border border-border bg-surface text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-dash-primary/40 shadow-sm"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DashboardLayout>

      <ConfirmActionModal
        isOpen={Boolean(confirmCancelId)}
        onClose={() => setConfirmCancelId(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Donation"
        message="Are you sure you want to cancel this donation? This action cannot be undone."
        confirmLabel="Cancel Donation"
        tone="danger"
      />
    </>
  );
}

/**
 * LoadingState component
 */
function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-surface rounded-2xl border border-border overflow-hidden shadow-pb-card p-4 space-y-4 animate-pulse">
          <div className="aspect-video bg-surface-hover rounded-xl" />
          <div className="space-y-2.5">
            <div className="h-4 bg-surface-hover rounded w-3/4" />
            <div className="h-3 bg-surface-hover rounded w-1/2" />
            <div className="h-3 bg-surface-hover rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
