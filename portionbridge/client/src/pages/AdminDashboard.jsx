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
} from 'lucide-react';

/**
 * Admin Dashboard — Premium Command Center (Redesigned).
 *
 * Everything here comes from the single enriched GET /admin/dashboard
 * payload (adminApi.getDashboard / admin.service.js#getDashboard) — no
 * fake/hardcoded numbers anywhere on this page.
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
      <div className="space-y-8">

        {/* ── Premium Hero Header ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[oklch(30%_0.09_285)] via-[oklch(25%_0.12_292)] to-[oklch(20%_0.08_280)] dark:from-[oklch(22%_0.09_285)] dark:via-[oklch(18%_0.12_292)] dark:to-[oklch(14%_0.08_280)] shadow-pb-elevated border border-white/10 p-6 md:p-8">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[oklch(60%_0.25_292)] opacity-10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[oklch(65%_0.2_250)] opacity-10 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 rounded-full bg-[oklch(55%_0.18_310)] opacity-5 blur-2xl" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            {/* Left — greeting */}
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm">
                  <ShieldCheck size={18} className="text-white" />
                </div>
                <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">
                  Admin Control Center
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                {greeting}, {firstName} 👋
              </h1>
              <p className="text-white/50 text-sm mt-1">
                Platform-wide overview — donors, volunteers, and donations at a glance.
              </p>
            </div>

            {/* Right — live pulse cards */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                </span>
                <span className="text-xs font-semibold text-white/80">Live</span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
                <Activity size={14} className="text-violet-300" />
                <span className="text-xs font-semibold text-white/80">
                  {loading ? '—' : (dashboard?.activeDonations ?? 0)} Active Donations
                </span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
                <TrendingUp size={14} className="text-sky-300" />
                <span className="text-xs font-semibold text-white/80">
                  {loading ? '—' : (dashboard?.analytics?.completionRate ?? 0)}% Completion Rate
                </span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
                <Clock size={14} className="text-amber-300" />
                <span className="text-xs font-semibold text-white/80">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-text-primary">Platform Metrics</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Key performance indicators across the platform</p>
                </div>
              </div>
              <AdminStatsCards dashboard={dashboard} loading={loading} />
            </section>

            {/* ── Impact Banner ── */}
            <AdminImpactSection impact={dashboard?.impact} loading={loading} />

            {/* ── Analytics Charts ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-text-primary">Analytics</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Trends and distributions over the last 6 months</p>
                </div>
              </div>
              <AdminAnalyticsSection analytics={dashboard?.analytics} loading={loading} />
            </section>

            {/* ── Recent Activity ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-text-primary">Recent Activity</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Latest donations, signups, and platform events</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-5">
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
