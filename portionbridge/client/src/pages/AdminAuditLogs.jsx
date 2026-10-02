import { useState, useEffect, useCallback } from 'react';
import { ScrollText, Search } from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { SkeletonTable } from '../components/dashboard/skeletons';
import { AdminPagination } from '../components/dashboard/admin';
import { adminApi } from '../services/adminApi';

const PAGE_SIZE = 20;

// Mirrors AUDIT_ACTIONS in server/constants/index.js — kept as a plain list
// here rather than a shared constants module since the frontend doesn't
// otherwise consume backend enums directly anywhere else.
const ACTION_OPTIONS = [
  'register', 'login_success', 'login_failed', 'account_locked', 'logout', 'logout_all',
  'password_reset_requested', 'password_reset_success', 'email_verified', 'email_verification_resent',
  'token_refreshed', 'refresh_token_reuse_detected',
  'donation_created', 'donation_updated', 'donation_cancelled',
  'donation_on_the_way', 'donation_picked_up', 'donation_completed',
  'rating_created', 'report_filed',
  'user_banned', 'user_unbanned', 'report_investigated', 'report_resolved', 'report_dismissed',
  'admin_announcement_sent',
];

// Actions worth visually flagging as noteworthy/risky vs. routine activity.
const DANGER_ACTIONS = new Set(['login_failed', 'account_locked', 'refresh_token_reuse_detected', 'user_banned', 'report_filed']);
const SUCCESS_ACTIONS = new Set(['login_success', 'donation_completed', 'report_resolved', 'user_unbanned', 'email_verified']);

function formatAction(action) {
  return action
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function actionTone(action) {
  if (DANGER_ACTIONS.has(action)) return 'bg-danger-soft text-danger';
  if (SUCCESS_ACTIONS.has(action)) return 'bg-success-soft text-success';
  return 'bg-dash-primary-soft text-dash-primary';
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

/**
 * AdminAuditLogs — COMING-SOON ELIMINATION: audit_logs has been written to
 * throughout the app since early on (auth, donations, teams, reports,
 * moderation actions — see services/audit.service.js callers) but had no
 * read path or UI at all until now. Backed by the new GET /admin/audit-logs
 * (admin-only, server-side).
 */
export function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadLogs = useCallback(async (signal) => {
    setLoading(true);
    setError(null);

    const result = await adminApi.listAuditLogs({
      action: action || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
      limit: PAGE_SIZE,
      signal,
    });

    if (signal?.aborted) return;

    if (result.success) {
      setLogs(result.data || []);
      setMeta(result.meta);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [action, dateFrom, dateTo, page]);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern used throughout this codebase
    loadLogs(controller.signal);
    return () => controller.abort();
  }, [loadLogs, refreshTrigger]);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Gradient Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-gray-800 to-zinc-900 shadow-pb-elevated p-6 md:p-8 text-white">
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md shadow-inner shrink-0">
                <ScrollText size={28} className="text-white drop-shadow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Audit & System Logs</h1>
                  {meta?.totalItems !== undefined && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15 border border-white/25 backdrop-blur-sm text-white">
                      {meta.totalItems} entries
                    </span>
                  )}
                </div>
                <p className="text-slate-300 text-sm mt-1 max-w-xl">
                  A searchable, immutable trail of authentication, donation, and moderation events across the system.
                </p>
              </div>
            </div>

            {/* Indicator badge */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-2.5 self-start md:self-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-white/90">Live Audit Trail</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-pb-card">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={action}
              onChange={handleFilterChange(setAction)}
              className="px-4 py-2.5 border border-border rounded-xl bg-page text-text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all cursor-pointer shadow-sm"
              aria-label="Filter by action"
            >
              <option value="">All Action Types</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>{formatAction(a)}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
              From:
              <input
                type="date"
                value={dateFrom}
                onChange={handleFilterChange(setDateFrom)}
                max={dateTo || undefined}
                className="px-3 py-2 border border-border rounded-xl bg-page text-text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all shadow-sm"
                aria-label="From date"
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
              To:
              <input
                type="date"
                value={dateTo}
                onChange={handleFilterChange(setDateTo)}
                min={dateFrom || undefined}
                className="px-3 py-2 border border-border rounded-xl bg-page text-text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all shadow-sm"
                aria-label="To date"
              />
            </label>
            {(action || dateFrom || dateTo) && (
              <button
                onClick={() => { setAction(''); setDateFrom(''); setDateTo(''); setPage(1); }}
                className="px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-pb-card">
            <SkeletonTable rows={10} columns={4} />
          </div>
        ) : error ? (
          <ErrorState title="Failed to load audit logs" message={error} onRetry={() => setRefreshTrigger((t) => t + 1)} />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={action || dateFrom || dateTo ? Search : ScrollText}
            title={action || dateFrom || dateTo ? 'No matching events' : 'No activity recorded yet'}
            description={action || dateFrom || dateTo ? 'Try a different action or date range.' : 'Authentication, donation, and moderation events will show up here as they happen.'}
            showAction={false}
          />
        ) : (
          <>
            <div className="bg-surface rounded-2xl border border-border shadow-pb-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-page/60 border-b border-border">
                      <th className="py-3.5 px-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Action Event</th>
                      <th className="py-3.5 px-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Actor / User</th>
                      <th className="py-3.5 px-5 text-xs font-bold text-text-secondary uppercase tracking-wider">IP Address</th>
                      <th className="py-3.5 px-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {logs.map((log) => {
                      const isDanger = DANGER_ACTIONS.has(log.action);
                      const isSuccess = SUCCESS_ACTIONS.has(log.action);
                      const toneClass = isDanger
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                        : isSuccess
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

                      return (
                        <tr key={log.id} className="hover:bg-surface-hover/80 transition-all">
                          <td className="py-3.5 px-5">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${toneClass}`}>
                              {formatAction(log.action)}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-xs text-text-primary">
                            {log.user_name ? (
                              <div>
                                <div className="font-semibold text-text-primary truncate max-w-[180px]">{log.user_name}</div>
                                <div className="text-text-secondary truncate max-w-[180px]">{log.user_email}</div>
                              </div>
                            ) : (
                              <span className="text-text-secondary italic">System / Guest</span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-xs font-mono font-medium text-text-secondary">{log.ip_address || '—'}</td>
                          <td className="py-3.5 px-5 text-xs text-text-secondary font-medium whitespace-nowrap">{formatDateTime(log.created_at)}</td>
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
