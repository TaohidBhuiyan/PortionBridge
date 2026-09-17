import React from 'react';
import { Users, Search, AlertCircle, RefreshCw, XCircle, MapPin, Compass } from 'lucide-react';

/**
 * Discovery Empty States Component
 * Displays loading skeletons and empty states for the discovery page.
 */
const DiscoveryEmptyStates = ({ 
  type = 'noVolunteers', 
  onRetry, 
  onResetFilters,
  onEnableLocation 
}) => {
  if (type === 'loading') {
    return (
      <div className="space-y-4 py-4 animate-fadeIn">
        <div className="flex items-center justify-between px-2">
          <div className="h-4 w-44 bg-border/60 rounded-md animate-pulse" />
          <div className="h-4 w-20 bg-border/60 rounded-md animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 shadow-pb-card space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-border/70 rounded-2xl animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-border/70 rounded-md w-3/4 animate-pulse" />
                <div className="h-4 bg-border/50 rounded-md w-1/2 animate-pulse" />
                <div className="flex gap-2 pt-1">
                  <div className="h-6 w-16 bg-border/50 rounded-md animate-pulse" />
                  <div className="h-6 w-16 bg-border/50 rounded-md animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

/**
 * No Volunteers in Area State
 */
export const NoVolunteersState = ({ onExpandRadius, onResetFilters }) => (
  <div className="bg-surface border border-border rounded-2xl p-8 text-center shadow-pb-card animate-fadeIn">
    <div className="w-16 h-16 bg-dash-primary-soft rounded-2xl flex items-center justify-center mx-auto mb-4 text-dash-primary border border-dash-primary/20">
      <Compass className="w-8 h-8 animate-spin-slow" />
    </div>
    
    <h3 className="text-lg font-bold text-text-primary mb-1">
      No Volunteers Found in this Radius
    </h3>
    
    <p className="text-xs text-text-secondary max-w-sm mx-auto mb-6 leading-relaxed">
      There are currently no active volunteers or squads within your search range. Try expanding your search radius or resetting filter criteria.
    </p>
    
    <div className="flex flex-wrap gap-3 justify-center">
      <button
        onClick={onExpandRadius}
        className="px-4 py-2.5 bg-dash-primary hover:bg-dash-primary-hover text-white rounded-xl transition-all font-bold text-xs shadow-sm cursor-pointer"
      >
        Expand Search Radius (+10 km)
      </button>
      
      {onResetFilters && (
        <button
          onClick={onResetFilters}
          className="px-4 py-2.5 border border-border text-text-primary hover:bg-surface-hover rounded-xl transition-all font-bold text-xs cursor-pointer"
        >
          Reset All Filters
        </button>
      )}
    </div>
  </div>
);

/**
 * Location Denied State
 */
export const LocationDeniedState = ({ onEnableLocation, onManualLocation }) => (
  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-8 text-center shadow-pb-card animate-fadeIn">
    <div className="w-16 h-16 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <MapPin className="w-8 h-8" />
    </div>
    
    <h3 className="text-lg font-bold text-text-primary mb-1">
      Location Permission Required
    </h3>
    
    <p className="text-xs text-text-secondary max-w-sm mx-auto mb-6 leading-relaxed">
      To calculate accurate distances and display nearby volunteers, PortionBridge needs your location access or manual coordinates.
    </p>
    
    <div className="flex flex-wrap gap-3 justify-center">
      <button
        onClick={onEnableLocation}
        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all font-bold text-xs shadow-sm cursor-pointer"
      >
        Enable Browser GPS
      </button>
      
      <button
        onClick={onManualLocation}
        className="px-4 py-2.5 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 rounded-xl transition-all font-bold text-xs cursor-pointer"
      >
        Set Manual Location
      </button>
    </div>
  </div>
);

/**
 * Error State
 */
export const ErrorState = ({ error, onRetry }) => (
  <div className="bg-danger-soft border border-danger/30 rounded-2xl p-8 text-center shadow-pb-card animate-fadeIn">
    <div className="w-16 h-16 bg-danger-soft text-danger rounded-2xl flex items-center justify-center mx-auto mb-4">
      <AlertCircle className="w-8 h-8" />
    </div>
    
    <h3 className="text-lg font-bold text-text-primary mb-1">
      Unable to Load Volunteers
    </h3>
    
    <p className="text-xs text-text-secondary max-w-sm mx-auto mb-4 leading-relaxed">
      {error || 'We encountered a connection issue while searching for volunteers. Please try again.'}
    </p>
    
    <button
      onClick={onRetry}
      className="px-4 py-2.5 bg-danger hover:opacity-90 text-white rounded-xl transition-all font-bold text-xs shadow-sm cursor-pointer"
    >
      Try Again
    </button>
  </div>
);

export default DiscoveryEmptyStates;
