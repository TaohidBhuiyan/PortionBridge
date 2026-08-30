import { DashboardLayout } from '../components/dashboard';
import { useAuth } from '../context/AuthContext';
import { PageTransition } from '../components/common';
import {
  WelcomeHeader,
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

/**
 * Donor Dashboard Home - Production-ready overview page
 * Integrates all dashboard widgets and components
 */
export function DonorDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="space-y-6">
        {/* Welcome Header */}
        <WelcomeHeader user={user} />

        {/* Statistics Cards */}
        <StatisticsCards />

        {/* Quick Actions */}
        <QuickActions />

        {/* Active Donations — highest-priority section, full width */}
        <ActiveDonations />

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
      </PageTransition>
    </DashboardLayout>
  );
}
