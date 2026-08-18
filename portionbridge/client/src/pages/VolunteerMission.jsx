import { DashboardLayout } from '../components/dashboard';
import { ActiveMissionCard } from '../components/dashboard/volunteer';

/**
 * VolunteerMission — "My Mission" (Phase 1: Dashboard Foundation).
 *
 * Reuses the existing ActiveMissionCard widget (same GET
 * /volunteer/assignments?limit=1 data as the dashboard's Active Mission
 * section) rather than duplicating its fetch/loading/error/empty logic.
 * This page exists as a dedicated destination for the sidebar's "My
 * Mission" item; richer mission detail beyond what the card already
 * shows is later-phase work.
 */
export function VolunteerMission() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">My Mission</h1>
          <p className="text-text-secondary text-sm">
            Your current active pickup, if you have one.
          </p>
        </div>

        <div className="max-w-2xl">
          <ActiveMissionCard />
        </div>
      </div>
    </DashboardLayout>
  );
}
