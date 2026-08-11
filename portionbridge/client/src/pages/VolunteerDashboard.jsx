import { DashboardLayout } from '../components/dashboard';
import { useAuth } from '../context/AuthContext';
import {
  VolunteerWelcomeHeader,
  VolunteerStatisticsCards,
  ActiveMissionCard,
  UpcomingMissions,
} from '../components/dashboard/volunteer';

/**
 * Volunteer Dashboard Home — production-ready overview page.
 *
 * Mirrors the structure of DonorDashboard.jsx (components/dashboard/donor):
 * a welcome header, a statistics row, then content widgets — each widget
 * fetches its own real data from the existing backend and manages its own
 * loading/error/empty state, so one failing widget never takes down the
 * rest of the page.
 *
 * Phase 2 scope only: Overview, Statistics, Active Mission, Upcoming
 * Missions. Nearby Opportunities, mission actions, Team, Announcements,
 * Mission History, and Messages are later phases and are intentionally
 * not present here yet.
 */
export function VolunteerDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <VolunteerWelcomeHeader user={user} />

        {/* Statistics Cards */}
        <VolunteerStatisticsCards />

        {/* Active Mission — highest-priority section, full width */}
        <ActiveMissionCard />

        {/* Upcoming Missions */}
        <UpcomingMissions />
      </div>
    </DashboardLayout>
  );
}
