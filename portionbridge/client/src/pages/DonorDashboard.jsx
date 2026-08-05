import { DashboardLayout } from '../components/dashboard';
import { useAuth } from '../context/AuthContext';
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
      <div className="space-y-6">
        {/* Section 1: Welcome Header */}
        <WelcomeHeader user={user} leaderboardRank={15} />

        {/* Section 2: Statistics Cards */}
        <StatisticsCards />

        {/* Section 3: Quick Actions */}
        <QuickActions />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width on large screens */}
          <div className="xl:col-span-2 space-y-6">
            {/* Section 4: Active Donations */}
            <ActiveDonations />

            {/* Section 5: Recent Activities */}
            <RecentActivities />

            {/* Section 9: Impact Summary */}
            <ImpactSummary />
          </div>

          {/* Right Column - 1/3 width on large screens */}
          <div className="space-y-6">
            {/* Section 6: Leaderboard Widget */}
            <LeaderboardWidget currentRank={15} currentPoints={1250} />

            {/* Section 7: Profile Completion */}
            <ProfileCompletion />

            {/* Achievements */}
            <AchievementsPanel userId={user?.id} userRole="donor" />

            {/* Section 9: Notification Preview */}
            <NotificationPreview />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
