import React from 'react';

/**
 * StatusBadge component for displaying donation status with consistent colors
 */
export function StatusBadge({ status, size = 'medium' }) {
  const statusConfig = {
    pending: {
      label: 'Pending',
      bgColor: 'bg-yellow-100 dark:bg-yellow-950/30',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    accepted: {
      label: 'Accepted',
      bgColor: 'bg-blue-100 dark:bg-blue-950/30',
      textColor: 'text-blue-700 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    scheduled: {
      label: 'Scheduled',
      bgColor: 'bg-purple-100 dark:bg-purple-950/30',
      textColor: 'text-purple-700 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
    on_the_way: {
      label: 'On The Way',
      bgColor: 'bg-indigo-100 dark:bg-indigo-950/30',
      textColor: 'text-indigo-700 dark:text-indigo-400',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
    },
    picked_up: {
      label: 'Picked Up',
      bgColor: 'bg-teal-100 dark:bg-teal-950/30',
      textColor: 'text-teal-700 dark:text-teal-400',
      borderColor: 'border-teal-200 dark:border-teal-800',
    },
    completed: {
      label: 'Completed',
      bgColor: 'bg-green-100 dark:bg-green-950/30',
      textColor: 'text-green-700 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    cancelled: {
      label: 'Cancelled',
      bgColor: 'bg-red-100 dark:bg-red-950/30',
      textColor: 'text-red-700 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-3 py-1 text-sm',
    large: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${config.bgColor}
        ${config.textColor}
        ${config.borderColor}
        ${sizeClasses[size]}
      `}
    >
      {config.label}
    </span>
  );
}
