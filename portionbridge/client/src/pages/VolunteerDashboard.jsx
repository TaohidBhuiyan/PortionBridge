import { DashboardLayout } from '../components/dashboard';
import { useAuth } from '../context/AuthContext';
import {
  VolunteerWelcomeHeader,
  VolunteerStatisticsCards,
  ActiveMissionCard,
  UpcomingMissions,
  VolunteerQuickLinks,
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
 * Phase 2: Overview, Statistics, Active Mission, Upcoming Missions.
 * Phase 5 adds a lightweight, static quick-links row (Team/History/
 * Notifications) at the bottom — additive only, none of the Phase 2/3
 * sections above were changed.
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

        {/* PHASE 5: lightweight links to Team / History / Notifications */}
        <VolunteerQuickLinks />
      </div>
    </DashboardLayout>
  );
}
