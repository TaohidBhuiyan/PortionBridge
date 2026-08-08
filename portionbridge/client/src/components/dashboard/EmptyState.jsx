import { Package, Plus, RefreshCw } from 'lucide-react';

/**
 * EmptyState component for displaying empty states with illustration, title, description, and CTA button
 * Redesigned for compact, professional appearance
 */
export function EmptyState({
  icon = Package,
  title = 'No data found',
  description = 'There are no items to display at the moment.',
  actionLabel = 'Add New',
  onAction,
  showAction = true,
  size = 'medium', // 'small', 'medium', 'large'
}) {
  const Icon = icon;

  const sizeClasses = {
    small: {
      icon: 'w-10 h-10',
      title: 'text-base',
      description: 'text-xs',
    },
    medium: {
      icon: 'w-12 h-12',
      title: 'text-lg',
      description: 'text-sm',
    },
    large: {
      icon: 'w-16 h-16',
      title: 'text-xl',
      description: 'text-base',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      {/* Icon/Illustration */}
      <div
        className={`${classes.icon} rounded-lg bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center mb-3`}
      >
        <Icon size={size === 'small' ? 20 : size === 'medium' ? 24 : 32} className="text-primary-600 dark:text-primary-400" />
      </div>

      {/* Title */}
      <h3 className={`${classes.title} font-medium text-slate-900 dark:text-slate-50 mb-1`}>
        {title}
      </h3>

      {/* Description */}
      <p className={`${classes.description} text-slate-500 dark:text-slate-400 max-w-md mb-4`}>
        {description}
      </p>

      {/* CTA Button */}
      {showAction && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400 text-white font-medium rounded-lg transition-all duration-200 text-sm"
        >
          {actionLabel === 'Add New' ? <Plus size={16} /> : null}
          {actionLabel}
        </button>
      )}
    </div>
  );
}
