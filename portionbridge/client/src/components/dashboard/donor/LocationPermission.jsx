import { useState, useEffect } from 'react';
import { MapPin, X, RefreshCw, AlertCircle } from 'lucide-react';

/**
 * Location Permission Component
 * Handles browser location permission requests and states
 */
const LocationPermission = ({ onLocationGranted, onLocationDenied, onLocationBlocked }) => {
  const [permissionState, setPermissionState] = useState('unknown'); // unknown, prompt, granted, denied, blocked, unsupported
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkInitialPermission();
  }, []);

  const checkInitialPermission = () => {
    if (!navigator.geolocation) {
      setPermissionState('unsupported');
      return;
    }

    // Check if permission was already granted/denied
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((result) => {
          if (result.state === 'granted') {
            setPermissionState('granted');
            getCurrentLocation();
          } else if (result.state === 'denied') {
            setPermissionState('blocked');
          } else {
            setPermissionState('prompt');
          }
        })
        .catch(() => {
          setPermissionState('prompt');
        });
    } else {
      setPermissionState('prompt');
    }
  };

  const requestLocation = () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setPermissionState('unsupported');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPermissionState('granted');
        setIsLoading(false);
        onLocationGranted({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        setIsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setPermissionState('denied');
            onLocationDenied?.();
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('An unknown error occurred.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationGranted({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.error('Error getting location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  };

  const handleRetry = () => {
    setPermissionState('prompt');
    setError(null);
  };

  const handleClose = () => {
    onLocationBlocked?.();
  };

  if (permissionState === 'granted') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            permissionState === 'unsupported' ? 'bg-red-100 dark:bg-red-900/30' :
            permissionState === 'blocked' ? 'bg-orange-100 dark:bg-orange-900/30' :
            'bg-blue-100 dark:bg-blue-900/30'
          }`}>
            {permissionState === 'unsupported' ? (
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            ) : permissionState === 'blocked' ? (
              <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            ) : (
              <MapPin className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            )}
          </div>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {permissionState === 'unsupported' && 'Location Not Supported'}
            {permissionState === 'blocked' && 'Location Access Blocked'}
            {permissionState === 'denied' && 'Location Access Denied'}
            {permissionState === 'prompt' && 'Enable Location Access'}
          </h3>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {permissionState === 'unsupported' && 'Your browser does not support location services. Please use a modern browser to discover nearby volunteers.'}
            {permissionState === 'blocked' && 'Location access has been blocked in your browser settings. Please enable location access in your browser settings to use this feature.'}
            {permissionState === 'denied' && 'You denied location access. We need your location to show nearby volunteers.'}
            {permissionState === 'prompt' && 'We need your location to show volunteers and teams near you. Your location is only used to find nearby volunteers.'}
          </p>

          {error && (
            <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 w-full">
            {permissionState === 'prompt' && (
              <>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={requestLocation}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Getting Location...
                    </>
                  ) : (
                    'Allow Location'
                  )}
                </button>
              </>
            )}

            {(permissionState === 'denied' || permissionState === 'blocked') && (
              <>
                <button
                  onClick={handleRetry}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Use Manual Location
                </button>
              </>
            )}

            {permissionState === 'unsupported' && (
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Use Manual Location
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPermission;
