import { Users, UtensilsCrossed, HeartHandshake, Clock, CheckCircle2, Activity, UserCheck } from 'lucide-react';
import { SkeletonCard } from '../skeletons';

const TONE_CLASSES = {
  primary: 'text-dash-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
};

/**
 * PHASE 10.1 — deliberately NOT the same "icon-in-a-tinted-box card" shape
 * used by donor/volunteer stat cards. Admin is a control-center: this is a
 * single dense metric strip (one bordered panel, thin dividers between
 * cells) rather than 8 separate rounded cards, so more KPIs are scannable
 * at a glance the way an ops dashboard or SaaS admin panel reads — a
 * data-table density, not a consumer-card density.
 */
function MetricCell({ icon: Icon, label, value, tone = 'primary', index = 0 }) {
  return (
    <div
      className="flex items-center gap-2.5 px-3.5 py-3 min-w-0 transition-colors duration-150 hover:bg-surface-hover"
      style={{ animation: 'rowIn 0.25s ease backwards', animationDelay: `${index * 30}ms` }}
    >
      <Icon size={15} className={`shrink-0 ${TONE_CLASSES[tone]}`} />
      <div className="min-w-0">
        <p className="text-lg font-semibold text-text-primary leading-tight tracking-tight tabular-nums">
          {(value ?? 0).toLocaleString()}
        </p>
        <p className="text-[11px] font-medium text-text-secondary truncate">{label}</p>
      </div>
    </div>
  );
}

/**
 * AdminStatsCards — the 8 KPI metrics for the Admin Overview / Command
 * Center, in the exact order specified: Total Users, Total Donors, Total
 * Volunteers, Total Donations, Active Donations, Completed Donations,
 * Pending Donations, Active Volunteers.
 *
 * `dashboard` is the object returned by GET /admin/dashboard
 * (adminApi.getDashboard) — `activeDonations` and `activeVolunteers` are
 * server-computed fields in admin.service.js#getDashboard. No fake data.
 */
export function AdminStatsCards({ dashboard, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 bg-surface rounded-lg border border-border/50 divide-x divide-y sm:divide-y-0 divide-border/50">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-3.5">
            <SkeletonCard count={1} />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { icon: Users, label: 'Total Users', value: dashboard?.totalUsers, tone: 'primary' },
    { icon: HeartHandshake, label: 'Total Donors', value: dashboard?.totalDonors, tone: 'info' },
    { icon: UserCheck, label: 'Total Volunteers', value: dashboard?.totalVolunteers, tone: 'info' },
    { icon: UtensilsCrossed, label: 'Total Donations', value: dashboard?.totalDonationRequests, tone: 'primary' },
    { icon: Activity, label: 'Active Donations', value: dashboard?.activeDonations, tone: 'warning' },
    { icon: CheckCircle2, label: 'Completed Donations', value: dashboard?.completed, tone: 'success' },
    { icon: Clock, label: 'Pending Donations', value: dashboard?.pending, tone: 'warning' },
    { icon: Users, label: 'Active Volunteers', value: dashboard?.activeVolunteers, tone: 'info' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 bg-surface rounded-lg border border-border/50 divide-x divide-y sm:divide-y-0 divide-border/50 overflow-hidden">
      {cards.map((card, index) => (
        <MetricCell key={card.label} {...card} index={index} />
      ))}
    </div>
  );
}
