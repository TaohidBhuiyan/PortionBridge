import React from 'react';
import { MapPin, Navigation, RefreshCw, AlertCircle, Compass, Radio } from 'lucide-react';

/**
 * Current Location Display Component
 * Displays real-time location radar status with location refresh capability.
 */
const CurrentLocation = ({ location, onRefresh, isRefreshing, onManualLocation }) => {
  const formatAddress = () => {
    if (!location) return 'Location not configured';
    if (location.address) return location.address;
    return `${location.latitude.toFixed(4)}° N, ${location.longitude.toFixed(4)}° E`;
  };

  const formatAccuracy = () => {
    if (!location?.accuracy) return null;
    if (location.accuracy < 15) return 'High';
    if (location.accuracy < 50) return 'Medium';
    return 'Low';
  };

  const accuracy = formatAccuracy();

  if (!location) {
    return (
      <div className="bg-surface border border-warning/30 rounded-2xl p-4 shadow-pb-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-warning-soft rounded-2xl flex items-center justify-center text-warning flex-shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">Location Radar Inactive</p>
              <p className="text-xs text-text-secondary mt-0.5">Enable GPS or pick your area manually to discover nearby volunteers.</p>
            </div>
          </div>
          <button
            onClick={onManualLocation}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-dash-primary hover:bg-dash-primary-hover text-white rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <MapPin className="w-4 h-4" />
            <span>Set Pickup Location</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-dash-primary-soft via-surface to-surface border border-dash-primary/20 rounded-2xl p-4 shadow-pb-card">
      
      {/* Background Subtle Radar Glow */}
      <div className="absolute top-1/2 -left-10 -translate-y-1/2 w-40 h-40 bg-dash-primary/5 rounded-full pointer-events-none blur-xl" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        
        {/* Radar Icon & Details */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 bg-dash-primary rounded-2xl flex items-center justify-center text-white shadow-md shadow-dash-primary/20">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-surface animate-ping" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-surface" />
          </div>
          
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-dash-primary flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" />
                Live Radar Zone
              </span>
              
              {accuracy && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  accuracy === 'High' 
                    ? 'bg-success-soft text-success border-success/30' 
                    : accuracy === 'Medium'
                    ? 'bg-warning-soft text-warning border-warning/30'
                    : 'bg-page text-text-muted border-border'
                }`}>
                  {accuracy} GPS Precision
                </span>
              )}
            </div>
            
            <p className="text-sm font-bold text-text-primary truncate">
              {formatAddress()}
            </p>
            
            <div className="flex items-center gap-3 text-[11px] text-text-secondary mt-0.5">
              <span className="flex items-center gap-1 font-mono">
                <Navigation className="w-3 h-3 text-dash-primary" />
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </span>
              {location.accuracy && (
                <span className="text-text-muted font-medium">
                  ±{Math.round(location.accuracy)}m range
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-center justify-end">
          <button
            onClick={onManualLocation}
            className="px-3 py-2 text-xs font-semibold bg-surface border border-border text-text-primary hover:bg-surface-hover rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-dash-primary" />
            <span>Change</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-text-secondary hover:text-dash-primary bg-surface hover:bg-surface-hover border border-border rounded-xl transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Refresh GPS location"
            aria-label="Refresh location"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-dash-primary' : ''}`} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default CurrentLocation;
