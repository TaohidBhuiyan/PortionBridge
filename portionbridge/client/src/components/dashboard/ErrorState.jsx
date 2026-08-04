import { AlertCircle, RefreshCw } from 'lucide-react';

const PRIMARY = 'var(--color-primary, oklch(60.6% 0.25 292.717))';

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
      title: 'text-base',
      message: 'text-sm',
    },
    medium: {
      icon: 'w-14 h-14',
      title: 'text-lg',
      message: 'text-base',
    },
    large: {
      icon: 'w-18 h-18',
      title: 'text-xl',
      message: 'text-lg',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Error Icon */}
      <div
        className={`${classes.icon} rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mb-4`}
      >
        <AlertCircle size={size === 'small' ? 20 : size === 'medium' ? 28 : 36} className="text-red-600 dark:text-red-400" />
      </div>

      {/* Title */}
      <h3 className={`${classes.title} font-semibold text-gray-900 dark:text-white mb-2`}>
        {title}
      </h3>

      {/* Message */}
      <p className={`${classes.message} text-gray-500 dark:text-gray-400 max-w-md mb-6`}>
        {message}
      </p>

      {/* Retry Button */}
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#120721] border border-gray-200 dark:border-purple-950/30 hover:bg-gray-50 dark:hover:bg-purple-950/10 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
      )}
    </div>
  );
}
