import { Package, Plus, RefreshCw } from 'lucide-react';

const PRIMARY = 'var(--color-primary, oklch(60.6% 0.25 292.717))';

/**
 * EmptyState component for displaying empty states with illustration, title, description, and CTA button
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
      icon: 'w-12 h-12',
      title: 'text-lg',
      description: 'text-sm',
    },
    medium: {
      icon: 'w-16 h-16',
      title: 'text-xl',
      description: 'text-base',
    },
    large: {
      icon: 'w-20 h-20',
      title: 'text-2xl',
      description: 'text-lg',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon/Illustration */}
      <div
        className={`${classes.icon} rounded-full bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center mb-4`}
      >
        <Icon size={size === 'small' ? 24 : size === 'medium' ? 32 : 40} className="text-purple-600 dark:text-purple-400" />
      </div>

      {/* Title */}
      <h3 className={`${classes.title} font-semibold text-gray-900 dark:text-white mb-2`}>
        {title}
      </h3>

      {/* Description */}
      <p className={`${classes.description} text-gray-500 dark:text-gray-400 max-w-md mb-6`}>
        {description}
      </p>

      {/* CTA Button */}
      {showAction && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-400 via-purple-600 to-purple-900 hover:from-purple-500 hover:via-purple-700 hover:to-purple-950 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {actionLabel === 'Add New' ? <Plus size={18} /> : null}
          {actionLabel}
        </button>
      )}
    </div>
  );
}
