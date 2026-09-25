import { useNavigate } from 'react-router-dom';
import { Utensils, Shirt, Package, ArrowRight } from 'lucide-react';
import { SkeletonTable } from '../skeletons';
import { EmptyState } from '../EmptyState';
import { StatusBadge } from '../../donation/StatusBadge';

const CATEGORY_META = {
  food: {
    icon: Utensils,
    iconBg: 'bg-orange-500/15 dark:bg-orange-500/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
    label: 'Food',
  },
  clothes: {
    icon: Shirt,
    iconBg: 'bg-blue-500/15 dark:bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    label: 'Clothes',
  },
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * AdminRecentDonations — premium redesign with color-coded category icons,
 * improved row hover, and a "View All" header link.
 */
export function AdminRecentDonations({ donations, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <div className="h-4 w-36 bg-surface-hover rounded animate-pulse" />
        </div>
        <div className="p-4">
          <SkeletonTable rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border/60 overflow-hidden hover:shadow-pb-card transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <h2 className="text-sm font-bold text-text-primary">Recent Donations</h2>
        <button
          onClick={() => navigate('/admin/donations')}
          className="flex items-center gap-1 text-xs font-medium text-dash-primary hover:text-dash-primary-hover transition-colors group"
        >
          View All
          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {!donations || donations.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={Package}
            title="No donations yet"
            description="Donations will show up here as donors submit them."
            showAction={false}
            size="small"
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-hover/50">
                <th className="text-left py-2.5 px-5 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  Donation
                </th>
                <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">
                  Location
                </th>
                <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider hidden sm:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {donations.map((donation, i) => {
                const meta = CATEGORY_META[donation.category] || {
                  icon: Package,
                  iconBg: 'bg-violet-500/15',
                  iconColor: 'text-violet-600',
                  label: donation.category,
                };
                const Icon = meta.icon;
                return (
                  <tr
                    key={donation.id}
                    onClick={() => navigate(`/donations/${donation.id}`)}
                    className="group hover:bg-surface-hover/60 transition-colors cursor-pointer"
                    style={{ animation: 'rowIn 0.25s ease backwards', animationDelay: `${i * 30}ms` }}
                  >
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.iconBg} group-hover:scale-105 transition-transform duration-150`}>
                          <Icon size={15} className={meta.iconColor} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-text-primary truncate max-w-[200px]">
                            {donation.description || `${meta.label} donation`}
                          </p>
                          <p className="text-[11px] text-text-secondary">
                            {donation.quantity} {donation.category === 'food' ? 'servings' : 'items'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={donation.status} size="small" />
                    </td>
                    <td className="py-3 px-3 text-xs text-text-secondary truncate max-w-[160px] hidden md:table-cell">
                      {donation.pickup_location || '—'}
                    </td>
                    <td className="py-3 px-3 text-xs text-text-secondary whitespace-nowrap hidden sm:table-cell">
                      {formatDate(donation.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
