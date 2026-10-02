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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 dark:from-blue-950 dark:via-indigo-950 dark:to-violet-950 shadow-pb-elevated p-6 md:p-8 text-white">
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
                <RoleIcon size={26} className="text-white drop-shadow" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white">{user.name}</h1>
                <p className="text-blue-100/80 text-xs font-semibold capitalize tracking-wide mt-0.5">{user.role} Account • #{user.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AdminUserStatusBadge isBanned={!!user.is_banned} isDeleted={!!user.is_deleted} size="large" />
              {!user.is_deleted && user.role !== 'admin' && (
                <button
                  onClick={() => setConfirmOpen(true)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                    user.is_banned
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-rose-500 hover:bg-rose-600 text-white'
                  }`}
                >
                  {user.is_banned ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                  {user.is_banned ? 'Unban User' : 'Ban User'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/15 relative z-10 text-white/90">
            <div className="flex items-center gap-2.5 text-xs font-medium">
              <Mail size={15} className="text-blue-200 shrink-0" />
              <span className="text-white">{user.email}</span>
              {user.email_verified ? (
                <span title="Verified"><ShieldCheck size={14} className="text-emerald-300" /></span>
              ) : (
                <span title="Unverified"><ShieldOff size={14} className="text-amber-300" /></span>
              )}
            </div>
            {user.phone && (
              <div className="flex items-center gap-2.5 text-xs font-medium">
                <Phone size={15} className="text-blue-200 shrink-0" />
                <span className="text-white">{user.phone}</span>
              </div>
            )}
            {user.address && (
              <div className="flex items-center gap-2.5 text-xs font-medium">
                <MapPin size={15} className="text-blue-200 shrink-0" />
                <span className="text-white">{user.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-xs font-medium">
              <Calendar size={15} className="text-blue-200 shrink-0" />
              <span className="text-white">Joined {formatDateTime(user.created_at)}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-medium">
              <Clock size={15} className="text-blue-200 shrink-0" />
              <span className="text-white">Last login {formatDateTime(user.last_login_at)}</span>
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
