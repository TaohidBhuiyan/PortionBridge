import { Users, UtensilsCrossed, HeartHandshake, Clock, CheckCircle2, Activity, UserCheck } from 'lucide-react';
import { SkeletonCard } from '../skeletons';
import { useCountUp } from '../../../hooks/useCountUp';
import { StaggerGrid } from '../../common';

const TONE_CLASSES = {
  primary: 'bg-dash-primary-soft text-dash-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
};

function StatCard({ icon: Icon, label, value, tone = 'primary' }) {
  const animatedValue = useCountUp(value ?? 0, true, 1000);

  return (
    <div className="bg-surface rounded-lg border border-border/50 p-4 hover:border-dash-primary/30 hover:shadow-md hover:scale-[1.01] transition-all duration-200 ease-out">
      <div className={`w-9 h-9 rounded-md flex items-center justify-center mb-3 ${TONE_CLASSES[tone]}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-semibold text-text-primary mb-0.5 tracking-tight">
        {animatedValue.toLocaleString()}
      </p>
      <p className="text-xs font-medium text-text-secondary">{label}</p>
    </div>
  );
}

/**
 * AdminStatsCards — the 8 KPI cards for the Phase 2 Admin Overview /
 * Command Center, in the exact order specified: Total Users, Total
 * Donors, Total Volunteers, Total Donations, Active Donations, Completed
 * Donations, Pending Donations, Active Volunteers.
 *
 * `dashboard` is the object returned by GET /admin/dashboard
 * (adminApi.getDashboard) — `activeDonations` and `activeVolunteers` are
 * new Phase 2 fields computed server-side in admin.service.js#getDashboard.
 */
export function AdminStatsCards({ dashboard, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-lg border border-border/50 p-4">
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
    <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </StaggerGrid>
  );
}
