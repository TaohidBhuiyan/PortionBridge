import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, HeartHandshake, UserCheck, Shield } from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { SkeletonTable } from '../components/dashboard/skeletons';
import { AdminUserStatusBadge, AdminPagination } from '../components/dashboard/admin';
import { adminApi } from '../services/adminApi';

const PAGE_SIZE = 15;

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'donor', label: 'Donor' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'admin', label: 'Admin' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
  { value: 'deleted', label: 'Deleted' },
];

const ROLE_ICON = { donor: HeartHandshake, volunteer: UserCheck, admin: Shield };

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * AdminUsers — "Users" (Phase 3: Admin Users + Donation Management).
 *
 * All data from the existing GET /admin/users endpoint (admin.model.js's
 * findUsers/countUsers, unchanged this phase) — search, role filter,
 * status filter (active/banned/deleted), sort, and pagination were
 * already fully supported server-side; this page just wires them up.
 */
export function AdminUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await adminApi.listUsers({
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
        page,
        limit: PAGE_SIZE,
      });
      if (cancelled) return;
      if (result.success) {
        setUsers(result.data || []);
        setMeta(result.meta || null);
      } else {
        setError(result.error);
        setUsers([]);
      }
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [search, role, status, page, refreshTrigger]);

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Gradient Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 dark:from-blue-900 dark:via-indigo-900 dark:to-violet-950 shadow-pb-elevated p-6 md:p-8 text-white">
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-cyan-400/20 blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-md shadow-inner shrink-0">
                <Users size={28} className="text-white drop-shadow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">User Management</h1>
                  {meta?.totalItems !== undefined && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 border border-white/30 backdrop-blur-sm text-white">
                      {meta.totalItems} total
                    </span>
                  )}
                </div>
                <p className="text-blue-100/80 text-sm mt-1 max-w-xl">
                  Inspect, search, and manage all donor, volunteer, and system administrator accounts.
                </p>
              </div>
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex items-center gap-3 self-start md:self-auto bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-2.5 px-4">
              <div className="flex items-center gap-2 pr-3 border-r border-white/20">
                <HeartHandshake className="w-4 h-4 text-pink-300" />
                <span className="text-xs font-medium text-white/90">Donors</span>
              </div>
              <div className="flex items-center gap-2 pr-3 border-r border-white/20">
                <UserCheck className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-medium text-white/90">Volunteers</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-medium text-white/90">Admins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-pb-card">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search by name, email, or user ID..."
                  value={search}
                  onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  aria-label="Search users by name, email, or ID"
                />
              </div>
            </div>
            <select
              value={role}
              onChange={(e) => handleFilterChange(setRole)(e.target.value)}
              className="px-4 py-2.5 border border-border rounded-xl bg-page text-text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer shadow-sm"
              aria-label="Filter by role"
            >
              {ROLE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <select
              value={status}
              onChange={(e) => handleFilterChange(setStatus)(e.target.value)}
              className="px-4 py-2.5 border border-border rounded-xl bg-page text-text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer shadow-sm"
              aria-label="Filter by status"
            >
              {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-pb-card">
            <SkeletonTable rows={8} columns={6} />
          </div>
        ) : error ? (
          <ErrorState title="Failed to load users" message={error} onRetry={() => setRefreshTrigger((t) => t + 1)} />
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="No users found" description="Try adjusting your search or filters." showAction={false} />
        ) : (
          <>
            <div className="bg-surface rounded-2xl border border-border shadow-pb-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-page/60 border-b border-border">
                      <th className="py-3.5 px-5 text-xs font-bold text-text-secondary uppercase tracking-wider">User</th>
                      <th className="py-3.5 px-5 text-xs font-bold text-text-secondary uppercase tracking-wider">User ID</th>
                      <th className="py-3.5 px-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Role</th>
                      <th className="py-3.5 px-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Status</th>
                      <th className="py-3.5 px-5 text-xs font-bold text-text-secondary uppercase tracking-wider">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {users.map((u) => {
                      const RoleIcon = ROLE_ICON[u.role] || Users;
                      const roleColors = {
                        donor: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200 dark:border-pink-800',
                        volunteer: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                        admin: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
                      };
                      return (
                        <tr
                          key={u.id}
                          onClick={() => navigate(`/admin/users/${u.id}`)}
                          className="hover:bg-surface-hover/80 transition-all cursor-pointer group"
                        >
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                <RoleIcon size={16} className="text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-text-primary group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate max-w-[220px]">{u.name}</p>
                                <p className="text-xs text-text-secondary truncate max-w-[220px]">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-xs font-mono font-medium text-text-secondary">#{u.id}</td>
                          <td className="py-3.5 px-5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${roleColors[u.role] || 'bg-gray-100 text-gray-700'}`}>
                              <RoleIcon size={12} />
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-5">
                            <AdminUserStatusBadge isBanned={!!u.is_banned} isDeleted={!!u.is_deleted} size="small" />
                          </td>
                          <td className="py-3.5 px-5 text-xs text-text-secondary whitespace-nowrap font-medium">{formatDate(u.created_at)}</td>
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
