import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Flag, Package, User, Calendar, CheckCircle2, XCircle, Search as SearchIcon,
} from 'lucide-react';
import { DashboardLayout, ErrorState } from '../components/dashboard';
import { SkeletonCard } from '../components/dashboard/skeletons';
import { adminApi } from '../services/adminApi';

const STATUS_TONE = {
  pending: 'bg-warning-soft text-warning',
  reviewed: 'bg-info-soft text-info',
  resolved: 'bg-success-soft text-success',
  dismissed: 'bg-danger-soft text-danger',
};

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

/**
 * AdminReportDetail — single report's moderation view (Phase 8).
 *
 * Backed by GET /admin/reports/:id and the PATCH investigate/resolve/
 * dismiss endpoints (admin.service.js) — investigate needs no notes,
 * resolve/dismiss both take an optional reasoning field that becomes
 * reports.resolution_notes (shown here once the report is closed, along
 * with who closed it and when — the "moderation history" for this report).
 */
export function AdminReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // 'investigate' | 'resolve' | 'dismiss' | null
  const [actionError, setActionError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await adminApi.getReport(id);
      if (cancelled) return;
      if (result.success) {
        setReport(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [id, refreshTrigger]);

  const handleAction = async (action) => {
    setActionLoading(action);
    setActionError(null);
    const result = action === 'investigate'
      ? await adminApi.investigateReport(id)
      : action === 'resolve'
        ? await adminApi.resolveReport(id, notes)
        : await adminApi.dismissReport(id, notes);
    setActionLoading(null);
    if (result.success) {
      setReport(result.data);
      setNotes('');
    } else {
      setActionError(result.error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <SkeletonCard count={1} />
          <SkeletonCard count={3} />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorState title="Failed to load report" message={error} onRetry={() => setRefreshTrigger((t) => t + 1)} />
      </DashboardLayout>
    );
  }

  if (!report) return null;

  const isDonation = !!report.reported_donation_id;
  const isClosed = report.status === 'resolved' || report.status === 'dismissed';
  const isOpen = report.status === 'pending' || report.status === 'reviewed';

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <button
          onClick={() => navigate('/admin/reports')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back to Reports
        </button>

        <div className="bg-surface rounded-lg border border-border/50 p-6">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-dash-primary-soft flex items-center justify-center shrink-0">
                {isDonation ? <Package size={16} className="text-dash-primary" /> : <User size={16} className="text-dash-primary" />}
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">
                  {isDonation ? (report.donation_title || `Donation #${report.reported_donation_id}`) : (report.reported_user_name || 'Reported User')}
                </h1>
                <p className="text-xs text-text-secondary">
                  {isDonation ? `Donation #${report.reported_donation_id} · ${report.donation_status}` : report.reported_user_email}
                </p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_TONE[report.status]}`}>
              {report.status}
            </span>
          </div>

          <div className="space-y-3 pt-4 border-t border-border/50">
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Reason</p>
              <p className="text-sm text-text-primary">{report.reason}</p>
            </div>
            {report.details && (
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Details</p>
                <p className="text-sm text-text-primary whitespace-pre-wrap">{report.details}</p>
              </div>
            )}
            <div className="flex items-center gap-4 text-xs text-text-secondary pt-1">
              <span className="flex items-center gap-1"><Flag size={12} /> Reported by {report.reporter_name || 'a user'}</span>
              <span className="flex items-center gap-1"><Calendar size={12} /> {formatDateTime(report.created_at)}</span>
            </div>
          </div>

          {isDonation && (
            <button
              onClick={() => navigate(`/admin/donations/${report.reported_donation_id}`)}
              className="mt-4 text-xs text-dash-primary hover:underline"
            >
              View full donation details →
            </button>
          )}
          {!isDonation && report.reported_user_id && (
            <button
              onClick={() => navigate(`/admin/users/${report.reported_user_id}`)}
              className="mt-4 text-xs text-dash-primary hover:underline"
            >
              View user profile →
            </button>
          )}
        </div>

        {/* Moderation history, once closed */}
        {isClosed && (
          <div className="bg-surface rounded-lg border border-border/50 p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-2">Moderation Decision</h2>
            <p className="text-xs text-text-secondary mb-2">
              {report.status === 'resolved' ? 'Resolved' : 'Dismissed'} by {report.resolved_by_name || 'an admin'} on {formatDateTime(report.resolved_at)}
            </p>
            {report.resolution_notes && (
              <p className="text-sm text-text-primary bg-page rounded-lg p-3 whitespace-pre-wrap">{report.resolution_notes}</p>
            )}
          </div>
        )}

        {/* Actions */}
        {isOpen && (
          <div className="bg-surface rounded-lg border border-border/50 p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Take Action</h2>

            {report.status === 'pending' && (
              <button
                onClick={() => handleAction('investigate')}
                disabled={actionLoading !== null}
                className="mb-4 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-info text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <SearchIcon size={13} /> {actionLoading === 'investigate' ? 'Marking...' : 'Mark as Investigating'}
              </button>
            )}

            <label className="block text-xs font-medium text-text-secondary mb-1.5" htmlFor="resolution-notes">
              Resolution notes (optional)
            </label>
            <textarea
              id="resolution-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Explain what you found and any action taken..."
              className="w-full px-3 py-2 border border-border rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all mb-3"
            />

            {actionError && <p className="text-xs text-danger mb-3">{actionError}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => handleAction('resolve')}
                disabled={actionLoading !== null}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <CheckCircle2 size={13} /> {actionLoading === 'resolve' ? 'Resolving...' : 'Resolve'}
              </button>
              <button
                onClick={() => handleAction('dismiss')}
                disabled={actionLoading !== null}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-danger text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <XCircle size={13} /> {actionLoading === 'dismiss' ? 'Dismissing...' : 'Dismiss'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
