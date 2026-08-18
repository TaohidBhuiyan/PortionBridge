import { HeartHandshake, PackageCheck, Utensils, Shirt } from 'lucide-react';
import { SkeletonCard } from '../skeletons';

function ImpactItem({ label, value, icon: Icon }) {
  return (
    <div className="bg-surface rounded-lg p-4 border border-border/50">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={14} className="text-success" />
        <p className="text-2xl font-bold text-text-primary">{(value ?? 0).toLocaleString()}</p>
      </div>
      <p className="text-sm text-text-secondary">{label}</p>
    </div>
  );
}

/**
 * AdminImpactSection — platform-wide impact totals (Phase 2 Overview).
 * `impact` is dashboard.impact from GET /admin/dashboard, computed
 * server-side in admin.service.js#getDashboard using the same
 * mealsShared/clothesDonated -> peopleHelped formula as the donor-facing
 * profile.service.js#getDonationStatistics, so the language means the
 * same thing platform-wide as it does on a single donor's profile.
 */
export function AdminImpactSection({ impact, loading }) {
  if (loading) {
    return (
      <div className="bg-success-soft rounded-lg border border-success/30 p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Impact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-lg p-4 border border-border/50">
              <SkeletonCard count={1} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-success-soft rounded-lg border border-success/30 p-6">
      <h2 className="text-lg font-semibold text-text-primary mb-1">Impact</h2>
      <p className="text-sm text-text-secondary mb-4">
        Real outcomes from completed donations across the platform.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <ImpactItem label="People Helped" value={impact?.peopleHelped} icon={HeartHandshake} />
        <ImpactItem label="Successful Donations" value={impact?.successfulDonations} icon={PackageCheck} />
        <ImpactItem label="Completed Pickups" value={impact?.completedPickups} icon={PackageCheck} />
        <ImpactItem label="Meals Shared" value={impact?.mealsShared} icon={Utensils} />
        <ImpactItem label="Clothes Donated" value={impact?.clothesDonated} icon={Shirt} />
      </div>
    </div>
  );
}
