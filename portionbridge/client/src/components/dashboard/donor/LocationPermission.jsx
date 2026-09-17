import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, X, RefreshCw, AlertCircle, Compass, Radio } from 'lucide-react';

/**
 * Location Permission Component
 * Handles browser location permission prompts with high-end glassmorphic dialog.
 */
const LocationPermission = ({ onLocationGranted, onLocationDenied, onLocationBlocked, onManualLocation }) => {
  const [permissionState, setPermissionState] = useState('unknown');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentLocation = useCallback(() => {
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
        maximumAge: 300000,
      }
    );
  }, [onLocationGranted]);

  const checkInitialPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setPermissionState('unsupported');
      return;
    }

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
  }, [getCurrentLocation]);

  useEffect(() => {
    checkInitialPermission();
  }, [checkInitialPermission]);

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
      (err) => {
        setIsLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setPermissionState('denied');
            onLocationDenied?.();
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.');
            break;
          case err.TIMEOUT:
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-surface rounded-2xl shadow-pb-modal max-w-md w-full p-6 relative border border-border">
        
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md ${
            permissionState === 'unsupported' ? 'bg-danger-soft text-danger border border-danger/20' :
            permissionState === 'blocked' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
            'bg-dash-primary-soft text-dash-primary border border-dash-primary/20'
          }`}>
            {permissionState === 'unsupported' ? (
              <AlertCircle className="w-8 h-8" />
            ) : permissionState === 'blocked' ? (
              <AlertCircle className="w-8 h-8" />
            ) : (
              <Radio className="w-8 h-8 animate-pulse" />
            )}
          </div>

          <h3 className="text-lg font-bold text-text-primary mb-1">
            {permissionState === 'unsupported' && 'Location Not Supported'}
            {permissionState === 'blocked' && 'Location Access Blocked'}
            {permissionState === 'denied' && 'Location Access Denied'}
            {permissionState === 'prompt' && 'Enable Radar Location'}
          </h3>

          <p className="text-xs text-text-secondary leading-relaxed mb-6 max-w-sm">
            {permissionState === 'unsupported' && 'Your browser does not support GPS location. Please select a city location preset instead.'}
            {permissionState === 'blocked' && 'Location access is blocked in your browser settings. You can enable it or use a city area preset below.'}
            {permissionState === 'denied' && 'GPS permission was declined. Choose manual location to continue discovering nearby volunteers.'}
            {permissionState === 'prompt' && 'PortionBridge uses your location to calculate distance to volunteers, estimated pickup times, and live radar maps.'}
          </p>

          {error && (
            <div className="w-full bg-danger-soft border border-danger/20 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-danger">{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 w-full">
            {permissionState === 'prompt' && (
              <>
                <button
                  onClick={onManualLocation}
                  className="flex-1 px-4 py-2.5 border border-border rounded-xl text-text-primary hover:bg-surface-hover transition-colors font-bold text-xs cursor-pointer"
                >
                  City Presets
                </button>
                <button
                  onClick={requestLocation}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-dash-primary hover:bg-dash-primary-hover disabled:opacity-60 text-white rounded-xl transition-all font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Locating...
                    </>
                  ) : (
                    'Allow GPS Access'
                  )}
                </button>
              </>
            )}

            {(permissionState === 'denied' || permissionState === 'blocked' || permissionState === 'unsupported') && (
              <>
                <button
                  onClick={handleRetry}
                  className="flex-1 px-4 py-2.5 border border-border rounded-xl text-text-primary hover:bg-surface-hover transition-colors font-bold text-xs cursor-pointer"
                >
                  Retry Prompt
                </button>
                <button
                  onClick={onManualLocation}
                  className="flex-1 px-4 py-2.5 bg-dash-primary hover:bg-dash-primary-hover text-white rounded-xl transition-all font-bold text-xs shadow-sm cursor-pointer"
                >
                  Select City Location
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default LocationPermission;
