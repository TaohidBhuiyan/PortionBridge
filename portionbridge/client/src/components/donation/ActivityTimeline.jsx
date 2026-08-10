import { Clock, User, CheckCircle, Calendar, MapPin, Package } from 'lucide-react';

/**
 * ActivityTimeline component for displaying donation activity history
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

  const getIconForType = (type) => {
    switch (type) {
      case 'created':
        return Package;
      case 'assigned':
        return User;
      case 'scheduled':
        return Calendar;
      case 'status_change':
        return CheckCircle;
      case 'location':
        return MapPin;
      default:
        return Clock;
    }
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1 bottom-1 w-px bg-border" />
      <div className="space-y-3">
        {activities.map((activity, index) => {
          const Icon = getIconForType(activity.type);

          return (
            <div key={index} className="relative flex items-start gap-3 pl-9">
              {/* Icon */}
              <div className="absolute left-0 w-7 h-7 rounded-full bg-dash-primary-soft flex items-center justify-center shrink-0 ring-4 ring-surface">
                <Icon size={14} className="text-dash-primary" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {activity.title}
                </p>
                {activity.description && (
                  <p className="text-xs text-text-secondary mt-0.5">
                    {activity.description}
                  </p>
                )}
                <p className="text-[11px] text-text-secondary mt-0.5">
                  {formatDate(activity.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
