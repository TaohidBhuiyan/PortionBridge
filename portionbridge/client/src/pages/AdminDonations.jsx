import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Shirt, Package, Flag } from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { SkeletonTable } from '../components/dashboard/skeletons';
import { AdminPagination } from '../components/dashboard/admin';
import { StatusBadge } from '../components/donation/StatusBadge';
import { adminApi } from '../services/adminApi';

const PAGE_SIZE = 15;
const CATEGORY_ICON = { food: Utensils, clothes: Shirt };

// Each tab maps to the exact filter params admin.model.js#buildAdminDonationFilter
// already supports (status / deleted / reported). "Cancelled" isn't a raw
// `status` value in this schema — cancellation is represented by
// is_deleted = 1 — so it filters on `deleted` instead, matching how
// admin.model.js#getDonationCounts already treats "cancelled".
const TABS = [
  { key: 'all', label: 'All', filters: {} },
  { key: 'pending', label: 'Pending', filters: { status: 'pending' } },
  { key: 'accepted', label: 'Accepted', filters: { status: 'accepted' } },
  { key: 'scheduled', label: 'Scheduled', filters: { status: 'scheduled' } },
  { key: 'on_the_way', label: 'On the Way', filters: { status: 'on_the_way' } },
  { key: 'picked_up', label: 'Picked Up', filters: { status: 'picked_up' } },
  { key: 'completed', label: 'Completed', filters: { status: 'completed' } },
  { key: 'cancelled', label: 'Cancelled', filters: { deleted: true } },
  { key: 'reported', label: 'Reported', filters: { reported: true } },
];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * AdminDonations — "Donations" (Phase 3: Admin Users + Donation Management).
 *
 * Backed by the existing GET /admin/donations endpoint. Every tab except
 * "Reported" was already supported (status/deleted filters existed before
 * this phase); "Reported" uses the new `reported` boolean this phase added
 * to admin.validator.js/admin.model.js, backed by the existing `reports`
 * table via an EXISTS subquery — no duplicate report logic.
 */
export function AdminDonations() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all');
  const [donations, setDonations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const tab = TABS.find((t) => t.key === activeTab) || TABS[0];

    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await adminApi.listDonations({
        ...tab.filters,
        sortBy: 'created_at',
        sortOrder: 'desc',
        page,
        limit: PAGE_SIZE,
      });
      if (cancelled) return;
      if (result.success) {
        setDonations(result.data || []);
        setMeta(result.meta || null);
      } else {
        setError(result.error);
        setDonations([]);
      }
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [activeTab, page, refreshTrigger]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Gradient Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 dark:from-emerald-900 dark:via-teal-900 dark:to-cyan-950 shadow-pb-elevated p-6 md:p-8 text-white">
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-teal-300/20 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-md shadow-inner shrink-0">
                <Package size={28} className="text-white drop-shadow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Donations Overview</h1>
                  {meta?.totalItems !== undefined && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 border border-white/30 backdrop-blur-sm text-white">
                      {meta.totalItems} listed
                    </span>
                  )}
                </div>
                <p className="text-emerald-100/80 text-sm mt-1 max-w-xl">
                  Platform-wide donation monitoring, status tracking, and report flags.
                </p>
              </div>
            </div>

            {/* Quick stats pills */}
            <div className="flex items-center gap-3 self-start md:self-auto bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-2.5 px-4">
              <div className="flex items-center gap-2 pr-3 border-r border-white/20">
                <Utensils className="w-4 h-4 text-emerald-200" />
                <span className="text-xs font-medium text-white/90">Food</span>
              </div>
              <div className="flex items-center gap-2">
                <Shirt className="w-4 h-4 text-teal-200" />
                <span className="text-xs font-medium text-white/90">Clothes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status tabs */}
        <div className="bg-surface rounded-2xl border border-border p-2 shadow-pb-card">
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none" role="tablist" aria-label="Filter donations by status">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleTabChange(tab.key)}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm scale-[1.02]'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  {tab.key === 'reported' && <Flag size={12} className="inline mr-1.5 -mt-0.5" />}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-pb-card">
            <SkeletonTable rows={8} columns={5} />
          </div>
        ) : error ? (
          <ErrorState title="Failed to load donations" message={error} onRetry={() => setRefreshTrigger((t) => t + 1)} />
        ) : donations.length === 0 ? (
          <EmptyState icon={Package} title="No donations found" description="Nothing matches this filter right now." showAction={false} />
        ) : (
          <>
            <div className="bg-surface rounded-2xl border border-border shadow-pb-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-page/60 border-b border-border">
                      <th className="py-3.5 px-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Donation</th>
                      <th className="py-3.5 px-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Donor</th>
                      <th className="py-3.5 px-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Assigned Volunteer</th>
                      <th className="py-3.5 px-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Status</th>
                      <th className="py-3.5 px-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {donations.map((d) => {
                      const CategoryIcon = CATEGORY_ICON[d.category] || Package;
                      const displayStatus = d.is_deleted ? 'cancelled' : d.status;
                      return (
                        <tr
                          key={d.id}
                          onClick={() => navigate(`/admin/donations/${d.id}`)}
                          className="hover:bg-surface-hover/80 transition-all cursor-pointer group"
                        >
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                <CategoryIcon size={16} className="text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <p className="text-sm font-semibold text-text-primary group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate max-w-[220px]">
                                {d.title || `${d.category} donation`}
                              </p>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-xs font-medium text-text-secondary truncate max-w-[140px]">{d.donor_name || '—'}</td>
                          <td className="py-3.5 px-5 text-xs font-medium text-text-secondary truncate max-w-[140px]">
                            {(d.assignment_mode === 'team' ? d.assigned_member_name : d.volunteer_name) || (
                              <span className="italic text-text-secondary/60">Not assigned</span>
                            )}
                          </td>
                          <td className="py-3.5 px-5">
                            <StatusBadge status={displayStatus} size="small" />
                          </td>
                          <td className="py-3.5 px-5 text-xs text-text-secondary font-medium whitespace-nowrap">{formatDate(d.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <AdminPagination page={page} totalPages={meta?.totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
