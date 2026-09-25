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

const ACTION_META = {
  register: {
    label: 'New account registered',
    icon: UserPlus,
    iconBg: 'bg-violet-500/15 dark:bg-violet-500/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
    dot: 'bg-violet-500',
  },
  login_success: {
    label: 'Logged in',
    icon: LogIn,
    iconBg: 'bg-sky-500/15 dark:bg-sky-500/20',
    iconColor: 'text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-500',
  },
  login_failed: {
    label: 'Failed login attempt',
    icon: ShieldAlert,
    iconBg: 'bg-red-500/15 dark:bg-red-500/20',
    iconColor: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
  },
  account_locked: {
    label: 'Account locked',
    icon: ShieldAlert,
    iconBg: 'bg-red-500/15 dark:bg-red-500/20',
    iconColor: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
  },
  donation_created: {
    label: 'Posted a new donation',
    icon: PackagePlus,
    iconBg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  donation_updated: {
    label: 'Updated a donation',
    icon: PackagePlus,
    iconBg: 'bg-teal-500/15 dark:bg-teal-500/20',
    iconColor: 'text-teal-600 dark:text-teal-400',
    dot: 'bg-teal-500',
  },
  donation_cancelled: {
    label: 'Cancelled a donation',
    icon: PackageX,
    iconBg: 'bg-red-500/15 dark:bg-red-500/20',
    iconColor: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
  },
  donation_on_the_way: {
    label: 'Donation on the way',
    icon: PackageCheck,
    iconBg: 'bg-amber-500/15 dark:bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  donation_picked_up: {
    label: 'Donation picked up',
    icon: PackageCheck,
    iconBg: 'bg-blue-500/15 dark:bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  donation_completed: {
    label: 'Completed a donation',
    icon: PackageCheck,
    iconBg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  rating_created: {
    label: 'Left a rating',
    icon: Star,
    iconBg: 'bg-yellow-500/15 dark:bg-yellow-500/20',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    dot: 'bg-yellow-500',
  },
  report_filed: {
    label: 'Filed a report',
    icon: Flag,
    iconBg: 'bg-rose-500/15 dark:bg-rose-500/20',
    iconColor: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
};

const FALLBACK_META = {
  iconBg: 'bg-surface-hover',
  iconColor: 'text-text-secondary',
  dot: 'bg-border',
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
 * AdminRecentActivity — redesigned as a vertical timeline feed with
 * color-coded icons per action type and a connecting line through the
 * icon column.
 */
export function AdminRecentActivity({ activity, loading }) {
  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <div className="h-4 w-32 bg-surface-hover rounded animate-pulse" />
        </div>
        <div className="p-4">
          <SkeletonCard count={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border/60 overflow-hidden hover:shadow-pb-card transition-shadow duration-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50">
        <h2 className="text-sm font-bold text-text-primary">Live Activity</h2>
        <p className="text-[11px] text-text-secondary mt-0.5">Real-time platform events</p>
      </div>

      {!activity || activity.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={ActivityIcon}
            title="No activity yet"
            description="Platform activity will appear here as it happens."
            showAction={false}
            size="small"
          />
        </div>
      ) : (
        <div className="p-4">
          <ul className="space-y-0">
            {activity.map((entry, i) => {
              const meta = ACTION_META[entry.action] || {
                label: humanize(entry.action),
                icon: ActivityIcon,
                ...FALLBACK_META,
              };
              const Icon = meta.icon;
              const isLast = i === activity.length - 1;

              return (
                <li
                  key={entry.id}
                  className="flex items-start gap-3 relative"
                  style={{ animation: 'rowIn 0.25s ease backwards', animationDelay: `${i * 30}ms` }}
                >
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-xl border border-border/40 ${meta.iconBg} mt-0.5`}
                    >
                      <Icon size={13} className={meta.iconColor} />
                    </div>
                    {!isLast && (
                      <div className="w-px flex-1 bg-border/50 my-1" style={{ minHeight: '12px' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-3">
                    <p className="text-xs text-text-primary leading-snug">
                      <span className="font-semibold">{entry.user_name || 'A user'}</span>{' '}
                      <span className="text-text-secondary">{meta.label.toLowerCase()}</span>
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      <p className="text-[10px] text-text-muted">{timeAgo(entry.created_at)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
