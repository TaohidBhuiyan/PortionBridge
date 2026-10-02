import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard';
import { useAuth } from '../context/AuthContext';
import {
  AdminStatsCards,
  AdminImpactSection,
  AdminAnalyticsSection,
  AdminRecentDonations,
  AdminRecentUsers,
  AdminRecentActivity,
} from '../components/dashboard/admin';
import { ErrorState } from '../components/dashboard';
import { adminApi } from '../services/adminApi';
import {
  ShieldCheck,
  Activity,
  TrendingUp,
  Clock,
  RotateCw,
} from 'lucide-react';

/**
 * Admin Dashboard — Clean, Proportional Command Center.
 *
 * Real-time data from GET /admin/dashboard (adminApi.getDashboard).
 */
export function AdminDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      const result = await adminApi.getDashboard();
      if (cancelled) return;
      if (result.success) {
        setDashboard(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    fetchDashboard();
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  const greeting = (() => {
    const h = currentTime.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = user?.name?.split(' ')[0] || 'Admin';

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Modern Header ── */}
        <div className="relative overflow-hidden rounded-xl bg-surface border border-border/70 p-4 sm:p-5 shadow-pb-subtle">
          {/* Subtle accent top border */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-dash-primary via-indigo-500 to-emerald-500" />
          
          {/* Ambient soft glow */}
          <div className="pointer-events-none absolute -top-12 -left-12 w-48 h-48 rounded-full bg-dash-primary/5 dark:bg-dash-primary/10 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left — greeting */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-dash-primary-soft text-dash-primary">
                  <ShieldCheck size={14} />
                </div>
                <span className="text-[11px] font-bold text-dash-primary uppercase tracking-wider">
                  Admin Command Center
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                {greeting}, {firstName} 👋
              </h1>
              <p className="text-text-secondary text-xs sm:text-sm mt-0.5">
                Platform-wide overview — donors, volunteers, and donations at a glance.
              </p>
            </div>

            {/* Right — live status pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Live</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-hover/70 border border-border/60">
                <Activity size={13} className="text-violet-500 dark:text-violet-400" />
                <span className="text-xs font-medium text-text-secondary">
                  <strong className="text-text-primary font-semibold">{loading ? '—' : (dashboard?.activeDonations ?? 0)}</strong> Active
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-hover/70 border border-border/60">
                <TrendingUp size={13} className="text-sky-500 dark:text-sky-400" />
                <span className="text-xs font-medium text-text-secondary">
                  <strong className="text-text-primary font-semibold">{loading ? '—' : (dashboard?.analytics?.completionRate ?? 0)}%</strong> Rate
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-hover/70 border border-border/60">
                <Clock size={13} className="text-amber-500 dark:text-amber-400" />
                <span className="text-xs font-medium text-text-secondary tabular-nums">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <button
                onClick={() => setRefreshTrigger((t) => t + 1)}
                title="Refresh dashboard"
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-hover/80 hover:bg-surface-hover border border-border/60 text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Refresh dashboard data"
              >
                <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <ErrorState
            title="Failed to load dashboard"
            message={error}
            onRetry={() => setRefreshTrigger((t) => t + 1)}
          />
        ) : (
          <>
            {/* ── KPI Stats ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-bold text-text-primary">Platform Metrics</h2>
                  <p className="text-[11px] text-text-secondary">Key performance indicators across the platform</p>
                </div>
              </div>
              <AdminStatsCards dashboard={dashboard} loading={loading} />
            </section>

            {/* ── Impact Section ── */}
            <AdminImpactSection impact={dashboard?.impact} loading={loading} />

            {/* ── Analytics Charts ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-bold text-text-primary">Analytics & Trends</h2>
                  <p className="text-[11px] text-text-secondary">Platform trends and distributions over the last 6 months</p>
                </div>
              </div>
              <AdminAnalyticsSection analytics={dashboard?.analytics} loading={loading} />
            </section>

            {/* ── Recent Activity ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-bold text-text-primary">Recent Activity</h2>
                  <p className="text-[11px] text-text-secondary">Latest donations, signups, and platform events</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                <div className="lg:col-span-2 space-y-4 sm:space-y-5">
                  <AdminRecentDonations donations={dashboard?.recentDonations} loading={loading} />
                  <AdminRecentUsers users={dashboard?.recentUsers} loading={loading} />
                </div>
                <AdminRecentActivity activity={dashboard?.recentActivity} loading={loading} />
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
