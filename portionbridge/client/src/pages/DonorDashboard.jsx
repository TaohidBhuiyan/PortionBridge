import { useState, useEffect } from 'react';
import { DashboardLayout, ProfileCard } from '../components/dashboard';
import { useAuth } from '../context/AuthContext';
import {
  StatisticsCards,
  QuickActions,
  ActiveDonations,
  RecentActivities,
  LeaderboardWidget,
  ProfileCompletion,
  ImpactSummary,
  NotificationPreview,
} from '../components/dashboard/donor';
import { AchievementsPanel } from '../components/common/AchievementsPanel';
import { donationApi } from '../services/donationApi';

/**
 * Donor Dashboard Home — Production-ready overview page.
 *
 * PHASE — Global Dashboard Redesign: replaces the old thin "greeting bar"
 * header with a prominent ProfileCard (real user + real summary counts
 * from the existing /donations/my-history/summary endpoint — the same
 * one MyDonationsPage already uses), paired with the Active Donations
 * panel in an asymmetric hero row so the dashboard opens with "who I am"
 * + "what's happening right now" rather than a flat KPI grid.
 */
export function DonorDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    donationApi.getDonorHistorySummary().then((result) => {
      if (!cancelled && result.success) setSummary(result.data);
    });
    return () => { cancelled = true; };
  }, []);

  const stats = summary
    ? [
        { label: 'Total Donations', value: summary.totalDonations || 0 },
        { label: 'Completed', value: summary.completed || 0 },
        { label: 'Pending', value: summary.pending || 0 },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero row — identity + what's happening right now */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-1">
            <ProfileCard user={user} roleLabel="Donor" tone="donor" stats={stats} />
          </div>
          <div className="lg:col-span-2">
            <ActiveDonations />
          </div>
        </div>

        {/* Statistics Cards */}
        <StatisticsCards />

        {/* Quick Actions */}
        <QuickActions />

        {/* Impact + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ImpactSummary />
          <RecentActivities />
        </div>

        {/* Leaderboard + Profile Completion + Achievements + Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          <LeaderboardWidget />
          <ProfileCompletion />
          <AchievementsPanel userId={user?.id} userRole="donor" />
          <NotificationPreview />
        </div>
      </div>
    </DashboardLayout>
  );
}
