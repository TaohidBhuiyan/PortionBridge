import { Clock, CheckCircle2, CalendarClock, Truck, PackageCheck, CheckCheck, XCircle } from 'lucide-react';

/**
 * StatusBadge component for displaying donation status with semantic dashboard colors
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
    warning: 'bg-warning-soft/90 text-warning border-warning/20',
    info: 'bg-info-soft/90 text-info border-info/20',
    success: 'bg-success-soft/90 text-success border-success/20',
    danger: 'bg-danger-soft/90 text-danger border-danger/20',
  };

  const sizeClasses = {
    small: 'px-2 py-0.5 text-[11px] gap-1',
    medium: 'px-3 py-1 text-xs gap-1.5',
    large: 'px-3.5 py-1.5 text-sm gap-2',
  };

  const iconSize = size === 'large' ? 15 : size === 'small' ? 11 : 13;

  return (
    <span
      className={`inline-flex items-center font-bold tracking-tight rounded-full border shadow-pb-subtle transition-all duration-200 ${toneClasses[config.tone]} ${sizeClasses[size]}`}
    >
      <Icon size={iconSize} className="shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}