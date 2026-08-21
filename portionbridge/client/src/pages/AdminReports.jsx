import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Flag, Package, User } from 'lucide-react';
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
      // endpoint only filters on one at a time, so fetch both and merge
      // client-side rather than adding a multi-status filter server-side
      // for what's otherwise a single-value `status` param everywhere else.
      const results = await Promise.all(
        tab.statuses.map((status) => adminApi.listReports({
          status,
          targetType: targetType || undefined,
          search: search || undefined,
          sortBy: 'created_at',
          sortOrder: 'desc',
          page: 1,
          limit: PAGE_SIZE,
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
        setReports(merged);
        setMeta({ totalPages: 1 });
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
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Reports</h1>
          <p className="text-text-secondary text-sm">Moderation queue for reported users and donations.</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-dash-primary text-white'
                    : 'bg-surface border border-border/50 text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search reason/details..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 pr-3 py-2 border border-border rounded-lg bg-page text-text-primary text-sm w-56 focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
                aria-label="Search reports"
              />
            </div>
            <select
              value={targetType}
              onChange={(e) => { setTargetType(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-border rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
              aria-label="Filter by target type"
            >
              <option value="">All Targets</option>
              <option value="donation">Donations</option>
              <option value="user">Users</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="bg-surface rounded-lg border border-border/50 p-4">
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
            <div className="bg-surface rounded-lg border border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Target</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Reason</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Reporter</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Status</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Filed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => {
                      const isDonation = !!r.reported_donation_id;
                      return (
                        <tr
                          key={r.id}
                          onClick={() => navigate(`/admin/reports/${r.id}`)}
                          className="border-b border-border/50 last:border-0 hover:bg-surface-hover transition-colors cursor-pointer"
                        >
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-md bg-dash-primary-soft flex items-center justify-center shrink-0">
                                {isDonation ? <Package size={13} className="text-dash-primary" /> : <User size={13} className="text-dash-primary" />}
                              </div>
                              <span className="text-xs font-medium text-text-primary truncate max-w-[160px]">
                                {isDonation ? (r.donation_title || `Donation #${r.reported_donation_id}`) : (r.reported_user_name || 'User')}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-text-secondary truncate max-w-[220px]">{r.reason}</td>
                          <td className="py-2.5 px-4 text-xs text-text-secondary truncate max-w-[140px]">{r.reporter_name || '—'}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${STATUS_TONE[r.status]}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-text-secondary whitespace-nowrap">{formatDate(r.created_at)}</td>
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
