import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, ShieldCheck, ShieldOff, Ban, CheckCircle2,
  Clock, HeartHandshake, UserCheck, Shield,
} from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { SkeletonCard } from '../components/dashboard/skeletons';
import { AdminUserStatusBadge, AdminPagination } from '../components/dashboard/admin';
import { ConfirmActionModal } from '../components/common/ConfirmActionModal';
import { adminApi } from '../services/adminApi';

const ROLE_ICON = { donor: HeartHandshake, volunteer: UserCheck, admin: Shield };
const ACTIVITY_PAGE_SIZE = 10;

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function humanize(action) {
  return action.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

/**
 * AdminUserDetail — single user's admin profile (Phase 3).
 *
 * Backed by GET /admin/users/:id (profile), PATCH /admin/users/:id/disable
 * and /enable (ban/unban), and GET /admin/users/:id/activity (paginated
 * audit trail) — all pre-existing endpoints, unchanged this phase.
 */
export function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activity, setActivity] = useState([]);
  const [activityMeta, setActivityMeta] = useState(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(null);
  const [activityPage, setActivityPage] = useState(1);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await adminApi.getUser(id);
      if (cancelled) return;
      if (result.success) {
        setUser(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [id, refreshTrigger]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setActivityLoading(true);
      setActivityError(null);
      const result = await adminApi.getUserActivity(id, { page: activityPage, limit: ACTIVITY_PAGE_SIZE });
      if (cancelled) return;
      if (result.success) {
        setActivity(result.data?.activity || []);
        setActivityMeta(result.meta || null);
      } else {
        setActivityError(result.error);
      }
      setActivityLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [id, activityPage, refreshTrigger]);

  const handleToggleBan = async () => {
    setActionLoading(true);
    setActionError(null);
    const result = user.is_banned
      ? await adminApi.enableUser(id)
      : await adminApi.disableUser(id);
    setActionLoading(false);
    if (result.success) {
      setConfirmOpen(false);
      setRefreshTrigger((t) => t + 1);
    } else {
      setActionError(result.error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <SkeletonCard count={1} />
          <SkeletonCard count={4} />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorState title="Failed to load user" message={error} onRetry={() => setRefreshTrigger((t) => t + 1)} />
      </DashboardLayout>
    );
  }

  if (!user) return null;

  const RoleIcon = ROLE_ICON[user.role] || Shield;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back to Users
        </button>

        {/* Profile card */}
        <div className="bg-surface rounded-lg border border-border/50 p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-dash-primary-soft flex items-center justify-center shrink-0">
                <RoleIcon size={22} className="text-dash-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">{user.name}</h1>
                <p className="text-sm text-text-secondary capitalize">{user.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AdminUserStatusBadge isBanned={!!user.is_banned} isDeleted={!!user.is_deleted} size="large" />
              {!user.is_deleted && (
                <button
                  onClick={() => setConfirmOpen(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    user.is_banned
                      ? 'bg-success text-white hover:opacity-90'
                      : 'bg-danger text-white hover:opacity-90'
                  }`}
                >
                  {user.is_banned ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                  {user.is_banned ? 'Unban User' : 'Ban User'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="text-text-secondary shrink-0" />
              <span className="text-text-primary">{user.email}</span>
              {user.email_verified ? (
                <span title="Verified"><ShieldCheck size={13} className="text-success" /></span>
              ) : (
                <span title="Unverified"><ShieldOff size={13} className="text-warning" /></span>
              )}
            </div>
            {user.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-text-secondary shrink-0" />
                <span className="text-text-primary">{user.phone}</span>
              </div>
            )}
            {user.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={14} className="text-text-secondary shrink-0" />
                <span className="text-text-primary">{user.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-text-secondary shrink-0" />
              <span className="text-text-primary">Joined {formatDateTime(user.created_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} className="text-text-secondary shrink-0" />
              <span className="text-text-primary">Last login {formatDateTime(user.last_login_at)}</span>
            </div>
          </div>
        </div>

        {/* Activity */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Activity</h2>
          {activityLoading ? (
            <div className="bg-surface rounded-lg border border-border/50 p-4">
              <SkeletonCard count={5} />
            </div>
          ) : activityError ? (
            <ErrorState
              title="Failed to load activity"
              message={activityError}
              onRetry={() => setRefreshTrigger((t) => t + 1)}
              size="small"
            />
          ) : activity.length === 0 ? (
            <div className="bg-surface rounded-lg border border-border/50">
              <EmptyState
                icon={Clock}
                title="No activity recorded"
                description="This user hasn't triggered any logged actions yet."
                showAction={false}
                size="small"
              />
            </div>
          ) : (
            <>
              <div className="bg-surface rounded-lg border border-border/50 p-4">
                <ul className="divide-y divide-border/50">
                  {activity.map((entry) => (
                    <li key={entry.id} className="py-2.5 flex items-center justify-between gap-3">
                      <span className="text-xs text-text-primary">{humanize(entry.action)}</span>
                      <span className="text-[11px] text-text-secondary whitespace-nowrap">{formatDateTime(entry.created_at)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <AdminPagination page={activityPage} totalPages={activityMeta?.totalPages} onPageChange={setActivityPage} />
            </>
          )}
        </div>
      </div>

      <ConfirmActionModal
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setActionError(null); }}
        onConfirm={handleToggleBan}
        title={user.is_banned ? 'Unban this user?' : 'Ban this user?'}
        message={
          actionError
            ? actionError
            : user.is_banned
              ? `${user.name} will regain access to their account immediately.`
              : `${user.name} will be signed out and unable to log in until unbanned.`
        }
        confirmLabel={user.is_banned ? 'Unban User' : 'Ban User'}
        isLoading={actionLoading}
        tone={user.is_banned ? 'primary' : 'danger'}
      />
    </DashboardLayout>
  );
}
