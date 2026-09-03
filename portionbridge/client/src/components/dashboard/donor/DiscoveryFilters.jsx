import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Discovery Filters Component
 * Provides filtering options for volunteer discovery
 *
 * PHASE 8.3: retokenized — was the one donor-facing filter panel still
 * built from raw Tailwind gray/blue/green/orange/pink instead of the
 * shared design tokens, so it looked visually out of step with the rest
 * of the donor dashboard (e.g. MyDonationsPage's filter panel).
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

  const pillClass = (active, activeTone = 'bg-dash-primary-soft text-dash-primary border-dash-primary') =>
    `px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${
      active ? activeTone : 'bg-page text-text-secondary border-transparent hover:bg-surface-hover'
    }`;

  const sortPillClass = (active) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-dash-primary text-white' : 'bg-page text-text-secondary hover:bg-surface-hover'
    }`;

  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-4 shadow-pb-card">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search volunteers by name or team..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-9 py-2.5 bg-input border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary transition-all"
        />
        {filters.search && (
          <button
            onClick={() => handleSearchChange('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleFilterChange('availableOnly', !filters.availableOnly)}
          aria-pressed={!!filters.availableOnly}
          className={pillClass(filters.availableOnly)}
        >
          Available Only
        </button>

        <button
          onClick={() => handleFilterChange('onlineOnly', !filters.onlineOnly)}
          aria-pressed={!!filters.onlineOnly}
          className={pillClass(filters.onlineOnly, 'bg-success-soft text-success border-success')}
        >
          Online Now
        </button>

        <button
          onClick={() => handleFilterChange('specialty', filters.specialty === 'food' ? null : 'food')}
          aria-pressed={filters.specialty === 'food'}
          className={pillClass(filters.specialty === 'food', 'bg-warning-soft text-warning border-warning')}
        >
          🍽️ Food
        </button>

        <button
          onClick={() => handleFilterChange('specialty', filters.specialty === 'clothes' ? null : 'clothes')}
          aria-pressed={filters.specialty === 'clothes'}
          className={pillClass(filters.specialty === 'clothes', 'bg-info-soft text-info border-info')}
        >
          👕 Clothes
        </button>
      </div>

      {/* Advanced Filters Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        aria-expanded={showAdvanced}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Filters</span>
        {activeFilterCount > 0 && (
          <span className="bg-dash-primary text-white text-xs px-2 py-0.5 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="pt-4 border-t border-border space-y-4">
          {/* Sort By */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Sort By
            </label>
            <div className="flex gap-2">
              {['distance', 'pickups', 'rating'].map((option) => (
                <button
                  key={option}
                  onClick={() => handleFilterChange('sortBy', option)}
                  aria-pressed={filters.sortBy === option}
                  className={`capitalize ${sortPillClass(filters.sortBy === option)}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Sort Order
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleFilterChange('sortOrder', 'asc')}
                aria-pressed={filters.sortOrder === 'asc'}
                className={sortPillClass(filters.sortOrder === 'asc')}
              >
                Ascending
              </button>
              <button
                onClick={() => handleFilterChange('sortOrder', 'desc')}
                aria-pressed={filters.sortOrder === 'desc'}
                className={sortPillClass(filters.sortOrder === 'desc')}
              >
                Descending
              </button>
            </div>
          </div>

          {/* Radius Slider */}
          <div>
            <label htmlFor="discovery-radius" className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Search Radius: {filters.radius || 10} km
            </label>
            <input
              id="discovery-radius"
              type="range"
              min="1"
              max="50"
              value={filters.radius || 10}
              onChange={(e) => handleFilterChange('radius', parseInt(e.target.value))}
              className="w-full h-2 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-dash-primary"
            />
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            disabled={activeFilterCount === 0 && !filters.search}
            className="w-full px-4 py-2 text-sm border border-border rounded-lg text-text-primary hover:bg-surface-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Results Count */}
      {totalCount !== undefined && (
        <p className="text-sm text-text-secondary">
          {totalCount} {totalCount === 1 ? 'volunteer' : 'volunteers'} found
        </p>
      )}
    </div>
  );
};

export default DiscoveryFilters;
