import {
  UserPlus,
  LogIn,
  ShieldAlert,
  PackagePlus,
  PackageX,
  PackageCheck,
  Star,
  Flag,
  Activity as ActivityIcon,
} from 'lucide-react';
import { SkeletonCard } from '../skeletons';
import { EmptyState } from '../EmptyState';

// Icon + short label per audit_logs action (constants/index.js#AUDIT_ACTIONS).
// Anything not listed falls back to a generic icon + humanized action name,
// so a new action type added later still renders sensibly here.
const ACTION_META = {
  register: { label: 'New account registered', icon: UserPlus },
  login_success: { label: 'Logged in', icon: LogIn },
  login_failed: { label: 'Failed login attempt', icon: ShieldAlert },
  account_locked: { label: 'Account locked (too many failed logins)', icon: ShieldAlert },
  donation_created: { label: 'Posted a new donation', icon: PackagePlus },
  donation_updated: { label: 'Updated a donation', icon: PackagePlus },
  donation_cancelled: { label: 'Cancelled a donation', icon: PackageX },
  donation_on_the_way: { label: 'Marked donation on the way', icon: PackageCheck },
  donation_picked_up: { label: 'Marked donation picked up', icon: PackageCheck },
  donation_completed: { label: 'Completed a donation', icon: PackageCheck },
  rating_created: { label: 'Left a rating', icon: Star },
  report_filed: { label: 'Filed a report', icon: Flag },
};

function humanize(action) {
  return action.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

function timeAgo(value) {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * AdminRecentActivity — platform-wide recent audit trail (Phase 2
 * "recent relevant system/admin activity"). Sourced from the existing
 * audit_logs table via the new admin.model.js#findRecentActivity query —
 * no new table, this data was already being written on every
 * login/registration/donation-lifecycle event, just never surfaced
 * platform-wide until now (findUserActivity was per-user only).
 */
export function AdminRecentActivity({ activity, loading }) {
  if (loading) {
    return (
      <div className="bg-surface rounded-lg border border-border/50 p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Recent Activity</h2>
        <SkeletonCard count={4} />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border/50 p-4">
      <h2 className="text-sm font-semibold text-text-primary mb-3">Recent Activity</h2>

      {!activity || activity.length === 0 ? (
        <EmptyState
          icon={ActivityIcon}
          title="No activity yet"
          description="Platform activity will appear here as it happens."
          showAction={false}
          size="small"
        />
      ) : (
        <ul className="space-y-3">
          {activity.map((entry) => {
            const meta = ACTION_META[entry.action] || { label: humanize(entry.action), icon: ActivityIcon };
            const Icon = meta.icon;
            return (
              <li key={entry.id} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-dash-primary-soft flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={13} className="text-dash-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-text-primary">
                    <span className="font-medium">{entry.user_name || 'A user'}</span> {meta.label.toLowerCase()}
                  </p>
                  <p className="text-[11px] text-text-secondary">{timeAgo(entry.created_at)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
