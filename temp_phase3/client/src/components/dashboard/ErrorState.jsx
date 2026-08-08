import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * ErrorState component for displaying error states with retry functionality
 */
export function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading the data. Please try again.',
  onRetry,
  showRetry = true,
  size = 'medium', // 'small', 'medium', 'large'
}) {
  const sizeClasses = {
    small: {
      icon: 'w-10 h-10',
      title: 'text-sm',
      message: 'text-xs',
    },
    medium: {
      icon: 'w-12 h-12',
      title: 'text-base',
      message: 'text-sm',
    },
    large: {
      icon: 'w-14 h-14',
      title: 'text-lg',
      message: 'text-base',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      {/* Error Icon */}
      <div
        className={`${classes.icon} rounded-full bg-danger-soft flex items-center justify-center mb-3`}
      >
        <AlertCircle size={size === 'small' ? 18 : size === 'medium' ? 22 : 26} className="text-danger" />
      </div>

      {/* Title */}
      <h3 className={`${classes.title} font-semibold text-text-primary mb-1`}>
        {title}
      </h3>

      {/* Message */}
      <p className={`${classes.message} text-text-secondary max-w-sm mb-4`}>
        {message}
      </p>

      {/* Retry Button */}
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-surface border border-border hover:bg-surface-hover text-text-primary font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary"
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </div>
  );
}
