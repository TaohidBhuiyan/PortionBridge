import React, { useState } from 'react';
import { Search, SlidersHorizontal, X, RotateCcw, Filter, Compass, Check } from 'lucide-react';

/**
 * Discovery Filters Component
 * Provides filtering, searching, and sorting options for volunteer discovery.
 */
const DiscoveryFilters = ({ 
  filters, 
  onFiltersChange, 
  onReset,
  totalCount 
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key, value) => {
    onFiltersChange?.({ ...filters, [key]: value });
  };

  const handleSearchChange = (value) => {
    onFiltersChange?.({ ...filters, search: value });
  };

  const handleReset = () => {
    onReset?.();
    setShowAdvanced(false);
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return value && value.length > 0;
    if (key === 'availableOnly') return value === false;
    if (key === 'onlineOnly') return value === true;
    if (key === 'specialty') return value !== null;
    if (key === 'sortBy') return value !== 'distance';
    if (key === 'sortOrder') return value !== 'asc';
    return false;
  }).length;

  const pillClass = (active, activeStyle = 'bg-dash-primary text-white border-dash-primary shadow-sm') =>
    `px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
      active 
        ? activeStyle 
        : 'bg-page text-text-secondary border-border hover:border-dash-primary/40 hover:bg-surface-hover'
    }`;

  const sortPillClass = (active) =>
    `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
      active ? 'bg-dash-primary text-white shadow-sm' : 'bg-page text-text-secondary hover:bg-surface-hover border border-border'
    }`;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 shadow-pb-card">
      
      {/* Top Search Bar & Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search volunteers by name, skills, or squad..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-input border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary transition-all font-medium"
          />
          {filters.search && (
            <button
              onClick={() => handleSearchChange('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Advanced Filters Button */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
          className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            showAdvanced || activeFilterCount > 0
              ? 'bg-dash-primary-soft text-dash-primary border-dash-primary/30'
              : 'bg-page border-border text-text-secondary hover:bg-surface-hover'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-dash-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-extrabold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Preset Quick Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleFilterChange('onlineOnly', !filters.onlineOnly)}
            aria-pressed={!!filters.onlineOnly}
            className={pillClass(filters.onlineOnly, 'bg-emerald-600 text-white border-emerald-600 shadow-sm')}
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Online Now
          </button>

          <button
            onClick={() => handleFilterChange('specialty', filters.specialty === 'food' ? null : 'food')}
            aria-pressed={filters.specialty === 'food'}
            className={pillClass(filters.specialty === 'food', 'bg-amber-600 text-white border-amber-600 shadow-sm')}
          >
            🍲 Food Pickup
          </button>

          <button
            onClick={() => handleFilterChange('specialty', filters.specialty === 'clothes' ? null : 'clothes')}
            aria-pressed={filters.specialty === 'clothes'}
            className={pillClass(filters.specialty === 'clothes', 'bg-blue-600 text-white border-blue-600 shadow-sm')}
          >
            👕 Clothes
          </button>

        </div>

        {/* Counter readout */}
        {totalCount !== undefined && (
          <span className="text-xs font-bold text-text-secondary">
            {totalCount} {totalCount === 1 ? 'result' : 'results'}
          </span>
        )}
      </div>

      {/* Advanced Filters Expand Drawer */}
      {showAdvanced && (
        <div className="pt-4 border-t border-border space-y-4 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Sort By Controls */}
            <div>
              <label className="block text-[11px] font-extrabold text-text-muted uppercase tracking-wider mb-2">
                Sort By
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'distance', label: 'Closest Distance' },
                  { id: 'rating', label: 'Highest Rating' },
                  { id: 'pickups', label: 'Most Pickups' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleFilterChange('sortBy', option.id)}
                    className={sortPillClass(filters.sortBy === option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Radius Slider with Live Value */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="discovery-radius" className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider">
                  Search Radius
                </label>
                <span className="px-2 py-0.5 rounded-full bg-dash-primary-soft text-dash-primary text-xs font-bold">
                  {filters.radius || 10} km radius
                </span>
              </div>
              <input
                id="discovery-radius"
                type="range"
                min="1"
                max="50"
                value={filters.radius || 10}
                onChange={(e) => handleFilterChange('radius', parseInt(e.target.value))}
                className="w-full h-2 bg-page border border-border rounded-lg appearance-none cursor-pointer accent-dash-primary"
              />
              <div className="flex justify-between text-[10px] text-text-muted mt-1 font-semibold">
                <span>1 km</span>
                <span>25 km</span>
                <span>50 km</span>
              </div>
            </div>

          </div>

          {/* Reset Filters Action */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleReset}
              disabled={activeFilterCount === 0 && !filters.search}
              className="px-4 py-2 text-xs font-bold text-text-secondary hover:text-danger hover:bg-danger-soft border border-border rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default DiscoveryFilters;
