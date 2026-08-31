import { useState, useEffect } from 'react';
import { DashboardLayout, ProfileCard } from '../components/dashboard';
import { useAuth } from '../context/AuthContext';
import {
  AdminStatsCards,
  AdminImpactSection,
  AdminAnalyticsSection,
  AdminRecentDonations,
  AdminRecentUsers,
  AdminRecentActivity,
} from '../components/dashboard/admin';
import { ErrorState } from '../components/dashboard';
import { adminApi } from '../services/adminApi';

/**
 * Admin Dashboard — Overview / Command Center (Phase 2).
 *
 * Everything here comes from the single enriched GET /admin/dashboard
 * payload (adminApi.getDashboard / admin.service.js#getDashboard) — no
 * fake/hardcoded numbers anywhere on this page. Other sidebar sections
 * (Users, Donations, Volunteers & Teams, Analytics [drill-down], Reports,
 * Audit Logs, Live Operations, Attention Center, Settings) remain
 * later-phase features; see AdminSectionPage for their routing
 * foundation from Phase 1.
 */
export function AdminDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Matches the refreshTrigger convention used elsewhere (VolunteerHistory,
  // VolunteerTeam, VolunteerOpportunities) so onRetry re-fetches without
  // calling setState synchronously from inside the effect body.
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      const result = await adminApi.getDashboard();
      if (cancelled) return;
      if (result.success) {
        setDashboard(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };

    fetchDashboard();
    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Admin Overview</h1>
          <p className="text-text-secondary text-sm">
            Platform-wide activity across donors, volunteers, and donations.
          </p>
        </div>

        {error ? (
          <ErrorState
            title="Failed to load dashboard"
            message={error}
            onRetry={() => setRefreshTrigger((t) => t + 1)}
          />
        ) : (
          <>
            {/* Hero row — admin identity + dense platform pulse, deliberately
                less "big card" than Donor/Volunteer's hero: the profile card
                sits beside the compact KPI strip rather than a large item
                panel, keeping Admin's denser, control-center personality. */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              <div className="lg:col-span-1">
                <ProfileCard
                  user={user}
                  roleLabel="Administrator"
                  tone="admin"
                  stats={[
                    { label: 'Total Users', value: dashboard?.totalUsers ?? '—' },
                    { label: 'Donations', value: dashboard?.totalDonationRequests ?? '—' },
                    { label: 'Active', value: dashboard?.activeDonations ?? '—' },
                  ]}
                />
              </div>
              <div className="lg:col-span-2 flex flex-col justify-center">
                <AdminStatsCards dashboard={dashboard} loading={loading} />
              </div>
            </div>

            <AdminImpactSection impact={dashboard?.impact} loading={loading} />

            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-3">Analytics</h2>
              <AdminAnalyticsSection analytics={dashboard?.analytics} loading={loading} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-3">Recent Activity</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                  <AdminRecentDonations donations={dashboard?.recentDonations} loading={loading} />
                  <AdminRecentUsers users={dashboard?.recentUsers} loading={loading} />
                </div>
                <AdminRecentActivity activity={dashboard?.recentActivity} loading={loading} />
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
