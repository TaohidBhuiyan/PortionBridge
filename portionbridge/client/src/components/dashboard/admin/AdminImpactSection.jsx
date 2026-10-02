import { HeartHandshake, PackageCheck, Utensils, Shirt, Sparkles, CheckCircle2 } from 'lucide-react';
import { SkeletonCard } from '../skeletons';

const IMPACT_ITEMS = [
  {
    key: 'peopleHelped',
    label: 'People Helped',
    icon: HeartHandshake,
    tone: 'emerald',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    hoverBorder: 'hover:border-emerald-500/30',
  },
  {
    key: 'successfulDonations',
    label: 'Successful Donations',
    icon: PackageCheck,
    tone: 'teal',
    badgeBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    hoverBorder: 'hover:border-teal-500/30',
  },
  {
    key: 'completedPickups',
    label: 'Completed Pickups',
    icon: CheckCircle2,
    tone: 'cyan',
    badgeBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    hoverBorder: 'hover:border-cyan-500/30',
  },
  {
    key: 'mealsShared',
    label: 'Meals Shared',
    icon: Utensils,
    tone: 'amber',
    badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    hoverBorder: 'hover:border-amber-500/30',
  },
  {
    key: 'clothesDonated',
    label: 'Clothes Donated',
    icon: Shirt,
    tone: 'indigo',
    badgeBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    hoverBorder: 'hover:border-indigo-500/30',
  },
];

function ImpactItem({ label, value, icon: Icon, badgeBg, hoverBorder, index }) {
  return (
    <div
      className={`group relative flex flex-col items-center text-center p-3 sm:p-3.5 rounded-xl bg-surface-hover/40 dark:bg-surface-hover/20 border border-border/50 ${hoverBorder} transition-all duration-200`}
      style={{ animation: 'rowIn 0.3s ease backwards', animationDelay: `${index * 40}ms` }}
    >
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${badgeBg} mb-2 group-hover:scale-105 transition-transform duration-200`}>
        <Icon size={16} />
      </div>
      <p className="text-lg sm:text-xl font-bold text-text-primary tabular-nums leading-tight tracking-tight">
        {(value ?? 0).toLocaleString()}
      </p>
      <p className="text-xs font-medium text-text-secondary mt-1 truncate max-w-full">{label}</p>
    </div>
  );
}

/**
 * AdminImpactSection — cohesive, proportional impact section.
 * Real platform-wide impact from dashboard.impact (GET /admin/dashboard).
 */
export function AdminImpactSection({ impact, loading }) {
  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border/60 p-4 shadow-pb-card">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 bg-surface-hover/30 rounded-xl">
              <SkeletonCard count={1} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border/60 shadow-pb-card overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Sparkles size={14} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">Platform Impact</h2>
            <p className="text-[11px] text-text-secondary">
              Real-world outcomes generated from verified completed donations
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Verified Outcomes
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {IMPACT_ITEMS.map((item, i) => (
          <ImpactItem
            key={item.key}
            label={item.label}
            value={impact?.[item.key]}
            icon={item.icon}
            badgeBg={item.badgeBg}
            hoverBorder={item.hoverBorder}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
