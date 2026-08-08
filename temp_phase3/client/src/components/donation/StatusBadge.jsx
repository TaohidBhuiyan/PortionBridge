import { Clock, CheckCircle2, CalendarClock, Truck, PackageCheck, CheckCheck, XCircle } from 'lucide-react';

/**
 * StatusBadge component for displaying donation status with consistent,
 * semantic dashboard colors (see index.css design tokens). Statuses that
 * share a color family (accepted/scheduled/on_the_way are all "in progress")
 * are still distinguishable by icon + label, not color alone.
 */
export function StatusBadge({ status, size = 'medium' }) {
  const statusConfig = {
    pending: { label: 'Pending', icon: Clock, tone: 'warning' },
    accepted: { label: 'Accepted', icon: CheckCircle2, tone: 'info' },
    scheduled: { label: 'Scheduled', icon: CalendarClock, tone: 'info' },
    on_the_way: { label: 'On the Way', icon: Truck, tone: 'info' },
    picked_up: { label: 'Picked Up', icon: PackageCheck, tone: 'success' },
    completed: { label: 'Completed', icon: CheckCheck, tone: 'success' },
    cancelled: { label: 'Cancelled', icon: XCircle, tone: 'danger' },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  const toneClasses = {
    warning: 'bg-warning-soft text-warning',
    info: 'bg-info-soft text-info',
    success: 'bg-success-soft text-success',
    danger: 'bg-danger-soft text-danger',
  };

  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs gap-1',
    medium: 'px-2.5 py-1 text-xs gap-1.5',
    large: 'px-3 py-1.5 text-sm gap-1.5',
  };

  const iconSize = size === 'large' ? 14 : 12;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${toneClasses[config.tone]} ${sizeClasses[size]}`}
    >
      <Icon size={iconSize} />
      {config.label}
    </span>
  );
}
