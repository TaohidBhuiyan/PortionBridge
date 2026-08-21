import { useState, useEffect } from 'react';
import { DashboardLayout, ErrorState } from '../components/dashboard';
import { AdminAnalyticsSection, AreaIntelligenceSection } from '../components/dashboard/admin';
import { adminApi } from '../services/adminApi';

/**
 * AdminAnalytics — "Analytics" (Phase 9: Admin Analytics + Area
 * Intelligence).
 *
 * The "Analytics" half (donation trend, completion trend, category
 * distribution, volunteer activity, completion rate) is NOT rebuilt here
 * — it's the exact same AdminAnalyticsSection component and the same
 * GET /admin/dashboard `analytics` payload Phase 2 already built for the
 * Overview page's embedded preview. This page is the dedicated
 * destination the sidebar's "Analytics" item always pointed to (a Phase 1
 * placeholder until now), reusing that existing data/component rather
 * than standing up a second analytics pipeline.
 *
 * "Area Intelligence" is the genuinely new part this phase adds — see
 * AreaIntelligenceSection / GET /admin/area-intelligence.
 */
export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [areaData, setAreaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      const [dashboardResult, areaResult] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getAreaIntelligence(),
      ]);
      if (cancelled) return;

      if (dashboardResult.success) {
        setAnalytics(dashboardResult.data?.analytics || null);
      } else {
        setError(dashboardResult.error);
      }
      if (areaResult.success) {
        setAreaData(areaResult.data);
      } else if (dashboardResult.success) {
        setError(areaResult.error);
      }
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Analytics</h1>
          <p className="text-text-secondary text-sm">Platform trends and area-level operational intelligence.</p>
        </div>

        {error ? (
          <ErrorState title="Failed to load analytics" message={error} onRetry={() => setRefreshTrigger((t) => t + 1)} />
        ) : (
          <>
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-3">Platform Analytics</h2>
              <AdminAnalyticsSection analytics={analytics} loading={loading} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-3">Area Intelligence</h2>
              <AreaIntelligenceSection data={areaData} loading={loading} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
