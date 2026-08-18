import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Shirt, Package, Flag } from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { SkeletonTable } from '../components/dashboard/skeletons';
import { AdminPagination } from '../components/dashboard/admin';
import { StatusBadge } from '../components/donation/StatusBadge';
import { adminApi } from '../services/adminApi';

const PAGE_SIZE = 15;
const CATEGORY_ICON = { food: Utensils, clothes: Shirt };

// Each tab maps to the exact filter params admin.model.js#buildAdminDonationFilter
// already supports (status / deleted / reported). "Cancelled" isn't a raw
// `status` value in this schema — cancellation is represented by
// is_deleted = 1 — so it filters on `deleted` instead, matching how
// admin.model.js#getDonationCounts already treats "cancelled".
const TABS = [
  { key: 'all', label: 'All', filters: {} },
  { key: 'pending', label: 'Pending', filters: { status: 'pending' } },
  { key: 'accepted', label: 'Accepted', filters: { status: 'accepted' } },
  { key: 'scheduled', label: 'Scheduled', filters: { status: 'scheduled' } },
  { key: 'on_the_way', label: 'On the Way', filters: { status: 'on_the_way' } },
  { key: 'picked_up', label: 'Picked Up', filters: { status: 'picked_up' } },
  { key: 'completed', label: 'Completed', filters: { status: 'completed' } },
  { key: 'cancelled', label: 'Cancelled', filters: { deleted: true } },
  { key: 'reported', label: 'Reported', filters: { reported: true } },
];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * AdminDonations — "Donations" (Phase 3: Admin Users + Donation Management).
 *
 * Backed by the existing GET /admin/donations endpoint. Every tab except
 * "Reported" was already supported (status/deleted filters existed before
 * this phase); "Reported" uses the new `reported` boolean this phase added
 * to admin.validator.js/admin.model.js, backed by the existing `reports`
 * table via an EXISTS subquery — no duplicate report logic.
 */
export function AdminDonations() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all');
  const [donations, setDonations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const tab = TABS.find((t) => t.key === activeTab) || TABS[0];

    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await adminApi.listDonations({
        ...tab.filters,
        sortBy: 'created_at',
        sortOrder: 'desc',
        page,
        limit: PAGE_SIZE,
      });
      if (cancelled) return;
      if (result.success) {
        setDonations(result.data || []);
        setMeta(result.meta || null);
      } else {
        setError(result.error);
        setDonations([]);
      }
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [activeTab, page, refreshTrigger]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Donations</h1>
          <p className="text-text-secondary text-sm">Platform-wide donation oversight.</p>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-dash-primary text-white'
                  : 'bg-surface border border-border/50 text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {tab.key === 'reported' && <Flag size={11} className="inline mr-1 -mt-0.5" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="bg-surface rounded-lg border border-border/50 p-4">
            <SkeletonTable rows={8} columns={5} />
          </div>
        ) : error ? (
          <ErrorState title="Failed to load donations" message={error} onRetry={() => setRefreshTrigger((t) => t + 1)} />
        ) : donations.length === 0 ? (
          <EmptyState icon={Package} title="No donations found" description="Nothing matches this filter right now." showAction={false} />
        ) : (
          <>
            <div className="bg-surface rounded-lg border border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Donation</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Donor</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Volunteer</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Status</th>
                      <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((d) => {
                      const CategoryIcon = CATEGORY_ICON[d.category] || Package;
                      const displayStatus = d.is_deleted ? 'cancelled' : d.status;
                      return (
                        <tr
                          key={d.id}
                          onClick={() => navigate(`/admin/donations/${d.id}`)}
                          className="border-b border-border/50 last:border-0 hover:bg-surface-hover transition-colors cursor-pointer"
                        >
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-md bg-dash-primary-soft flex items-center justify-center shrink-0">
                                <CategoryIcon size={14} className="text-dash-primary" />
                              </div>
                              <p className="text-xs font-medium text-text-primary truncate max-w-[200px]">
                                {d.title || `${d.category} donation`}
                              </p>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-text-secondary truncate max-w-[140px]">{d.donor_name || '—'}</td>
                          <td className="py-2.5 px-4 text-xs text-text-secondary truncate max-w-[140px]">
                            {d.volunteer_name || <span className="italic">Not yet assigned</span>}
                          </td>
                          <td className="py-2.5 px-4">
                            <StatusBadge status={displayStatus} size="small" />
                          </td>
                          <td className="py-2.5 px-4 text-xs text-text-secondary whitespace-nowrap">{formatDate(d.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <AdminPagination page={page} totalPages={meta?.totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
