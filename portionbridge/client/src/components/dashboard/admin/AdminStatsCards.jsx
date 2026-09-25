import {
  Users,
  UtensilsCrossed,
  HeartHandshake,
  Clock,
  CheckCircle2,
  Activity,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { SkeletonCard } from '../skeletons';

const CARD_CONFIG = [
  {
    icon: Users,
    label: 'Total Users',
    key: 'totalUsers',
    tone: 'violet',
    iconBg: 'bg-violet-500/15 dark:bg-violet-500/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
    gradient: 'from-violet-500/5 to-transparent',
  },
  {
    icon: HeartHandshake,
    label: 'Total Donors',
    key: 'totalDonors',
    tone: 'pink',
    iconBg: 'bg-pink-500/15 dark:bg-pink-500/20',
    iconColor: 'text-pink-600 dark:text-pink-400',
    gradient: 'from-pink-500/5 to-transparent',
  },
  {
    icon: UserCheck,
    label: 'Volunteers',
    key: 'totalVolunteers',
    tone: 'sky',
    iconBg: 'bg-sky-500/15 dark:bg-sky-500/20',
    iconColor: 'text-sky-600 dark:text-sky-400',
    gradient: 'from-sky-500/5 to-transparent',
  },
  {
    icon: UtensilsCrossed,
    label: 'Total Donations',
    key: 'totalDonationRequests',
    tone: 'indigo',
    iconBg: 'bg-indigo-500/15 dark:bg-indigo-500/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    gradient: 'from-indigo-500/5 to-transparent',
  },
  {
    icon: Activity,
    label: 'Active Donations',
    key: 'activeDonations',
    tone: 'amber',
    iconBg: 'bg-amber-500/15 dark:bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-500/5 to-transparent',
  },
  {
    icon: CheckCircle2,
    label: 'Completed',
    key: 'completed',
    tone: 'emerald',
    iconBg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-500/5 to-transparent',
  },
  {
    icon: Clock,
    label: 'Pending',
    key: 'pending',
    tone: 'orange',
    iconBg: 'bg-orange-500/15 dark:bg-orange-500/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-500/5 to-transparent',
  },
  {
    icon: TrendingUp,
    label: 'Active Volunteers',
    key: 'activeVolunteers',
    tone: 'teal',
    iconBg: 'bg-teal-500/15 dark:bg-teal-500/20',
    iconColor: 'text-teal-600 dark:text-teal-400',
    gradient: 'from-teal-500/5 to-transparent',
  },
];

function KpiCard({ icon: Icon, label, value, iconBg, iconColor, gradient, index }) {
  return (
    <div
      className={`group relative overflow-hidden bg-surface rounded-xl border border-border/60 p-4 hover:border-dash-primary/30 hover:shadow-pb-card transition-all duration-200 cursor-default`}
      style={{ animation: 'rowIn 0.3s ease backwards', animationDelay: `${index * 40}ms` }}
    >
      {/* Gradient tint */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

      <div className="relative flex items-start justify-between gap-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${iconBg} shrink-0 group-hover:scale-105 transition-transform duration-200`}>
          <Icon size={18} className={iconColor} />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="text-2xl font-bold text-text-primary tabular-nums leading-tight tracking-tight">
            {(value ?? 0).toLocaleString()}
          </p>
        </div>
      </div>
      <p className="relative mt-2.5 text-xs font-medium text-text-secondary truncate">{label}</p>
    </div>
  );
}

/**
 * AdminStatsCards — 8 premium KPI cards for the Admin Command Center.
 * Redesigned from a dense metric strip to individual tinted cards with
 * colored icon circles and hover animations.
 */
export function AdminStatsCards({ dashboard, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-xl border border-border/60 p-4">
            <SkeletonCard count={1} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {CARD_CONFIG.map((card, index) => (
        <KpiCard
          key={card.key}
          icon={card.icon}
          label={card.label}
          value={dashboard?.[card.key]}
          iconBg={card.iconBg}
          iconColor={card.iconColor}
          gradient={card.gradient}
          index={index}
        />
      ))}
    </div>
  );
}
