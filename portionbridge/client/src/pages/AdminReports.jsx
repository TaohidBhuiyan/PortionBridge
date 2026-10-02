import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Flag, Package, User, ShieldAlert } from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { SkeletonTable } from '../components/dashboard/skeletons';
import { AdminPagination } from '../components/dashboard/admin';
import { adminApi } from '../services/adminApi';

const PAGE_SIZE = 15;

// "Queue" (pending/reviewed — needs action) vs "History" (resolved/
// dismissed — already closed) share the exact same GET /admin/reports
// endpoint, just a different `status` filter — see
// admin.service.js#listReports. No separate history mechanism.
const TABS = [
  { key: 'queue', label: 'Queue', statuses: ['pending', 'reviewed'] },
  { key: 'history', label: 'History', statuses: ['resolved', 'dismissed'] },
];

const STATUS_TONE = {
  pending: 'bg-warning-soft text-warning',
  reviewed: 'bg-info-soft text-info',
  resolved: 'bg-success-soft text-success',
  dismissed: 'bg-danger-soft text-danger',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * AdminReports — "Reports" (Phase 8: Reports, Moderation and Admin
 * Notifications). Backed by GET /admin/reports, admin-only server-side.
 */
export function AdminReports() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('queue');
  const [targetType, setTargetType] = useState('');
  const [search, setSearch] = useState('');
  const [reports, setReports] = useState([]);
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
      // The queue tab spans two statuses (pending + reviewed); the list
      // endpoint only filters on one at a time, so fetch both (up to the
      // API's max page size each) and merge+paginate client-side, rather
      // than adding a multi-status filter server-side for what's otherwise
      // a single-value `status` param everywhere else. Real server-side
      // pagination across two independently-paginated result sets isn't
      // sound here (page N of status A and page N of status B don't merge
      // into a correct page N of the combined, sorted list), so this
      // fetches everything up to the cap in one shot and paginates the
      // merged array instead of forwarding `page` to the API.
      const results = await Promise.all(
        tab.statuses.map((status) => adminApi.listReports({
          status,
          targetType: targetType || undefined,
          search: search || undefined,
          sortBy: 'created_at',
          sortOrder: 'desc',
          page: 1,
          limit: 200,
        }))
      );
      if (cancelled) return;

      const failed = results.find((r) => !r.success);
      if (failed) {
        setError(failed.error);
        setReports([]);
      } else {
        const merged = results.flatMap((r) => r.data || [])
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const totalPages = Math.max(1, Math.ceil(merged.length / PAGE_SIZE));
        const pageItems = merged.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
        setReports(pageItems);
        setMeta({ totalPages });
      }
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [activeTab, targetType, search, page, refreshTrigger]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Gradient Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 via-red-600 to-pink-700 dark:from-rose-900 dark:via-red-950 dark:to-pink-950 shadow-pb-elevated p-6 md:p-8 text-white">
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-amber-400/20 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-md shadow-inner shrink-0">
                <Flag size={28} className="text-white drop-shadow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Reports & Moderation</h1>
                </div>
                <p className="text-rose-100/80 text-sm mt-1 max-w-xl">
                  Review reported content, user flags, and enforce community safety guidelines.
                </p>
              </div>
            </div>

            {/* Quick info chip */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-2.5 self-start md:self-auto">
              <ShieldAlert className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-semibold text-white/90">Safety Center</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Filter Bar */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-pb-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex p-1 bg-page border border-border rounded-xl gap-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search reason/details..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10 pr-4 py-2 border border-border rounded-xl bg-page text-text-primary text-sm w-full sm:w-60 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all shadow-sm"
                aria-label="Search reports"
              />
            </div>
            <select
              value={targetType}
              onChange={(e) => { setTargetType(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-border rounded-xl bg-page text-text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all shadow-sm cursor-pointer"
              aria-label="Filter by target type"
            >
              <option value="">All Targets</option>
              <option value="donation">Donations</option>
              <option value="user">Users</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-pb-card">
            <SkeletonTable rows={8} columns={5} />
          </div>
        ) : error ? (
          <ErrorState title="Failed to load reports" message={error} onRetry={() => setRefreshTrigger((t) => t + 1)} />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={Flag}
            title={activeTab === 'queue' ? 'Nothing to review' : 'No moderation history yet'}
            description={activeTab === 'queue' ? 'New reports will show up here.' : 'Resolved and dismissed reports will show up here.'}
            showAction={false}
          />
        ) : (
          <>
            <div className="bg-surface rounded-2xl border border-border shadow-pb-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-page/60 border-b border-border">
                      <th className="py-3.5 px-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Target</th>
                      <th className="py-3.5 px-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Reason</th>
                      <th className="py-3.5 px-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Reporter</th>
                      <th className="py-3.5 px-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Status</th>
                      <th className="py-3.5 px-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Filed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {reports.map((r) => {
                      const isDonation = !!r.reported_donation_id;
                      const statusStyles = {
                        pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                        reviewed: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                        resolved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                        dismissed: 'bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300 border-gray-200 dark:border-gray-800',
                      };
                      return (
                        <tr
                          key={r.id}
                          onClick={() => navigate(`/admin/reports/${r.id}`)}
                          className="hover:bg-surface-hover/80 transition-all cursor-pointer group"
                        >
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                {isDonation ? <Package size={16} className="text-rose-600 dark:text-rose-400" /> : <User size={16} className="text-rose-600 dark:text-rose-400" />}
                              </div>
                              <span className="text-sm font-semibold text-text-primary group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate max-w-[160px]">
                                {isDonation ? (r.donation_title || `Donation #${r.reported_donation_id}`) : (r.reported_user_name || 'User')}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-xs font-medium text-text-secondary truncate max-w-[220px]">{r.reason}</td>
                          <td className="py-3.5 px-5 text-xs font-medium text-text-secondary truncate max-w-[140px]">{r.reporter_name || '—'}</td>
                          <td className="py-3.5 px-5">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusStyles[r.status] || 'bg-gray-100 text-gray-700'}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-xs text-text-secondary font-medium whitespace-nowrap">{formatDate(r.created_at)}</td>
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
