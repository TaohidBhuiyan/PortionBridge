import { Package, Plus } from 'lucide-react';

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
      title: 'text-base',
      description: 'text-sm',
    },
    medium: {
      icon: 'w-14 h-14',
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
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      {/* Icon/Illustration */}
      <div
        className={`${classes.icon} rounded-full bg-dash-primary-soft flex items-center justify-center mb-3`}
      >
        <Icon size={size === 'small' ? 20 : size === 'medium' ? 24 : 28} className="text-dash-primary" />
      </div>

      {/* Title */}
      <h3 className={`${classes.title} font-semibold text-text-primary mb-1`}>
        {title}
      </h3>

      {/* Description */}
      <p className={`${classes.description} text-text-secondary max-w-sm mb-4`}>
        {description}
      </p>

      {/* CTA Button */}
      {showAction && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-dash-primary hover:bg-dash-primary-hover text-white font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary focus-visible:ring-offset-2"
        >
          {actionLabel === 'Add New' ? <Plus size={16} /> : null}
          {actionLabel}
        </button>
      )}
    </div>
  );
}
