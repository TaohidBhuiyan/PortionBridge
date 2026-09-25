import { LineChart } from '../../common/LineChart';
import { PieChart } from '../../common/PieChart';
import { SkeletonCard } from '../skeletons';
import { TrendingUp } from 'lucide-react';

const CATEGORY_COLORS = { food: '#f97316', clothes: '#3b82f6' };
const CATEGORY_LABELS = { food: 'Food', clothes: 'Clothes' };

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-surface rounded-xl border border-border/60 overflow-hidden hover:border-border transition-colors duration-200 hover:shadow-pb-card ${className}`}>
      <div className="px-5 pt-4 pb-3 border-b border-border/50">
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
        {subtitle && (
          <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/**
 * AdminAnalyticsSection — Phase 2 Overview analytics redesigned with
 * refined ChartCard headers and a hero completion-rate metric card.
 */
export function AdminAnalyticsSection({ analytics, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-xl border border-border/60 p-5">
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

  const completionRate = analytics?.completionRate ?? 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Donation Trend */}
        <ChartCard
          title="Donation Trend"
          subtitle="Total vs. completed donations — last 6 months"
        >
          <LineChart data={donationTrend} dataKey="count" height={180} />
          <div className="flex items-center gap-4 mt-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'rgb(147, 51, 234)' }} />
              Total donations
            </span>
          </div>
        </ChartCard>

        {/* Category Distribution */}
        <ChartCard
          title="Donation Category Split"
          subtitle="All non-cancelled donations, all time"
        >
          {hasCategoryData ? (
            <>
              <PieChart data={pieData} size={160} />
              <div className="flex items-center justify-center gap-5 mt-3 text-xs text-text-secondary">
                {pieData.map((d) => (
                  <span key={d.label} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.label}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[160px]">
              <p className="text-sm text-text-secondary">No donations yet</p>
            </div>
          )}
        </ChartCard>

        {/* User Growth */}
        <ChartCard
          title="User Growth"
          subtitle="New donors vs. volunteers — last 6 months"
        >
          <LineChart data={userGrowth} dataKey="donors" height={140} color="#f97316" />
          <div className="mt-1">
            <LineChart data={userGrowth} dataKey="volunteers" height={140} color="#3b82f6" />
          </div>
          <div className="flex items-center gap-5 mt-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
              Donors
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
              Volunteers
            </span>
          </div>
        </ChartCard>

        {/* Volunteer Activity */}
        <ChartCard
          title="Volunteer Activity"
          subtitle="Completed pickups vs. active volunteers — last 6 months"
        >
          <LineChart data={volunteerActivity} dataKey="completedPickups" height={140} color="#22c55e" />
          <div className="mt-1">
            <LineChart data={volunteerActivity} dataKey="activeVolunteers" height={140} color="#0ea5e9" />
          </div>
          <div className="flex items-center gap-5 mt-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
              Completed Pickups
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />
              Active Volunteers
            </span>
          </div>
        </ChartCard>
      </div>

      {/* Completion Rate — hero metric card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-dash-primary/10 via-dash-primary/5 to-transparent rounded-xl border border-dash-primary/20 p-5 flex items-center justify-between gap-4">
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-dash-primary/8 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-dash-primary/15 border border-dash-primary/25">
            <TrendingUp size={18} className="text-dash-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Overall Completion Rate</h3>
            <p className="text-xs text-text-secondary">Share of all-time donations that reached "completed"</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-4xl font-bold text-dash-primary tabular-nums">{completionRate}%</p>
          <p className="text-xs text-text-secondary mt-0.5">completion</p>
        </div>
      </div>
    </div>
  );
}
