import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Calendar, TrendingUp, Download, Filter, Sparkles, Utensils, Shirt, CheckCircle2, Award, Zap, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard';
import { useAuth } from '../context/AuthContext';
import { analyticsApi } from '../services/analyticsApi';
import { LineChart } from '../components/common/LineChart';
import { PieChart } from '../components/common/PieChart';
import { AchievementsPanel } from '../components/common/AchievementsPanel';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import toast from 'react-hot-toast';

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAnalytics();
  }, [loadAnalytics]);

  const timeRangeOptions = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_3_months', label: 'Last 3 Months' },
    { value: 'last_6_months', label: 'Last 6 Months' },
    { value: 'all_time', label: 'All Time' },
  ];

  const handleExportReport = () => {
    if (!stats) {
      toast.error('Analytics are still loading');
      return;
    }

    try {
      const doc = new jsPDF();
      const rangeLabel = timeRangeOptions.find((option) => option.value === timeRange)?.label || 'All Time';

      doc.setFontSize(18);
      doc.text('PortionBridge Impact Report', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Donor: ${user?.name || 'Donor'} | Period: ${rangeLabel}`, 14, 28);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);
      doc.setTextColor(0);

      autoTable(doc, {
        startY: 44,
        head: [['Metric', 'Value']],
        body: [
          ['Total donations', stats.totalDonations || 0],
          ['Completed pickups', stats.completedDonations || 0],
          ['Food donations', stats.foodDonations || 0],
          ['Clothing donations', stats.clothingDonations || 0],
          ['Meals shared', stats.mealsShared || 0],
          ['Clothes donated', stats.clothesDonated || 0],
          ['People helped', stats.peopleHelped || 0],
          ['Completion rate', `${stats.completionRate || 0}%`],
        ],
        headStyles: { fillColor: [14, 116, 144], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 4 },
      });

      doc.save(`portionbridge-impact-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Impact report exported successfully');
    } catch (error) {
      console.error('Failed to export impact report:', error);
      toast.error('Could not export report. Please try again.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-10 w-48 bg-surface border border-border rounded-xl animate-pulse" />
          <div className="bg-surface rounded-3xl border border-border p-8 h-48 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface rounded-2xl border border-border p-6 h-32 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface rounded-2xl border border-border p-6 h-64 animate-pulse" />
            <div className="bg-surface rounded-2xl border border-border p-6 h-64 animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-16">
        {/* Navigation & Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-surface hover:bg-surface-hover border border-border rounded-xl transition-all shadow-xs shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-text-primary tracking-tight">
                Analytics & Impact Dashboard
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Real-time insights, donation metrics, and community contribution trends
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-surface border border-border rounded-xl shadow-xs">
              <Filter size={14} className="text-text-muted ml-2 shrink-0" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-2.5 py-1.5 bg-transparent text-text-primary text-xs font-semibold focus:outline-none cursor-pointer"
                aria-label="Select time range"
              >
                {timeRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportReport}
              disabled={loading || !stats}
              title="Export impact report"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-surface border border-border text-text-secondary hover:text-dash-primary hover:border-dash-primary/40 rounded-xl text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={14} />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Colorful Hero Impact Overview Banner */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-dash-primary rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold border border-white/20">
                <Sparkles size={14} /> Community Impact Overview
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {user?.name || 'Valued Donor'}, Your Generosity Changes Lives!
              </h2>
              <p className="text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
                Every food portion and clothing item you donate reaches verified families in need. Track your live impact metrics below.
              </p>
            </div>

            {/* Quick Hero Stat Badge */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-4 shrink-0">
              <div className="p-3 bg-white text-dash-primary rounded-xl shadow-md">
                <Zap size={24} />
              </div>
              <div>
                <p className="text-2xl font-black">{stats?.peopleHelped || 0}+</p>
                <p className="text-xs text-white/80 font-medium">Lives Touched</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Donations"
            value={stats?.totalDonations || 0}
            subtext="Lifetime donation pledges"
            gradient="from-purple-500 to-indigo-600"
            icon={TrendingUp}
            trend="+12% this month"
          />
          <StatCard
            label="Completed Pickups"
            value={stats?.completedDonations || 0}
            subtext="Handed over to beneficiaries"
            gradient="from-emerald-500 to-teal-600"
            icon={CheckCircle2}
            trend="100% verified"
          />
          <StatCard
            label="Success Rate"
            value={`${stats?.successRate || 0}%`}
            subtext="Fulfillment completion"
            gradient="from-blue-500 to-cyan-600"
            icon={Award}
            trend="Top tier rating"
          />
          <StatCard
            label="People Helped"
            value={stats?.peopleHelped || 0}
            subtext="Direct community impact"
            gradient="from-amber-500 to-rose-500"
            icon={Heart}
            trend="Active beneficiaries"
          />
        </div>

        {/* Colorful Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donation Trend Chart */}
          <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-dash-primary-soft text-dash-primary rounded-lg">
                  <TrendingUp size={18} />
                </div>
                <h3 className="text-base font-bold text-text-primary">Monthly Donation Trend</h3>
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-dash-primary-soft text-dash-primary">
                Activity Flow
              </span>
            </div>
            
            <div className="pt-2">
              <LineChart data={stats?.monthlyTrend || []} height={220} />
            </div>
            <p className="text-xs text-text-muted text-center pt-2">
              Monthly donation count trends over the selected timeframe
            </p>
          </div>

          {/* Category Breakdown Chart */}
          <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                  <Utensils size={18} />
                </div>
                <h3 className="text-base font-bold text-text-primary">Initiative Breakdown</h3>
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                Food vs Clothes
              </span>
            </div>

            <div className="flex items-center justify-center pt-2">
              <PieChart
                data={[
                  { label: 'Food Initiative', value: stats?.foodDonations || 0, color: '#f59e0b' },
                  { label: 'Clothing Initiative', value: stats?.clothingDonations || 0, color: '#6366f1' },
                ]}
                size={200}
              />
            </div>
          </div>
        </div>

        {/* Vibrant Impact Summary Card */}
        <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Detailed Impact Metrics</h3>
                <p className="text-xs text-text-secondary">Summary breakdown of shared goods and contribution ratios</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ImpactItem
              label="Meals Shared"
              value={stats?.mealsShared || 0}
              icon={Utensils}
              bg="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              sub="Prepared & fresh food"
            />
            <ImpactItem
              label="Garments Donated"
              value={stats?.clothesDonated || 0}
              icon={Shirt}
              bg="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
              sub="Wearable clothing items"
            />
            <ImpactItem
              label="Completion Ratio"
              value={`${stats?.completionRate || 0}%`}
              icon={CheckCircle2}
              bg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              sub="Successful deliveries"
            />
            <ImpactItem
              label="Total Resource Units"
              value={(stats?.mealsShared || 0) + (stats?.clothesDonated || 0)}
              icon={Zap}
              bg="bg-purple-500/10 text-purple-600 dark:text-purple-400"
              sub="Combined contribution"
            />
          </div>
        </div>

        {/* Achievements Panel */}
        <div className="pt-2">
          <AchievementsPanel userId={user?.id} userRole="donor" />
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, subtext, gradient, icon: Icon, trend }) {
  return (
    <div className="bg-surface rounded-3xl border border-border p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105`}>
          <Icon size={22} />
        </div>
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-page border border-border text-text-muted">
          {trend}
        </span>
      </div>

      <p className="text-3xl font-black text-text-primary tracking-tight">
        {value}
      </p>
      <p className="text-xs font-bold text-text-primary mt-1">{label}</p>
      <p className="text-[11px] text-text-muted mt-0.5">{subtext}</p>
    </div>
  );
}

function ImpactItem({ label, value, icon: Icon, bg, sub }) {
  return (
    <div className="p-5 rounded-2xl bg-page border border-border flex items-start gap-4 transition-all hover:border-dash-primary/40">
      <div className={`p-3 rounded-xl shrink-0 ${bg}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-black text-text-primary">{value}</p>
        <p className="text-xs font-bold text-text-primary mt-0.5">{label}</p>
        <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export default DonorAnalyticsPage;

