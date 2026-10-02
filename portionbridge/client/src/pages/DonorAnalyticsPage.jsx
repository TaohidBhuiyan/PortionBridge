import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  Download,
  Filter,
  Sparkles,
  Utensils,
  Shirt,
  CheckCircle2,
  Award,
  Zap,
  Heart,
  RotateCw,
  BarChart3,
  PieChart as PieChartIcon,
  Leaf,
  Scale,
  ShieldCheck,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../components/dashboard';
import { useAuth } from '../context/AuthContext';
import { analyticsApi } from '../services/analyticsApi';
import {
  AreaChart,
  GroupedBarChart,
  DonutChart,
  RadialGauge,
  Sparkline
} from '../components/common/AnalyticsCharts';
import { AchievementsPanel } from '../components/common/AchievementsPanel';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import toast from 'react-hot-toast';

/* Theme colors aligned with PortionBridge Design System */
const COLOR = {
  primary: 'var(--pb-primary)',
  success: 'var(--pb-success)',
  info: 'var(--pb-info)',
  donor: 'var(--pb-donor)',
  warning: 'var(--pb-warning)',
  food: 'oklch(72% 0.17 55)',
  clothes: 'var(--pb-info)',
};

const TIME_RANGES = [
  { value: 'this_month', label: 'This Month', shortLabel: '1M' },
  { value: 'last_3_months', label: 'Last 3 Months', shortLabel: '3M' },
  { value: 'last_6_months', label: 'Last 6 Months', shortLabel: '6M' },
  { value: 'all_time', label: 'All Time', shortLabel: 'All' },
];

function getCompletionTier(rate) {
  if (rate >= 90) return { label: 'Elite Benefactor', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
  if (rate >= 75) return { label: 'Active Community Hero', cls: 'bg-dash-primary-soft text-dash-primary border-dash-primary/20' };
  if (rate >= 50) return { label: 'Steady Contributor', cls: 'bg-info-soft text-info border-info/20' };
  return { label: 'Emerging Donor', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
}

export function DonorAnalyticsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('all_time');
  const [chartType, setChartType] = useState('area'); // 'area' | 'bar'

  const loadAnalytics = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await analyticsApi.getDonationStatistics({ timeRange });
      if (result.success) {
        setStats(result.data.statistics);
        if (isManualRefresh) toast.success('Analytics updated');
      } else {
        setError(result.error || 'Failed to load analytics');
        toast.error(result.error || 'Failed to load analytics');
      }
    } catch {
      setError('Failed to load analytics. Please try again.');
      toast.error('Network error while loading analytics');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Derived Trend & Environmental calculations
  const monthlyTrend = useMemo(() => stats?.monthlyTrend || [], [stats]);
  const totalDonations = stats?.totalDonations || 0;
  const completedDonations = stats?.completedDonations || 0;
  const completionRate = Number(stats?.completionRate) || (totalDonations > 0 ? Math.round((completedDonations / totalDonations) * 100) : 0);
  const foodDonations = stats?.foodDonations || 0;
  const clothingDonations = stats?.clothingDonations || 0;
  const mealsShared = stats?.mealsShared || 0;
  const clothesDonated = stats?.clothesDonated || 0;
  const peopleHelped = stats?.peopleHelped || 0;

  // Environmental Footprint calculations
  const co2AvoidedKg = Math.round(mealsShared * 1.8 + clothesDonated * 0.6);
  const landfillSavedKg = Math.round(mealsShared * 0.45 + clothesDonated * 0.35);

  // Sparkline arrays
  const donationsSpark = monthlyTrend.map(m => Number(m.count) || 0);
  const completedSpark = monthlyTrend.map(m => Number(m.completed) || 0);

  // Peak month calculation
  const peakMonth = useMemo(() => {
    if (!monthlyTrend.length) return null;
    return [...monthlyTrend].sort((a, b) => (Number(b.count) || 0) - (Number(a.count) || 0))[0];
  }, [monthlyTrend]);

  // Donut data for Food vs Clothes
  const donutData = useMemo(() => {
    const list = [];
    if (foodDonations > 0 || clothingDonations > 0) {
      list.push({ label: 'Food Initiative', value: foodDonations, color: COLOR.food });
      list.push({ label: 'Clothing Initiative', value: clothingDonations, color: COLOR.clothes });
    } else {
      list.push({ label: 'Food Initiative', value: 0, color: COLOR.food });
      list.push({ label: 'Clothing Initiative', value: 0, color: COLOR.clothes });
    }
    return list;
  }, [foodDonations, clothingDonations]);

  const trendSeries = [
    { key: 'count', label: 'Total Pledged', color: COLOR.primary },
    { key: 'completed', label: 'Completed Deliveries', color: COLOR.success },
  ];

  const completionTier = getCompletionTier(completionRate);

  const handleExportReport = () => {
    if (!stats) {
      toast.error('Analytics are still loading');
      return;
    }

    try {
      const doc = new jsPDF();
      const rangeLabel = TIME_RANGES.find((option) => option.value === timeRange)?.label || 'All Time';

      doc.setFontSize(20);
      doc.setTextColor(14, 116, 144);
      doc.text('PortionBridge — Donor Impact & Analytics Report', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Donor Name: ${user?.name || 'Valued Donor'}`, 14, 28);
      doc.text(`Reporting Period: ${rangeLabel} | Generated: ${new Date().toLocaleDateString()}`, 14, 34);
      doc.setTextColor(0);

      autoTable(doc, {
        startY: 44,
        head: [['Key Performance Indicator', 'Quantity / Ratio', 'Impact Context']],
        body: [
          ['Total Donations Pledged', totalDonations, 'Total listings submitted on platform'],
          ['Completed Deliveries', completedDonations, 'Successfully collected & distributed to recipients'],
          ['Delivery Fulfillment Rate', `${completionRate}%`, `${completionTier.label} tier rating`],
          ['People & Families Supported', peopleHelped, 'Direct beneficiaries of nourishment & essentials'],
          ['Meals Rescued & Served', `${mealsShared} servings`, 'Nutritious meals diverted from waste'],
          ['Garments & Clothing Provided', `${clothesDonated} items`, 'Wearable garments given to those in need'],
          ['Estimated CO₂ Emissions Prevented', `${co2AvoidedKg} kg CO₂e`, 'Eco-savings from landfill diversion'],
          ['Landfill Waste Prevented', `${landfillSavedKg} kg`, 'Solid waste diverted from municipal dumps'],
        ],
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 9.5, cellPadding: 4.5 },
      });

      doc.save(`portionbridge-impact-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Impact report downloaded successfully!');
    } catch (error) {
      console.error('Failed to export impact report:', error);
      toast.error('Could not export report. Please try again.');
    }
  };

  if (loading && !stats) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-10 w-64 bg-surface border border-border rounded-2xl animate-pulse" />
            <div className="h-10 w-48 bg-surface border border-border rounded-2xl animate-pulse" />
          </div>
          <div className="bg-surface rounded-3xl border border-border p-8 h-48 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface rounded-2xl border border-border p-6 h-36 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-surface rounded-3xl border border-border p-6 h-80 animate-pulse" />
            <div className="bg-surface rounded-3xl border border-border p-6 h-80 animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-16">
        {/* Navigation & Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-surface hover:bg-surface-hover border border-border/70 rounded-2xl transition-all shadow-pb-subtle shrink-0 group cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary group-hover:text-text-primary transition-colors" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                  Impact & Analytics Dashboard
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-dash-primary-soft text-dash-primary border border-dash-primary/20">
                  <Sparkles size={12} /> Live Telemetry
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                Real-time donation flow, resource distribution, and community impact insights
              </p>
            </div>
          </div>

          {/* Action Bar: Timeframe Filter + Refresh + Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Segmented Time Range Selector */}
            <div className="flex items-center p-1 bg-surface border border-border/70 rounded-2xl shadow-pb-subtle">
              {TIME_RANGES.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    timeRange === option.value
                      ? 'bg-dash-primary text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  <span className="hidden sm:inline">{option.label}</span>
                  <span className="sm:hidden">{option.shortLabel}</span>
                </button>
              ))}
            </div>

            {/* Live Refresh Button */}
            <button
              onClick={() => loadAnalytics(true)}
              disabled={isRefreshing}
              title="Refresh Analytics"
              className="p-2.5 bg-surface hover:bg-surface-hover border border-border/70 text-text-secondary hover:text-text-primary rounded-2xl transition-all shadow-pb-subtle cursor-pointer disabled:opacity-50"
            >
              <RotateCw size={15} className={isRefreshing ? 'animate-spin text-dash-primary' : ''} />
            </button>

            {/* Export PDF Button */}
            <button
              onClick={handleExportReport}
              disabled={loading || !stats}
              title="Export official impact report"
              className="flex items-center gap-2 px-3.5 py-2 bg-surface hover:bg-surface-hover border border-border/70 text-text-secondary hover:text-dash-primary hover:border-dash-primary/40 rounded-2xl text-xs font-bold transition-all shadow-pb-subtle cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
          </div>
        </div>

        {/* Hero Impact Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-700 via-indigo-600 to-dash-primary p-6 sm:p-8 text-white shadow-lg border border-white/10">
          {/* Ambient decorative glowing shapes */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute left-1/3 -bottom-20 h-52 w-52 rounded-full bg-amber-400/20 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/25">
                <Heart size={13} className="text-rose-300 fill-rose-300" />
                Community Impact Champion
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                {user?.name || 'Valued Donor'}, your generosity is restoring lives!
              </h2>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                Through your food portions and clothing donations, you have directly nourished families and protected the environment. Here is your live contribution summary.
              </p>
            </div>

            {/* Hero Summary Badges */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-3.5 shadow-xs">
                <div className="p-2.5 bg-white text-dash-primary rounded-xl shadow-md">
                  <Zap size={20} className="fill-dash-primary" />
                </div>
                <div>
                  <p className="text-2xl font-black leading-none">{peopleHelped.toLocaleString()}+</p>
                  <p className="text-[11px] text-white/80 font-semibold mt-1">Lives Touched</p>
                </div>
              </div>

              <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-3.5 shadow-xs">
                <div className="p-2.5 bg-emerald-400 text-emerald-950 rounded-xl shadow-md">
                  <Leaf size={20} />
                </div>
                <div>
                  <p className="text-2xl font-black leading-none">{co2AvoidedKg} <span className="text-xs font-semibold">kg</span></p>
                  <p className="text-[11px] text-white/80 font-semibold mt-1">CO₂ Prevented</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overview KPI Stat Cards with Sparklines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            label="Total Donations"
            value={totalDonations}
            footnote={`${totalDonations} donations pledged in period`}
            color={COLOR.primary}
            icon={TrendingUp}
            sparkData={donationsSpark}
            badgeText={peakMonth ? `Peak: ${Number(peakMonth.count) || 0} in ${peakMonth.month}` : 'Active Flow'}
          />
          <StatTile
            label="Completed Pickups"
            value={completedDonations}
            footnote={`${completedDonations} successfully delivered`}
            color={COLOR.success}
            icon={CheckCircle2}
            sparkData={completedSpark}
            badgeText={`${completionRate}% Completed`}
          />
          <StatTile
            label="Delivery Success Rate"
            value={`${completionRate}%`}
            footnote="Fulfillment & pickup reliability"
            color={COLOR.info}
            icon={Award}
            badgeText={completionTier.label}
          />
          <StatTile
            label="People Supported"
            value={peopleHelped}
            footnote={`${mealsShared} meals · ${clothesDonated} clothes`}
            color={COLOR.donor}
            icon={Heart}
            badgeText="Verified Impact"
          />
        </div>

        {/* Main Charts Row: Donation Activity Flow + Initiative Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Monthly Donation Activity (with Area & Bar view switcher) */}
          <div className="lg:col-span-2 bg-surface rounded-3xl border border-border/70 p-5 sm:p-6 shadow-pb-card flex flex-col justify-between space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-dash-primary-soft text-dash-primary rounded-xl">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Donation Flow & Fulfillment Velocity</h3>
                  <p className="text-xs text-text-secondary">Pledged requests vs completed handovers across months</p>
                </div>
              </div>

              {/* View Switcher & Legend */}
              <div className="flex items-center gap-2">
                <div className="flex items-center p-1 bg-surface-hover/80 border border-border/60 rounded-xl">
                  <button
                    onClick={() => setChartType('area')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      chartType === 'area'
                        ? 'bg-surface text-dash-primary shadow-xs'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <TrendingUp size={13} />
                    <span>Trend</span>
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      chartType === 'bar'
                        ? 'bg-surface text-dash-primary shadow-xs'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <BarChart3 size={13} />
                    <span>Columns</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Legend Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR.primary }} />
                  Total Pledged
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR.success }} />
                  Completed Pickups
                </span>
              </div>
              <span className="text-[11px] text-text-muted font-medium">
                Hover on data points for exact monthly tallies
              </span>
            </div>

            {/* Interactive Chart Canvas */}
            <div className="py-2 min-h-[220px]">
              {chartType === 'area' ? (
                <AreaChart
                  data={monthlyTrend}
                  series={trendSeries}
                  height={225}
                  emptyText="No donation activity recorded in this timeframe"
                  ariaLabel="Monthly donation and pickup trend"
                />
              ) : (
                <GroupedBarChart
                  data={monthlyTrend}
                  series={trendSeries}
                  height={225}
                  emptyText="No donation activity recorded in this timeframe"
                  ariaLabel="Monthly donation and pickup comparison"
                />
              )}
            </div>

            {/* Footer Insight */}
            <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {peakMonth && Number(peakMonth.count) > 0
                    ? `Highest contribution recorded in ${peakMonth.month} (${peakMonth.count} donations)`
                    : 'Submit donations to view peak activity distribution'}
                </span>
              </div>
              <span className="font-semibold text-text-primary">
                Overall: {completedDonations} / {totalDonations} Completed
              </span>
            </div>
          </div>

          {/* Chart 2: Category & Initiative Breakdown (Interactive Donut) */}
          <div className="bg-surface rounded-3xl border border-border/70 p-5 sm:p-6 shadow-pb-card flex flex-col justify-between space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                  <PieChartIcon size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Initiative Breakdown</h3>
                  <p className="text-xs text-text-secondary">Food portions vs. Garments</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-page border border-border/80 text-text-secondary">
                {totalDonations} items
              </span>
            </div>

            {/* Interactive Donut */}
            <div className="flex flex-col items-center justify-center py-2">
              <DonutChart
                data={donutData}
                size={160}
                thickness={16}
                centerLabel="donations"
                ariaLabel="Donation Category Split"
              />
            </div>

            {/* Detailed Category Progress Bars */}
            <div className="space-y-3 pt-1">
              {/* Food Item */}
              <div className="p-3 rounded-2xl bg-page/70 border border-border/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-text-primary">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR.food }} />
                    <Utensils size={13} className="text-amber-500" />
                    <span>Food Initiative</span>
                  </div>
                  <span className="font-extrabold text-text-primary">
                    {foodDonations} <span className="text-[11px] font-medium text-text-muted">({totalDonations > 0 ? Math.round((foodDonations / totalDonations) * 100) : 0}%)</span>
                  </span>
                </div>
                <div className="h-1.5 bg-border/40 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${totalDonations > 0 ? (foodDonations / totalDonations) * 100 : 0}%`,
                      backgroundColor: COLOR.food,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-text-muted pt-0.5">
                  <span>Nutritious servings: {mealsShared}</span>
                  <span>Cooked & fresh</span>
                </div>
              </div>

              {/* Clothing Item */}
              <div className="p-3 rounded-2xl bg-page/70 border border-border/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-text-primary">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR.clothes }} />
                    <Shirt size={13} className="text-sky-500" />
                    <span>Clothing Initiative</span>
                  </div>
                  <span className="font-extrabold text-text-primary">
                    {clothingDonations} <span className="text-[11px] font-medium text-text-muted">({totalDonations > 0 ? Math.round((clothingDonations / totalDonations) * 100) : 0}%)</span>
                  </span>
                </div>
                <div className="h-1.5 bg-border/40 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${totalDonations > 0 ? (clothingDonations / totalDonations) * 100 : 0}%`,
                      backgroundColor: COLOR.clothes,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-text-muted pt-0.5">
                  <span>Garments donated: {clothesDonated}</span>
                  <span>Wearable & winter</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Row: Delivery Performance Radial Gauge + Ecological Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Radial Fulfillment Gauge */}
          <div className="bg-surface rounded-3xl border border-border/70 p-6 shadow-pb-card flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Fulfillment Performance</h3>
                  <p className="text-xs text-text-secondary">Volunteer pickup & delivery rate</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-3">
              <RadialGauge
                value={completionRate}
                size={145}
                thickness={13}
                label="fulfilled"
              />
              <span className={`mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${completionTier.cls}`}>
                <Award size={13} />
                {completionTier.label}
              </span>
            </div>

            <div className="pt-2 grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-page border border-border/60">
                <p className="text-xs text-text-muted font-medium">Completed</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{completedDonations}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-page border border-border/60">
                <p className="text-xs text-text-muted font-medium">Pending/Transit</p>
                <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {Math.max(0, totalDonations - completedDonations)}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Impact & Ecological Footprint Matrix */}
          <div className="lg:col-span-2 bg-surface rounded-3xl border border-border/70 p-6 shadow-pb-card space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Detailed Impact & Ecological Footprint</h3>
                  <p className="text-xs text-text-secondary">Resource units, environmental savings, and community impact</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Leaf size={12} /> Eco-Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImpactCard
                label="Meals Nourished"
                value={`${mealsShared} servings`}
                sub="Nutritious food provided to community"
                icon={Utensils}
                color="text-amber-600 dark:text-amber-400 bg-amber-500/10"
              />
              <ImpactCard
                label="Garments Distributed"
                value={`${clothesDonated} items`}
                sub="Wearable clothing given to individuals"
                icon={Shirt}
                color="text-indigo-600 dark:text-indigo-400 bg-indigo-500/10"
              />
              <ImpactCard
                label="CO₂ Emissions Prevented"
                value={`${co2AvoidedKg} kg CO₂e`}
                sub="Carbon avoided from landfill decomposition"
                icon={Leaf}
                color="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              />
              <ImpactCard
                label="Landfill Waste Diverted"
                value={`${landfillSavedKg} kg`}
                sub="Organic and textile waste recycled"
                icon={Scale}
                color="text-sky-600 dark:text-sky-400 bg-sky-500/10"
              />
            </div>

            {/* Motivational Footer */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-dash-primary-soft to-surface border border-dash-primary/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-dash-primary text-white shadow-xs">
                  <Heart size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary">Every single portion builds a stronger community</p>
                  <p className="text-[11px] text-text-secondary">Keep sharing to unlock new donor milestone badges below.</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/donor/donate')}
                className="hidden sm:inline-flex px-4 py-2 bg-dash-primary hover:bg-dash-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Donate Now
              </button>
            </div>
          </div>
        </div>

        {/* Achievements and Badges Panel */}
        <div className="pt-2">
          <AchievementsPanel userId={user?.id} userRole="donor" />
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatTile({ label, value, footnote, color, icon: Icon, sparkData = [], badgeText }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border/70 bg-surface p-5 sm:p-6 shadow-pb-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pb-elevated hover:border-border">
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-10 blur-xl transition-opacity duration-300 group-hover:opacity-20"
        style={{ backgroundColor: color }}
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl shadow-xs"
            style={{
              color,
              backgroundColor: `color-mix(in oklab, ${color} 15%, transparent)`,
            }}
          >
            <Icon size={18} />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            {label}
          </span>
        </div>

        {badgeText && (
          <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-page border border-border/70 text-text-secondary">
            {badgeText}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl sm:text-3xl font-black leading-none tabular-nums text-text-primary tracking-tight">
            {value}
          </p>
        </div>
        {sparkData.length > 1 && (
          <div className="pb-0.5">
            <Sparkline values={sparkData} color={color} width={80} height={26} />
          </div>
        )}
      </div>

      <p className="mt-3 border-t border-border/50 pt-2.5 text-[11px] font-medium text-text-muted truncate">
        {footnote}
      </p>
    </div>
  );
}

function ImpactCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="p-4 rounded-2xl bg-page/70 border border-border/60 flex items-start gap-3.5 transition-all hover:border-dash-primary/30 hover:bg-page">
      <div className={`p-3 rounded-xl shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xl font-black text-text-primary">{value}</p>
        <p className="text-xs font-bold text-text-primary mt-0.5">{label}</p>
        <p className="text-[11px] text-text-muted mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export default DonorAnalyticsPage;
