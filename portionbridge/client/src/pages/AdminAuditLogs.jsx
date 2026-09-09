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
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Audit Logs</h1>
          <p className="text-text-secondary text-sm">A searchable trail of authentication, donation, and moderation events across the platform.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={action}
            onChange={handleFilterChange(setAction)}
            className="px-3 py-2 border border-border rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
            aria-label="Filter by action"
          >
            <option value="">All Actions</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>{formatAction(a)}</option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-text-secondary">
            From
            <input
              type="date"
              value={dateFrom}
              onChange={handleFilterChange(setDateFrom)}
              max={dateTo || undefined}
              className="px-2.5 py-2 border border-border rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
              aria-label="From date"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-text-secondary">
            To
            <input
              type="date"
              value={dateTo}
              onChange={handleFilterChange(setDateTo)}
              min={dateFrom || undefined}
              className="px-2.5 py-2 border border-border rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
              aria-label="To date"
            />
          </label>
          {(action || dateFrom || dateTo) && (
            <button
              onClick={() => { setAction(''); setDateFrom(''); setDateTo(''); setPage(1); }}
              className="px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-surface rounded-lg border border-border/50 p-4">
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
            <div className="bg-surface rounded-lg border border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Action</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Actor</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">IP Address</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-surface-hover transition-colors">
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${actionTone(log.action)}`}>
                            {formatAction(log.action)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-xs text-text-primary">
                          {log.user_name ? (
                            <div>
                              <div className="font-medium truncate max-w-[180px]">{log.user_name}</div>
                              <div className="text-text-secondary truncate max-w-[180px]">{log.user_email}</div>
                            </div>
                          ) : (
                            <span className="text-text-secondary italic">Unknown / no account</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-xs text-text-secondary font-mono">{log.ip_address || '—'}</td>
                        <td className="py-2.5 px-4 text-xs text-text-secondary whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                      </tr>
                    ))}
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
