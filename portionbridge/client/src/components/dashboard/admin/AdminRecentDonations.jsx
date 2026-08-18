import { useNavigate } from 'react-router-dom';
import { Utensils, Shirt, Package } from 'lucide-react';
import { SkeletonTable } from '../skeletons';
import { EmptyState } from '../EmptyState';
import { StatusBadge } from '../../donation/StatusBadge';

const CATEGORY_ICON = {
  food: Utensils,
  clothes: Shirt,
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
 * AdminRecentDonations — the 10 most recent donation requests platform-wide
 * (dashboard.recentDonations from GET /admin/dashboard). Uses the raw
 * admin.model.js donation columns (category, quantity, description,
 * pickup_location, status, created_at) rather than the donor-facing
 * DonationTable's shape (title, volunteer_name, images, quantity_unit),
 * which the admin overview query doesn't return — a full admin donations
 * table with that richer shape is later-phase work (see the "Donations"
 * sidebar section).
 */
export function AdminRecentDonations({ donations, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-surface rounded-lg border border-border/50 p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Recent Donations</h2>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border/50 p-4">
      <h2 className="text-sm font-semibold text-text-primary mb-3">Recent Donations</h2>

      {!donations || donations.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No donations yet"
          description="Donations will show up here as donors submit them."
          showAction={false}
          size="small"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary">Donation</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary">Status</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary">Pickup Location</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary">Created</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation) => {
                const CategoryIcon = CATEGORY_ICON[donation.category] || Package;
                return (
                  <tr
                    key={donation.id}
                    onClick={() => navigate(`/donations/${donation.id}`)}
                    className="border-b border-border/50 hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-dash-primary-soft flex items-center justify-center shrink-0">
                          <CategoryIcon size={14} className="text-dash-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-text-primary truncate max-w-[220px]">
                            {donation.description || `${donation.category} donation`}
                          </p>
                          <p className="text-[11px] text-text-secondary">
                            {donation.quantity} {donation.category === 'food' ? 'servings' : 'items'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={donation.status} size="small" />
                    </td>
                    <td className="py-2.5 px-3 text-xs text-text-secondary truncate max-w-[180px]">
                      {donation.pickup_location || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-text-secondary whitespace-nowrap">
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
