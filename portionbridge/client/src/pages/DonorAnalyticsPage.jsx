import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, TrendingUp, Download, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard';
import { useAuth } from '../context/AuthContext';
import { analyticsApi } from '../services/analyticsApi';
import { LineChart } from '../components/common/LineChart';
import { BarChart } from '../components/common/BarChart';
import { PieChart } from '../components/common/PieChart';
import { AchievementsPanel } from '../components/common/AchievementsPanel';

/**
 * Donor Analytics & Impact Dashboard
 * Comprehensive analytics with charts and insights
 */
export function DonorAnalyticsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('all_time');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await analyticsApi.getDonationStatistics({ timeRange });
      
      if (result.success) {
        setStats(result.data.statistics);
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch (err) {
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Placeholder for export functionality
    alert('Export functionality coming soon!');
  };

  const timeRangeOptions = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_3_months', label: 'Last 3 Months' },
    { value: 'last_6_months', label: 'Last 6 Months' },
    { value: 'all_time', label: 'All Time' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse mb-4" />
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-2" />
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-4" />
              <div className="h-48 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-4" />
              <div className="h-48 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Impact Summary Skeleton */}
          <div className="bg-gradient-to-br from-green-50 via-teal-50 to-purple-50 dark:from-green-950/20 dark:via-teal-950/20 dark:to-purple-950/20 rounded-2xl border-2 border-green-200 dark:border-purple-950/50 p-6 animate-pulse">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Analytics & Impact
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Track your donation impact and trends
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Time Range Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500 dark:text-gray-400" aria-hidden="true" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Select time range"
              >
                {timeRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Export Button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-400 via-purple-600 to-purple-900 hover:from-purple-500 hover:via-purple-700 hover:to-purple-950 text-white rounded-xl transition-all shadow-sm hover:shadow-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-label="Export analytics data"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Overview Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Donations"
            value={stats?.totalDonations || 0}
            color="bg-purple-500"
            icon={TrendingUp}
          />
          <StatCard
            label="Completed"
            value={stats?.completedDonations || 0}
            color="bg-green-500"
            icon={Calendar}
          />
          <StatCard
            label="Success Rate"
            value={`${stats?.successRate || 0}%`}
            color="bg-blue-500"
            icon={TrendingUp}
          />
          <StatCard
            label="People Helped"
            value={stats?.peopleHelped || 0}
            color="bg-teal-500"
            icon={TrendingUp}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donation Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Donation Trend
            </h3>
            <LineChart data={stats?.monthlyTrend || []} height={200} />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Monthly donation count over time
            </p>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Category Breakdown
            </h3>
            <PieChart
              data={[
                { label: 'Food', value: stats?.foodDonations || 0, color: '#f97316' },
                { label: 'Clothes', value: stats?.clothingDonations || 0, color: '#3b82f6' },
              ]}
              size={180}
            />
          </div>
        </div>

        {/* Impact Summary */}
        <div className="bg-gradient-to-br from-green-50 via-teal-50 to-purple-50 dark:from-green-950/20 dark:via-teal-950/20 dark:to-purple-950/20 rounded-2xl border-2 border-green-200 dark:border-purple-950/50 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Impact Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ImpactItem
              label="Meals Shared"
              value={stats?.mealsShared || 0}
              color="text-orange-600 dark:text-orange-400"
            />
            <ImpactItem
              label="Clothes Donated"
              value={stats?.clothesDonated || 0}
              color="text-blue-600 dark:text-blue-400"
            />
            <ImpactItem
              label="Completion Rate"
              value={`${stats?.completionRate || 0}%`}
              color="text-green-600 dark:text-green-400"
            />
            <ImpactItem
              label="Total Items"
              value={(stats?.mealsShared || 0) + (stats?.clothesDonated || 0)}
              color="text-purple-600 dark:text-purple-400"
            />
          </div>
        </div>

        {/* Achievements */}
        <div className="lg:col-span-2">
          <AchievementsPanel userId={user?.id} userRole="donor" />
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4`}>
        <Icon size={24} className="text-white" />
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function ImpactItem({ label, value, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </p>
      <p className={`text-sm ${color}`}>{label}</p>
    </div>
  );
}
