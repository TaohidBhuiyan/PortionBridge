import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  Gift,
  Minus,
  PieChart as PieChartIcon,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  AreaChart,
  DonutChart,
  GroupedBarChart,
  RadialGauge,
  Sparkline,
} from '../../common/AnalyticsCharts';

/* Theme-aware colours (CSS variables follow light/dark mode). */
const COLOR = {
  primary: 'var(--pb-primary)',
  success: 'var(--pb-success)',
  info: 'var(--pb-info)',
  donor: 'var(--pb-donor)',
  volunteer: 'var(--pb-volunteer)',
  food: 'oklch(72% 0.17 55)',
  clothes: 'var(--pb-info)',
};

const CATEGORY_META = {
  food: { label: 'Food', color: COLOR.food },
  clothes: { label: 'Clothes', color: COLOR.clothes },
};

/** Change between the last two months of a series. */
function monthDelta(rows, pick) {
  const cur = pick(rows[rows.length - 1] || {});
  const prev = pick(rows[rows.length - 2] || {});
  if (prev === 0 && cur === 0) return { dir: 'flat', text: 'No change' };
  if (prev === 0) return { dir: 'up', text: 'New this month' };
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (pct === 0) return { dir: 'flat', text: 'No change' };
  return { dir: pct > 0 ? 'up' : 'down', text: `${pct > 0 ? '+' : ''}${pct}%` };
}

const DELTA_STYLE = {
  up: { cls: 'bg-success-soft text-success', Icon: TrendingUp },
  down: { cls: 'bg-danger-soft text-danger', Icon: TrendingDown },
  flat: { cls: 'bg-surface-hover text-text-muted', Icon: Minus },
};

function DeltaPill({ delta }) {
  const { cls, Icon } = DELTA_STYLE[delta.dir];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      <Icon size={11} strokeWidth={2.5} />
      {delta.text}
    </span>
  );
}

function Reveal({ index = 0, className = '', children }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function StatTile({ icon: Icon, label, value, delta, footnote, values, color, index }) {
  return (
    <Reveal index={index}>
      <div className="group relative h-full overflow-hidden rounded-xl border border-border/60 bg-surface p-3.5 sm:p-4 shadow-pb-subtle transition duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-pb-card">
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-[0.10] blur-xl transition-opacity duration-300 group-hover:opacity-20"
          style={{ backgroundColor: color }}
        />
        <div className="relative flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ color, backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)` }}
            >
              <Icon size={16} />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">{label}</span>
          </div>
        </div>
        <div className="relative mt-3 flex items-end justify-between gap-2.5">
          <div>
            <p className="text-xl sm:text-2xl font-bold leading-none tabular-nums text-text-primary">{value}</p>
            <div className="mt-2 flex items-center gap-1.5">
              <DeltaPill delta={delta} />
              <span className="text-[10px] sm:text-[11px] text-text-muted">vs last month</span>
            </div>
          </div>
          <Sparkline values={values} color={color} width={80} height={28} />
        </div>
        <p className="relative mt-2.5 border-t border-border/50 pt-2 text-[11px] text-text-muted truncate">{footnote}</p>
      </div>
    </Reveal>
  );
}

function ChartCard({ icon: Icon, title, subtitle, legend, index = 0, className = '', children }) {
  return (
    <Reveal index={index} className={className}>
      <section className="flex h-full flex-col rounded-xl border border-border/60 bg-surface shadow-pb-subtle transition-colors duration-200 hover:border-border">
        <header className="flex flex-wrap items-start justify-between gap-2.5 px-4 pb-1 pt-3.5 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dash-primary-soft text-dash-primary">
              <Icon size={16} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-text-primary">{title}</h3>
              {subtitle && <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>}
            </div>
          </div>
          {legend && <div className="flex flex-wrap items-center gap-1.5">{legend}</div>}
        </header>
        <div className="flex-1 px-3 pb-3.5 pt-2 sm:px-4 sm:pb-4">{children}</div>
      </section>
    </Reveal>
  );
}

function LegendPills({ items }) {
  return items.map((s) => (
    <span
      key={s.key || s.label}
      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface-hover/60 px-2.5 py-1 text-[11px] font-medium text-text-secondary"
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
      {s.label}
    </span>
  ));
}

function CardSkeleton({ className = '', height = 240 }) {
  return (
    <div className={`animate-pulse rounded-2xl border border-border/60 bg-surface p-5 shadow-pb-card ${className}`}>
      <div className="mb-5 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-surface-hover" />
        <div className="space-y-2">
          <div className="h-3 w-32 rounded bg-surface-hover" />
          <div className="h-2.5 w-48 rounded bg-surface-hover/70" />
        </div>
      </div>
      <div className="rounded-xl bg-surface-hover/60" style={{ height }} />
    </div>
  );
}

function completionTier(rate) {
  if (rate >= 80) return { label: 'Excellent', cls: 'bg-success-soft text-success' };
  if (rate >= 60) return { label: 'Healthy', cls: 'bg-info-soft text-info' };
  if (rate >= 40) return { label: 'Needs attention', cls: 'bg-warning-soft text-warning' };
  return { label: 'Low', cls: 'bg-danger-soft text-danger' };
}

/**
 * AdminAnalyticsSection — premium admin analytics: KPI tiles with month-over-
 * month change, smooth trend charts with tooltips, a category donut and a
 * completion-rate gauge. Same `analytics` payload as before
 * (GET /admin/dashboard -> analytics); nothing changes on the API.
 */
export function AdminAnalyticsSection({ analytics, loading }) {
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} height={64} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <CardSkeleton className="lg:col-span-2" />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const donationTrend = analytics?.donationTrend || [];
  const userGrowth = analytics?.userGrowth || [];
  const volunteerActivity = analytics?.volunteerActivity || [];
  const categoryDistribution = analytics?.categoryDistribution || [];
  const completionRate = Number(analytics?.completionRate) || 0;

  const num = (v) => Number(v) || 0;
  const last = (rows) => rows[rows.length - 1] || {};
  const sum = (rows, pick) => rows.reduce((t, r) => t + pick(r), 0);

  const newUsers = (r) => num(r.donors) + num(r.volunteers);

  const donutData = categoryDistribution
    .map((c) => ({
      label: CATEGORY_META[c.category]?.label || c.category,
      value: num(c.count),
      color: CATEGORY_META[c.category]?.color || 'var(--pb-text-muted)',
    }))
    .filter((c, i, self) => self.findIndex((t) => t.label === c.label) === i);
  const donutTotal = donutData.reduce((t, d) => t + d.value, 0);

  const tier = completionTier(completionRate);

  const trendSeries = [
    { key: 'count', label: 'Total donations', color: COLOR.primary },
    { key: 'completed', label: 'Completed', color: COLOR.success },
  ];
  const activitySeries = [
    { key: 'completedPickups', label: 'Completed pickups', color: COLOR.success },
    { key: 'activeVolunteers', label: 'Active volunteers', color: COLOR.info },
  ];
  const growthSeries = [
    { key: 'donors', label: 'Donors', color: COLOR.donor },
    { key: 'volunteers', label: 'Volunteers', color: COLOR.volunteer },
  ];

  return (
    <div className="space-y-5">
      {/* KPI tiles */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          index={0}
          icon={Gift}
          label="Donations"
          color={COLOR.primary}
          value={num(last(donationTrend).count)}
          delta={monthDelta(donationTrend, (r) => num(r.count))}
          values={donationTrend.map((r) => num(r.count))}
          footnote={`${sum(donationTrend, (r) => num(r.count))} in the last ${donationTrend.length || 6} months`}
        />
        <StatTile
          index={1}
          icon={CheckCircle2}
          label="Completed"
          color={COLOR.success}
          value={num(last(donationTrend).completed)}
          delta={monthDelta(donationTrend, (r) => num(r.completed))}
          values={donationTrend.map((r) => num(r.completed))}
          footnote={`${sum(donationTrend, (r) => num(r.completed))} completed in the last ${donationTrend.length || 6} months`}
        />
        <StatTile
          index={2}
          icon={UserPlus}
          label="New users"
          color={COLOR.donor}
          value={newUsers(last(userGrowth))}
          delta={monthDelta(userGrowth, newUsers)}
          values={userGrowth.map(newUsers)}
          footnote={`${sum(userGrowth, newUsers)} sign-ups in the last ${userGrowth.length || 6} months`}
        />
        <StatTile
          index={3}
          icon={Activity}
          label="Pickups"
          color={COLOR.info}
          value={num(last(volunteerActivity).completedPickups)}
          delta={monthDelta(volunteerActivity, (r) => num(r.completedPickups))}
          values={volunteerActivity.map((r) => num(r.completedPickups))}
          footnote={`${sum(volunteerActivity, (r) => num(r.completedPickups))} pickups in the last ${volunteerActivity.length || 6} months`}
        />
      </div>

      {/* Donation trend + completion gauge */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          index={4}
          icon={TrendingUp}
          title="Donation Trend"
          subtitle="Total vs. completed donations, last 6 months"
          legend={<LegendPills items={trendSeries} />}
        >
          <AreaChart data={donationTrend} series={trendSeries} height={215} ariaLabel="Donation trend, total versus completed, last 6 months" />
        </ChartCard>

        <ChartCard
          index={5}
          icon={CheckCircle2}
          title="Completion Rate"
          subtitle="Share of all-time donations completed"
        >
          <div className="flex h-full flex-col items-center justify-center gap-3 py-2">
            <RadialGauge value={completionRate} size={130} thickness={11} label="completed" />
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tier.cls}`}>{tier.label}</span>
            <p className="max-w-[210px] text-center text-xs leading-relaxed text-text-secondary">
              Completed donations divided by every donation request ever made on the platform.
            </p>
          </div>
        </ChartCard>
      </div>

      {/* Volunteer activity + category split */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          index={6}
          icon={Activity}
          title="Volunteer Activity"
          subtitle="Completed pickups vs. active volunteers, last 6 months"
          legend={<LegendPills items={activitySeries} />}
        >
          <AreaChart data={volunteerActivity} series={activitySeries} height={215} ariaLabel="Volunteer activity, completed pickups versus active volunteers, last 6 months" />
        </ChartCard>

        <ChartCard
          index={7}
          icon={PieChartIcon}
          title="Category Split"
          subtitle="All non-deleted donations, all time"
        >
          {donutTotal > 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-1">
              <DonutChart data={donutData} size={144} thickness={15} centerLabel="donations" ariaLabel="Donation category split" />
              <ul className="w-full space-y-2">
                {donutData.map((d) => {
                  const pct = donutTotal ? Math.round((d.value / donutTotal) * 100) : 0;
                  return (
                    <li key={d.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-medium text-text-primary">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                          {d.label}
                        </span>
                        <span className="tabular-nums text-text-secondary">
                          <span className="font-semibold text-text-primary">{d.value}</span> · {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-hover text-text-muted">
                <PieChartIcon size={20} />
              </span>
              <p className="text-sm font-medium text-text-primary">No donations yet</p>
              <p className="text-xs text-text-secondary">The split appears once donations are posted.</p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* User growth */}
      <ChartCard
        index={8}
        icon={Users}
        title="User Growth"
        subtitle="New donors vs. volunteers, last 6 months"
        legend={<LegendPills items={growthSeries} />}
      >
        <GroupedBarChart data={userGrowth} series={growthSeries} height={215} ariaLabel="New donors versus volunteers, last 6 months" />
      </ChartCard>
    </div>
  );
}
