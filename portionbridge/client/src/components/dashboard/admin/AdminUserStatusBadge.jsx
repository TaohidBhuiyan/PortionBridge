import { CheckCircle2, Ban, Trash2 } from 'lucide-react';

/**
 * AdminUserStatusBadge — Active/Banned/Deleted, derived the same way
 * admin.model.js#buildUserFilter derives its `status` filter:
 *   is_deleted -> 'deleted', is_banned -> 'banned', else -> 'active'.
 * Same visual pattern as donation/StatusBadge.jsx (tone + icon + label).
 */
export function AdminUserStatusBadge({ isBanned, isDeleted, size = 'medium' }) {
  const config = isDeleted
    ? { label: 'Deleted', icon: Trash2, tone: 'danger' }
    : isBanned
      ? { label: 'Banned', icon: Ban, tone: 'danger' }
      : { label: 'Active', icon: CheckCircle2, tone: 'success' };

  const Icon = config.icon;

  const toneClasses = {
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
