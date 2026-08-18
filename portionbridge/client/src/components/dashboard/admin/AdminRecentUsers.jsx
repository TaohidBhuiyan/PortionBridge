import { useNavigate } from 'react-router-dom';
import { HeartHandshake, UserCheck, Shield, Users } from 'lucide-react';
import { SkeletonTable } from '../skeletons';
import { EmptyState } from '../EmptyState';

const ROLE_ICON = {
  donor: HeartHandshake,
  volunteer: UserCheck,
  admin: Shield,
};

const ROLE_LABEL = {
  donor: 'Donor',
  volunteer: 'Volunteer',
  admin: 'Admin',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * AdminRecentUsers — the 10 most recently registered users platform-wide
 * (dashboard.recentUsers from GET /admin/dashboard, admin.model.js's new
 * getRecentUsers query — Phase 2). Read-only list; clicking a row is a
 * no-op for now since the Users detail page is later-phase work.
 */
export function AdminRecentUsers({ users, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-surface rounded-lg border border-border/50 p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Recent Users</h2>
        <SkeletonTable rows={5} columns={3} />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border/50 p-4">
      <h2 className="text-sm font-semibold text-text-primary mb-3">Recent Users</h2>

      {!users || users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users yet"
          description="New signups will show up here."
          showAction={false}
          size="small"
        />
      ) : (
        <ul className="divide-y divide-border/50">
          {users.map((user) => {
            const RoleIcon = ROLE_ICON[user.role] || Users;
            return (
              <li
                key={user.id}
                onClick={() => navigate('/admin/users')}
                className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-surface-hover rounded-md px-2 -mx-2 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-dash-primary-soft flex items-center justify-center shrink-0">
                    <RoleIcon size={14} className="text-dash-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate max-w-[160px]">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-text-secondary truncate max-w-[160px]">{user.email}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-medium text-text-secondary">{ROLE_LABEL[user.role] || user.role}</p>
                  <p className="text-[11px] text-text-secondary">{formatDate(user.created_at)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
