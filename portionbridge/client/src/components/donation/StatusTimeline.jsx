import React from 'react';
import { Check, Clock, X } from 'lucide-react';

/**
 * StatusTimeline component for displaying donation status progression
 */
export function StatusTimeline({ currentStatus }) {
  const statuses = [
    { key: 'pending', label: 'Pending', icon: Clock },
    { key: 'accepted', label: 'Accepted', icon: Check },
    { key: 'scheduled', label: 'Scheduled', icon: Check },
    { key: 'on_the_way', label: 'On The Way', icon: Check },
    { key: 'picked_up', label: 'Picked Up', icon: Check },
    { key: 'completed', label: 'Completed', icon: Check },
  ];

  // Find current status index
  const currentIndex = statuses.findIndex(s => s.key === currentStatus);
  const isCancelled = currentStatus === 'cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border-2 border-red-200 dark:border-red-800">
        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
          <X size={20} className="text-red-600 dark:text-red-400" />
        </div>
        <div>
          <p className="font-semibold text-red-900 dark:text-red-100">Cancelled</p>
          <p className="text-sm text-red-600 dark:text-red-400">This donation has been cancelled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {statuses.map((status, index) => {
        const Icon = status.icon;
        const isCurrent = index === currentIndex;
        const isPast = index < currentIndex;
        const isFuture = index > currentIndex;

        return (
          <div key={status.key} className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                ${isPast || isCurrent
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                }
              `}
            >
              <Icon size={18} />
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <p
                className={`
                  font-medium
                  ${isPast || isCurrent
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-gray-500'
                  }
                `}
              >
                {status.label}
              </p>
              {isCurrent && (
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                  Current Status
                </p>
              )}
            </div>

            {/* Connector Line */}
            {index < statuses.length - 1 && (
              <div className="absolute left-5 mt-10 w-0.5 h-8 bg-gray-200 dark:bg-gray-700" />
            )}
          </div>
        );
      })}
    </div>
  );
}
