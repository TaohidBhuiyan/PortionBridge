import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Discovery Filters Component
 * Provides filtering options for volunteer discovery
 */
const DiscoveryFilters = ({ 
  filters, 
  onFiltersChange, 
  onSearch,
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

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search volunteers by name or team..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        {filters.search && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleFilterChange('availableOnly', !filters.availableOnly)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filters.availableOnly
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent'
          }`}
        >
          Available Only
        </button>

        <button
          onClick={() => handleFilterChange('onlineOnly', !filters.onlineOnly)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filters.onlineOnly
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-2 border-green-500'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent'
          }`}
        >
          Online Now
        </button>

        <button
          onClick={() => handleFilterChange('specialty', filters.specialty === 'food' ? null : 'food')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filters.specialty === 'food'
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-2 border-orange-500'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent'
          }`}
        >
          🍽️ Food
        </button>

        <button
          onClick={() => handleFilterChange('specialty', filters.specialty === 'clothes' ? null : 'clothes')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filters.specialty === 'clothes'
              ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-2 border-pink-500'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent'
          }`}
        >
          👕 Clothes
        </button>
      </div>

      {/* Advanced Filters Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Filters</span>
        {activeFilterCount > 0 && (
          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <div className="flex gap-2">
              {['distance', 'pickups', 'rating'].map((option) => (
                <button
                  key={option}
                  onClick={() => handleFilterChange('sortBy', option)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                    filters.sortBy === option
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort Order
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleFilterChange('sortOrder', 'asc')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.sortOrder === 'asc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Ascending
              </button>
              <button
                onClick={() => handleFilterChange('sortOrder', 'desc')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.sortOrder === 'desc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Descending
              </button>
            </div>
          </div>

          {/* Radius Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Radius: {filters.radius || 10} km
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={filters.radius || 10}
              onChange={(e) => handleFilterChange('radius', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Results Count */}
      {totalCount !== undefined && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {totalCount} {totalCount === 1 ? 'volunteer' : 'volunteers'} found
        </p>
      )}
    </div>
  );
};

export default DiscoveryFilters;
