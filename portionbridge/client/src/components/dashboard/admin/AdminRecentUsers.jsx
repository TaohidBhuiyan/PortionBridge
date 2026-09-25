import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import { SkeletonTable } from '../skeletons';
import { EmptyState } from '../EmptyState';

const ROLE_META = {
  donor: {
    label: 'Donor',
    chipBg: 'bg-pink-500/15 dark:bg-pink-500/20',
    chipText: 'text-pink-700 dark:text-pink-400',
    avatarBg: 'bg-pink-500',
  },
  volunteer: {
    label: 'Volunteer',
    chipBg: 'bg-sky-500/15 dark:bg-sky-500/20',
    chipText: 'text-sky-700 dark:text-sky-400',
    avatarBg: 'bg-sky-500',
  },
  admin: {
    label: 'Admin',
    chipBg: 'bg-violet-500/15 dark:bg-violet-500/20',
    chipText: 'text-violet-700 dark:text-violet-400',
    avatarBg: 'bg-violet-500',
  },
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * AdminRecentUsers — premium redesign with role-colored avatar chips,
 * color-coded role badges, and a "View All" header shortcut.
 */
export function AdminRecentUsers({ users, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <div className="h-4 w-32 bg-surface-hover rounded animate-pulse" />
        </div>
        <div className="p-4">
          <SkeletonTable rows={5} columns={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border/60 overflow-hidden hover:shadow-pb-card transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <h2 className="text-sm font-bold text-text-primary">Recent Signups</h2>
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-1 text-xs font-medium text-dash-primary hover:text-dash-primary-hover transition-colors group"
        >
          View All
          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {!users || users.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={Users}
            title="No users yet"
            description="New signups will appear here."
            showAction={false}
            size="small"
          />
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {users.map((user, i) => {
            const meta = ROLE_META[user.role] || ROLE_META.donor;
            return (
              <li
                key={user.id}
                onClick={() => navigate('/admin/users')}
                className="group flex items-center justify-between px-5 py-3 hover:bg-surface-hover/60 transition-colors cursor-pointer"
                style={{ animation: 'rowIn 0.25s ease backwards', animationDelay: `${i * 30}ms` }}
              >
                {/* Left — avatar + name/email */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${meta.avatarBg} group-hover:scale-105 transition-transform duration-150`}
                  >
                    {getInitials(user.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate max-w-[160px]">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-text-secondary truncate max-w-[160px]">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Right — role chip + date */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.chipBg} ${meta.chipText}`}
                  >
                    {meta.label}
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    {formatDate(user.created_at)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
