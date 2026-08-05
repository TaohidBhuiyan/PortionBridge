import { MapPin, Navigation, RefreshCw, AlertCircle } from 'lucide-react';

/**
 * Current Location Display Component
 * Shows user's current location with refresh capability
 */
const CurrentLocation = ({ location, onRefresh, isRefreshing, onManualLocation }) => {
  const formatAddress = () => {
    if (!location) return 'Location not available';
    if (location.address) return location.address;
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  const formatAccuracy = () => {
    if (!location?.accuracy) return null;
    if (location.accuracy < 10) return 'High';
    if (location.accuracy < 50) return 'Medium';
    return 'Low';
  };

  const accuracy = formatAccuracy();
  const accuracyColor = accuracy === 'High' ? 'text-green-600 dark:text-green-400' :
                       accuracy === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
                       'text-orange-600 dark:text-orange-400';

  if (!location) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Location Not Set</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Enable location or enter manually</p>
          </div>
          <button
            onClick={onManualLocation}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Set Location
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Your Location</p>
            {accuracy && (
              <span className={`text-xs px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 ${accuracyColor} font-medium`}>
                {accuracy} Accuracy
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 truncate">
            {formatAddress()}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" />
              <span>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
            </div>
            {location.accuracy && (
              <div className="flex items-center gap-1">
                <span>±{Math.round(location.accuracy)}m</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Refresh location"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default CurrentLocation;
