import React from 'react';
import { Clock, User, CheckCircle, Calendar, MapPin, Package } from 'lucide-react';

/**
 * ActivityTimeline component for displaying donation activity history
 */
export function ActivityTimeline({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No activity yet</p>
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
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const Icon = getIconForType(activity.type);
        const isLast = index === activities.length - 1;

        return (
          <div key={index} className="flex items-start gap-4 relative">
            {/* Icon */}
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-purple-600 dark:text-purple-400" />
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {activity.title}
              </p>
              {activity.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {activity.description}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {formatDate(activity.timestamp)}
              </p>
            </div>

            {/* Connector Line */}
            {!isLast && (
              <div className="absolute left-5 mt-10 w-0.5 h-8 bg-gray-200 dark:bg-gray-700" />
            )}
          </div>
        );
      })}
    </div>
  );
}
