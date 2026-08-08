import React from 'react';

/**
 * StatusBadge component for displaying donation status with consistent,
 * semantic dashboard colors.
 */
export function StatusBadge({ status, size = 'medium' }) {
  const statusConfig = {
    pending: { label: 'Pending', icon: null, tone: 'warning' },
    accepted: { label: 'Accepted', icon: null, tone: 'info' },
    scheduled: { label: 'Scheduled', icon: null, tone: 'info' },
    on_the_way: { label: 'On the Way', icon: null, tone: 'info' },
    picked_up: { label: 'Picked Up', icon: null, tone: 'success' },
    completed: { label: 'Completed', icon: null, tone: 'success' },
    cancelled: { label: 'Cancelled', icon: null, tone: 'danger' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  const toneClasses = {
    warning: 'bg-warning-soft text-warning',
    info: 'bg-info-soft text-info',
    success: 'bg-success-soft text-success',
    danger: 'bg-danger-soft text-danger',
  };

  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-2.5 py-1 text-xs',
    large: 'px-3 py-1.5 text-sm',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${toneClasses[config.tone]} ${sizeClasses[size]}`}>
      {config.label}
    </span>
  );
}
