import { Users, Search, AlertCircle, RefreshCw, XCircle } from 'lucide-react';

/**
 * Discovery Empty States Component
 * Displays various empty states for the discovery feature
 */
const DiscoveryEmptyStates = ({ 
  type = 'noVolunteers', 
  onRetry, 
  onResetFilters,
  onEnableLocation 
}) => {
  const states = {
    noVolunteers: {
      icon: Users,
      title: 'No Volunteers Nearby',
      description: 'There are no volunteers in your area right now. Try expanding your search radius or check back later.',
      action: onResetFilters ? 'Reset Filters' : null,
      actionHandler: onResetFilters,
    },
    locationDenied: {
      icon: XCircle,
      title: 'Location Access Denied',
      description: 'Location access is required to find nearby volunteers. Please enable location access in your browser settings.',
      action: 'Enable Location',
      actionHandler: onEnableLocation,
    },
    locationBlocked: {
      icon: XCircle,
      title: 'Location Access Blocked',
      description: 'Location access has been blocked in your browser settings. Please unblock location access to use this feature.',
      action: 'Try Again',
      actionHandler: onRetry,
    },
    noResults: {
      icon: Search,
      title: 'No Results Found',
      description: 'No volunteers match your search criteria. Try adjusting your filters or search terms.',
      action: 'Reset Filters',
      actionHandler: onResetFilters,
    },
    error: {
      icon: AlertCircle,
      title: 'Something Went Wrong',
      description: 'We encountered an error while fetching volunteers. Please try again.',
      action: 'Try Again',
      actionHandler: onRetry,
    },
    loading: {
      icon: RefreshCw,
      title: 'Finding Nearby Volunteers',
      description: 'We\'re searching for volunteers near you. This may take a moment...',
      action: null,
      actionHandler: null,
    },
  };

  const state = states[type] || states.noVolunteers;
  const Icon = state.icon;

  if (type === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-dash-primary/30 rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          {state.title}
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
          {state.description}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {state.title}
      </h3>
      
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        {state.description}
      </p>
      
      {state.action && state.actionHandler && (
        <button
          onClick={state.actionHandler}
          className="px-4 py-2 bg-dash-primary hover:bg-dash-primary-hover text-white rounded-lg transition-colors font-medium"
        >
          {state.action}
        </button>
      )}
    </div>
  );
};

/**
 * No Volunteers in Area State
 */
export const NoVolunteersState = ({ onExpandRadius, onResetFilters }) => (
  <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
      <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
    </div>
    
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      No Volunteers Nearby
    </h3>
    
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
      There are no volunteers in your current search area. Try expanding your search radius or resetting your filters.
    </p>
    
    <div className="flex gap-3 justify-center">
      <button
        onClick={onExpandRadius}
        className="px-4 py-2 bg-dash-primary hover:bg-dash-primary-hover text-white rounded-lg transition-colors font-medium"
      >
        Expand Search Radius
      </button>
      
      {onResetFilters && (
        <button
          onClick={onResetFilters}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
        >
          Reset Filters
        </button>
      )}
    </div>
  </div>
);

/**
 * Location Denied State
 */
export const LocationDeniedState = ({ onEnableLocation, onManualLocation }) => (
  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-8 text-center">
    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
      <XCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
    </div>
    
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      Location Access Required
    </h3>
    
    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto mb-6">
      We need your location to find nearby volunteers. Please enable location access or enter your location manually.
    </p>
    
    <div className="flex gap-3 justify-center">
      <button
        onClick={onEnableLocation}
        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium"
      >
        Enable Location
      </button>
      
      <button
        onClick={onManualLocation}
        className="px-4 py-2 border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors font-medium"
      >
        Enter Manually
      </button>
    </div>
  </div>
);

/**
 * Error State
 */
export const ErrorState = ({ error, onRetry }) => (
  <div className="bg-danger-soft border border-danger/30 rounded-xl p-8 text-center">
    <div className="w-16 h-16 bg-danger-soft rounded-full flex items-center justify-center mx-auto mb-4">
      <AlertCircle className="w-8 h-8 text-danger" />
    </div>
    
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      Something Went Wrong
    </h3>
    
    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto mb-4">
      {error || 'We encountered an error while fetching volunteers. Please try again.'}
    </p>
    
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-danger hover:opacity-90 text-white rounded-lg transition-colors font-medium"
    >
      Try Again
    </button>
  </div>
);

export default DiscoveryEmptyStates;
