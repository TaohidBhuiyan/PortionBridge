import { CheckCircle, Clock, TrendingUp, TrendingDown, Activity } from 'lucide-react';

/**
 * Volunteer Statistics Component
 * Displays volunteer's performance statistics
 */
const VolunteerStatistics = ({ statistics }) => {
  const stats = statistics || {};

  const formatPercentage = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(1)}%`;
  };

  const getRateColor = (rate) => {
    if (rate === undefined || rate === null) return 'text-gray-500';
    if (rate >= 90) return 'text-green-600 dark:text-green-400';
    if (rate >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Performance Statistics</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Completed Pickups */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.completed_pickups || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pickups</p>
        </div>

        {/* Active Pickups */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.active_pickups || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pickups</p>
        </div>

        {/* Acceptance Rate */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Acceptance</span>
          </div>
          <p className={`text-2xl font-bold ${getRateColor(stats.acceptance_rate)}`}>
            {formatPercentage(stats.acceptance_rate)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Rate</p>
        </div>

        {/* Cancellation Rate */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Cancellation</span>
          </div>
          <p className={`text-2xl font-bold ${getRateColor(100 - (stats.cancellation_rate || 0))}`}>
            {formatPercentage(stats.cancellation_rate)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Rate</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Assignments</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats.total_assignments || 0}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Response Time</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              N/A
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Pickup Time</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              N/A
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerStatistics;
