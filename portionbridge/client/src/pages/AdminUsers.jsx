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
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Users</h1>
          <p className="text-text-secondary text-sm">
            Search, filter, and manage donor, volunteer, and admin accounts.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-lg border border-border/50 p-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search by name, email, or user ID..."
                  value={search}
                  onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
                  aria-label="Search users by name, email, or ID"
                />
              </div>
            </div>
            <select
              value={role}
              onChange={(e) => handleFilterChange(setRole)(e.target.value)}
              className="px-3 py-2.5 border border-border rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
              aria-label="Filter by role"
            >
              {ROLE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <select
              value={status}
              onChange={(e) => handleFilterChange(setStatus)(e.target.value)}
              className="px-3 py-2.5 border border-border rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
              aria-label="Filter by status"
            >
              {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="bg-surface rounded-lg border border-border/50 p-4">
            <SkeletonTable rows={8} columns={6} />
          </div>
        ) : error ? (
          <ErrorState title="Failed to load users" message={error} onRetry={() => setRefreshTrigger((t) => t + 1)} />
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="No users found" description="Try adjusting your search or filters." showAction={false} />
        ) : (
          <>
            <div className="bg-surface rounded-lg border border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">User</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">ID</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Role</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Status</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const RoleIcon = ROLE_ICON[u.role] || Users;
                      return (
                        <tr
                          key={u.id}
                          onClick={() => navigate(`/admin/users/${u.id}`)}
                          className="border-b border-border/50 last:border-0 hover:bg-surface-hover transition-colors cursor-pointer"
                        >
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-dash-primary-soft flex items-center justify-center shrink-0">
                                <RoleIcon size={14} className="text-dash-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-text-primary truncate max-w-[220px]">{u.name}</p>
                                <p className="text-[11px] text-text-secondary truncate max-w-[220px]">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-xs font-mono text-text-secondary">#{u.id}</td>
                          <td className="py-2.5 px-4 text-xs text-text-secondary capitalize">{u.role}</td>
                          <td className="py-2.5 px-4">
                            <AdminUserStatusBadge isBanned={!!u.is_banned} isDeleted={!!u.is_deleted} size="small" />
                          </td>
                          <td className="py-2.5 px-4 text-xs text-text-secondary whitespace-nowrap">{formatDate(u.created_at)}</td>
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
