import { Clock, User, CheckCircle, Calendar, MapPin, Package, Edit } from 'lucide-react';

/**
 * ActivityTimeline component for displaying donation activity history
 * Backend provides: { id, old_status, new_status, changed_by, changed_at, changed_by_name, changed_by_role }
 */
export function ActivityTimeline({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <Clock size={32} className="mx-auto text-text-secondary opacity-50 mb-2" />
        <p className="text-sm text-text-secondary">No activity yet</p>
      </div>
    );
  }

  const getIconForStatus = (status) => {
    switch (status) {
      case 'pending':
        return Package;
      case 'accepted':
        return User;
      case 'scheduled':
        return Calendar;
      case 'on_the_way':
        return MapPin;
      case 'picked_up':
        return CheckCircle;
      case 'completed':
        return CheckCircle;
      case 'cancelled':
        return Clock;
      default:
        return Package;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Created',
      accepted: 'Accepted',
      scheduled: 'Pickup Scheduled',
      on_the_way: 'On The Way',
      picked_up: 'Picked Up',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1 bottom-1 w-px bg-border" />
      <div className="space-y-3">
        {activities.map((activity) => {
          const Icon = getIconForStatus(activity.new_status);
          const isEdit = activity.old_status !== null && activity.old_status !== activity.new_status;

          return (
            <div key={activity.id} className="relative flex items-start gap-3 pl-9">
              {/* Icon */}
              <div className="absolute left-0 w-7 h-7 rounded-full bg-dash-primary-soft flex items-center justify-center shrink-0 ring-4 ring-surface">
                {isEdit ? (
                  <Edit size={14} className="text-dash-primary" />
                ) : (
                  <Icon size={14} className="text-dash-primary" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {isEdit ? `Status changed to ${getStatusLabel(activity.new_status)}` : getStatusLabel(activity.new_status)}
                </p>
                {activity.changed_by_name && (
                  <p className="text-xs text-text-secondary mt-0.5">
                    by {activity.changed_by_name} {activity.changed_by_role && `(${activity.changed_by_role})`}
                  </p>
                )}
                <p className="text-[11px] text-text-secondary mt-0.5">
                  {formatDate(activity.changed_at)} at {formatTime(activity.changed_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
