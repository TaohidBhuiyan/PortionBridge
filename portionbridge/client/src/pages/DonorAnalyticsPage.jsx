import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Calendar, TrendingUp, Download, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard';
import { useAuth } from '../context/AuthContext';
import { analyticsApi } from '../services/analyticsApi';
import { LineChart } from '../components/common/LineChart';
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
  const [, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('all_time');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await analyticsApi.getDonationStatistics({ timeRange });
      
      if (result.success) {
        setStats(result.data.statistics);
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch {
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern used throughout this codebase
    loadAnalytics();
  }, [loadAnalytics]);

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
              <div className="h-10 w-10 bg-border rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 w-48 bg-border rounded-lg animate-pulse" />
                <div className="h-4 w-64 bg-border rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="h-10 w-32 bg-border rounded-lg animate-pulse" />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface rounded-2xl border border-border p-6 animate-pulse">
                <div className="w-12 h-12 rounded-lg bg-border animate-pulse mb-4" />
                <div className="h-8 w-24 bg-border rounded-lg animate-pulse mb-2" />
                <div className="h-4 w-32 bg-border rounded-lg animate-pulse" />
              </div>
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface rounded-2xl border border-border p-6 animate-pulse">
              <div className="h-6 w-48 bg-border rounded-lg animate-pulse mb-4" />
              <div className="h-48 w-full bg-border rounded-lg animate-pulse" />
            </div>
            <div className="bg-surface rounded-2xl border border-border p-6 animate-pulse">
              <div className="h-6 w-48 bg-border rounded-lg animate-pulse mb-4" />
              <div className="h-48 w-full bg-border rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Impact Summary Skeleton */}
          <div className="bg-success-soft rounded-2xl border border-success p-6 animate-pulse">
            <div className="h-6 w-48 bg-border rounded-lg animate-pulse mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-border rounded-lg animate-pulse" />
                  <div className="h-8 w-16 bg-border rounded-lg animate-pulse" />
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
              className="p-2 hover:bg-surface-hover rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Analytics & Impact
              </h1>
              <p className="text-sm text-text-secondary">
                Track your donation impact and trends
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Time Range Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-text-secondary" aria-hidden="true" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary"
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
              className="flex items-center gap-2 px-4 py-2.5 bg-dash-primary hover:bg-dash-primary-hover text-white rounded-xl transition-all shadow-sm hover:shadow-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2"
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
            color="bg-dash-primary"
            icon={TrendingUp}
          />
          <StatCard
            label="Completed"
            value={stats?.completedDonations || 0}
            color="bg-success"
            icon={Calendar}
          />
          <StatCard
            label="Success Rate"
            value={`${stats?.successRate || 0}%`}
            color="bg-info"
            icon={TrendingUp}
          />
          <StatCard
            label="People Helped"
            value={stats?.peopleHelped || 0}
            color="bg-warning"
            icon={TrendingUp}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donation Trend */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Donation Trend
            </h3>
            <LineChart data={stats?.monthlyTrend || []} height={200} />
            <p className="text-xs text-text-secondary mt-2 text-center">
              Monthly donation count over time
            </p>
          </div>

          {/* Category Breakdown */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
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
        <div className="bg-success-soft rounded-2xl border border-success p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Your Impact Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ImpactItem
              label="Meals Shared"
              value={stats?.mealsShared || 0}
              color="text-warning"
            />
            <ImpactItem
              label="Clothes Donated"
              value={stats?.clothesDonated || 0}
              color="text-info"
            />
            <ImpactItem
              label="Completion Rate"
              value={`${stats?.completionRate || 0}%`}
              color="text-success"
            />
            <ImpactItem
              label="Total Items"
              value={(stats?.mealsShared || 0) + (stats?.clothesDonated || 0)}
              color="text-dash-primary"
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
    <div className="bg-surface rounded-xl border border-border p-6 hover:shadow-lg transition-shadow">
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4`}>
        <Icon size={24} className="text-white" />
      </div>
      <p className="text-3xl font-bold text-text-primary mb-1">
        {value}
      </p>
      <p className="text-sm text-text-secondary">{label}</p>
    </div>
  );
}

function ImpactItem({ label, value, color }) {
  return (
    <div className="bg-surface rounded-lg p-4 border border-border">
      <p className="text-2xl font-bold text-text-primary mb-1">
        {value}
      </p>
      <p className={`text-sm ${color}`}>{label}</p>
    </div>
  );
}

export default DonorAnalyticsPage;
