import { LineChart } from '../../common/LineChart';
import { PieChart } from '../../common/PieChart';
import { SkeletonCard } from '../skeletons';

const CATEGORY_COLORS = { food: '#f97316', clothes: '#3b82f6' };
const CATEGORY_LABELS = { food: 'Food', clothes: 'Clothes' };

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-surface rounded-lg border border-border/50 p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-0.5">{title}</h3>
      {subtitle && <p className="text-xs text-text-secondary mb-3">{subtitle}</p>}
      {children}
    </div>
  );
}

/**
 * AdminAnalyticsSection — Phase 2 Overview analytics: donation trend,
 * completion rate, category distribution, user growth, volunteer
 * activity. `analytics` is dashboard.analytics from GET /admin/dashboard
 * (admin.service.js#getDashboard) — all real aggregate SQL, 6 trailing
 * months, zero-filled where there's no data (not hidden/hardcoded).
 *
 * Reuses the existing LineChart/PieChart components from
 * components/common (same ones DonorAnalyticsPage already uses) rather
 * than introducing a charting library.
 */
export function AdminAnalyticsSection({ analytics, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-lg border border-border/50 p-5">
            <SkeletonCard count={1} />
          </div>
        ))}
      </div>
    );
  }

  const donationTrend = analytics?.donationTrend || [];
  const userGrowth = analytics?.userGrowth || [];
  const volunteerActivity = analytics?.volunteerActivity || [];
  const categoryDistribution = analytics?.categoryDistribution || [];
  const hasCategoryData = categoryDistribution.some((c) => c.count > 0);

  const pieData = categoryDistribution.map((c) => ({
    label: CATEGORY_LABELS[c.category] || c.category,
    value: c.count,
    color: CATEGORY_COLORS[c.category] || '#94a3b8',
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Donation Trend" subtitle="Total vs. completed donations, last 6 months">
          <LineChart data={donationTrend} dataKey="count" height={180} />
          <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(147, 51, 234)' }} />
              Total
            </span>
          </div>
        </ChartCard>

        <ChartCard title="Donation Category Distribution" subtitle="All non-cancelled donations, all time">
          {hasCategoryData ? (
            <PieChart data={pieData} size={160} />
          ) : (
            <div className="flex items-center justify-center h-[160px]">
              <p className="text-sm text-text-secondary">No donations yet</p>
            </div>
          )}
        </ChartCard>

        <ChartCard title="User Growth" subtitle="New donors vs. volunteers, last 6 months">
          <LineChart data={userGrowth} dataKey="donors" height={140} color="#f97316" />
          <div className="mt-1">
            <LineChart data={userGrowth} dataKey="volunteers" height={140} color="#3b82f6" />
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f97316]" /> Donors
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3b82f6]" /> Volunteers
            </span>
          </div>
        </ChartCard>

        <ChartCard title="Volunteer Activity" subtitle="Completed pickups vs. active volunteers, last 6 months">
          <LineChart data={volunteerActivity} dataKey="completedPickups" height={140} color="#22c55e" />
          <div className="mt-1">
            <LineChart data={volunteerActivity} dataKey="activeVolunteers" height={140} color="#0ea5e9" />
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22c55e]" /> Completed Pickups
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0ea5e9]" /> Active Volunteers
            </span>
          </div>
        </ChartCard>
      </div>

      <div className="bg-surface rounded-lg border border-border/50 p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Completion Rate</h3>
          <p className="text-xs text-text-secondary">Share of all-time donations that reached "completed"</p>
        </div>
        <p className="text-3xl font-bold text-dash-primary">{analytics?.completionRate ?? 0}%</p>
      </div>
    </div>
  );
}
