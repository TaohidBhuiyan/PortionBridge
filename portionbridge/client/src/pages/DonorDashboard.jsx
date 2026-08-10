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
 * Donor Dashboard Home - production-ready overview page.
 */
export function DonorDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <WelcomeHeader user={user} />

        <StatisticsCards />

        <QuickActions />

        <ActiveDonations />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ImpactSummary />
          <RecentActivities />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-5">
          <LeaderboardWidget />
          <ProfileCompletion />
          <AchievementsPanel userId={user?.id} userRole="donor" />
          <NotificationPreview />
        </div>
      </div>
    </DashboardLayout>
  );
}
