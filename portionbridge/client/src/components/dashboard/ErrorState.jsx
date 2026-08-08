import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * ErrorState component for displaying error states with retry functionality
 * Redesigned for compact, professional appearance
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
      icon: 'w-9 h-9',
      title: 'text-base',
      message: 'text-xs',
    },
    medium: {
      icon: 'w-11 h-11',
      title: 'text-lg',
      message: 'text-sm',
    },
    large: {
      icon: 'w-14 h-14',
      title: 'text-xl',
      message: 'text-base',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      {/* Error Icon */}
      <div
        className={`${classes.icon} rounded-lg bg-danger-50 dark:bg-danger-950/30 flex items-center justify-center mb-3`}
      >
        <AlertCircle size={size === 'small' ? 18 : size === 'medium' ? 22 : 28} className="text-danger-600 dark:text-danger-400" />
      </div>

      {/* Title */}
      <h3 className={`${classes.title} font-medium text-slate-900 dark:text-slate-50 mb-1`}>
        {title}
      </h3>

      {/* Message */}
      <p className={`${classes.message} text-slate-500 dark:text-slate-400 max-w-md mb-4`}>
        {message}
      </p>

      {/* Retry Button */}
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-all duration-200 text-sm"
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </div>
  );
}
