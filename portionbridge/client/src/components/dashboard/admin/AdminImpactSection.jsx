import { HeartHandshake, PackageCheck, Utensils, Shirt, Sparkles } from 'lucide-react';
import { SkeletonCard } from '../skeletons';

const IMPACT_ITEMS = [
  {
    key: 'peopleHelped',
    label: 'People Helped',
    icon: HeartHandshake,
    iconBg: 'bg-white/15',
    suffix: '',
  },
  {
    key: 'successfulDonations',
    label: 'Successful Donations',
    icon: PackageCheck,
    iconBg: 'bg-white/15',
    suffix: '',
  },
  {
    key: 'completedPickups',
    label: 'Completed Pickups',
    icon: PackageCheck,
    iconBg: 'bg-white/15',
    suffix: '',
  },
  {
    key: 'mealsShared',
    label: 'Meals Shared',
    icon: Utensils,
    iconBg: 'bg-white/15',
    suffix: '',
  },
  {
    key: 'clothesDonated',
    label: 'Clothes Donated',
    icon: Shirt,
    iconBg: 'bg-white/15',
    suffix: ' items',
  },
];

function ImpactItem({ label, value, icon: Icon, index }) {
  return (
    <div
      className="flex flex-col items-center text-center px-4 py-5"
      style={{ animation: 'rowIn 0.35s ease backwards', animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white/15 border border-white/20 mb-3 backdrop-blur-sm">
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-3xl md:text-4xl font-bold text-white tabular-nums leading-none tracking-tight">
        {(value ?? 0).toLocaleString()}
      </p>
      <p className="text-xs font-medium text-white/60 mt-2 leading-snug">{label}</p>
    </div>
  );
}

/**
 * AdminImpactSection — redesigned as a full-width vibrant gradient banner
 * with large bold metric numbers. Real platform-wide impact from
 * dashboard.impact (GET /admin/dashboard), no fake data.
 */
export function AdminImpactSection({ impact, loading }) {
  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 p-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-white/20">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-4">
              <SkeletonCard count={1} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500 dark:from-emerald-700 dark:via-teal-600 dark:to-cyan-600 shadow-pb-elevated border border-white/10">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white opacity-5 blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-64 h-24 rounded-full bg-white opacity-5 blur-3xl" />

      {/* Header */}
      <div className="relative flex items-center gap-3 px-6 pt-5 pb-3 border-b border-white/15">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 border border-white/25">
          <Sparkles size={14} className="text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Platform Impact</h2>
          <p className="text-xs text-white/55">
            Real outcomes from completed donations across the platform
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="relative grid grid-cols-2 sm:grid-cols-5 divide-x divide-white/15">
        {IMPACT_ITEMS.map((item, i) => (
          <ImpactItem
            key={item.key}
            label={item.label}
            value={impact?.[item.key]}
            icon={item.icon}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
