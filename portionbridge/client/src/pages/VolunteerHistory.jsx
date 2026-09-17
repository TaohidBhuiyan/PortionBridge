import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Search, ChevronLeft, ChevronRight, Utensils, Shirt, Package, MapPin, Calendar, Award, CheckCircle2, Truck, Clock } from 'lucide-react';
import { DashboardLayout } from '../components/dashboard';
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
  { value: 'food', label: 'Food Rescue' },
  { value: 'clothes', label: 'Clothes' },
];

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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);

      const result = await donationApi.getVolunteerHistory({
        search: debouncedSearch || undefined,
        status: status || undefined,
        category: category || undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
        page,
        limit: PAGE_SIZE,
      });

      if (cancelled) return;

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
    return () => { cancelled = true; };
  }, [debouncedSearch, status, category, page, refreshTrigger]);

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
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero Header */}
        <div className="pb-volunteer-hero rounded-2xl p-6 sm:p-7 relative overflow-hidden flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <History size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                Mission History & Impact Log
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                Detailed record of all food & supply rescue assignments completed by you.
              </p>
            </div>
          </div>
        </div>

        {/* Impact Summary Grid */}
        {summaryLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SkeletonCard count={4} />
          </div>
        ) : summaryError ? (
          <ErrorState
            title="Failed to load summary"
            message={summaryError}
            onRetry={() => setRefreshTrigger((t) => t + 1)}
            size="small"
          />
        ) : summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="pb-glass-card pb-hover-lift rounded-2xl p-4 border border-border/60 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Award size={20} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-text-primary tracking-tight">{summary.total ?? 0}</p>
                <p className="text-xs font-semibold text-text-secondary">Total Assigned</p>
              </div>
            </div>

            <div className="pb-glass-card pb-hover-lift rounded-2xl p-4 border border-border/60 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-text-primary tracking-tight">{summary.completed ?? 0}</p>
                <p className="text-xs font-semibold text-text-secondary">Completed</p>
              </div>
            </div>

            <div className="pb-glass-card pb-hover-lift rounded-2xl p-4 border border-border/60 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Truck size={20} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-text-primary tracking-tight">{summary.accepted ?? 0}</p>
                <p className="text-xs font-semibold text-text-secondary">Accepted</p>
              </div>
            </div>

            <div className="pb-glass-card pb-hover-lift rounded-2xl p-4 border border-border/60 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-text-primary tracking-tight">{summary.scheduled ?? 0}</p>
                <p className="text-xs font-semibold text-text-secondary">Scheduled</p>
              </div>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="pb-glass-card rounded-2xl p-4 sm:p-5 border border-border/60 shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search history by title, details..."
              value={search}
              onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary/40 focus:border-dash-primary transition-all"
            />
          </div>
          <select
            value={status}
            onChange={(e) => handleFilterChange(setStatus)(e.target.value)}
            className="px-3.5 py-2.5 border border-border rounded-xl bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary/40 focus:border-dash-primary transition-all"
          >
            {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select
            value={category}
            onChange={(e) => handleFilterChange(setCategory)(e.target.value)}
            className="px-3.5 py-2.5 border border-border rounded-xl bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary/40 focus:border-dash-primary transition-all"
          >
            {CATEGORY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        {/* History Item Cards */}
        {loading ? (
          <div className="space-y-3">
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
            title="No missions found in your history"
            description="Missions you accept will show up here once assigned to you."
            showAction={false}
          />
        ) : (
          <>
            <div className="space-y-3">
              {donations.map((donation, index) => {
                const CategoryIcon = CATEGORY_ICON[donation.category] || Package;
                return (
                  <div
                    key={donation.id}
                    onClick={() => navigate(`/donations/${donation.id}`)}
                    style={{ animation: 'rowIn 0.25s ease backwards', animationDelay: `${index * 35}ms` }}
                    className="pb-glass-card pb-hover-lift flex items-center justify-between p-4 rounded-2xl border border-border/70 hover:border-dash-primary/40 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dash-primary/10 to-indigo-500/10 text-dash-primary flex items-center justify-center shrink-0 border border-dash-primary/20">
                        <CategoryIcon size={18} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-bold text-text-primary truncate">
                            {donation.title || `${donation.category} donation`}
                          </p>
                          <StatusBadge status={donation.status} size="small" />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                          {donation.pickup_location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} className="text-rose-500 shrink-0" />
                              <span className="truncate max-w-[200px]">{donation.pickup_location}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-text-muted">
                            <Calendar size={11} />
                            {donation.completed_at ? `Completed ${formatDate(donation.completed_at)}` : `Assigned ${formatDate(donation.created_at)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
