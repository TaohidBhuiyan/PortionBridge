import { useState, useEffect } from 'react';
import { DashboardLayout, ProfileCard } from '../components/dashboard';
import { useAuth } from '../context/AuthContext';
import {
  VolunteerStatisticsCards,
  ActiveMissionCard,
  UpcomingMissions,
  VolunteerQuickLinks,
} from '../components/dashboard/volunteer';
import { donationApi } from '../services/donationApi';

/**
 * Volunteer Dashboard Home — production-ready overview page.
 *
 * PHASE — Global Dashboard Redesign: replaces the old thin greeting-bar
 * header with a prominent ProfileCard (real user + real mission counts
 * from the existing /donations/my-history/summary — volunteer variant —
 * already used by VolunteerHistory), paired with the Active Mission
 * panel in an asymmetric hero row: "who I am" + "what I'm doing right
 * now", matching the same hero pattern as the Donor dashboard while
 * keeping Volunteer's more operational tone (see ProfileCard's
 * tone="volunteer").
 */
export function VolunteerDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    donationApi.getVolunteerHistorySummary().then((result) => {
      if (!cancelled && result.success) setSummary(result.data);
    });
    return () => { cancelled = true; };
  }, []);

  const stats = summary
    ? [
        { label: 'Total Missions', value: summary.totalDonations || 0 },
        { label: 'Completed', value: summary.completed || 0 },
        { label: 'Active', value: (summary.accepted || 0) + (summary.scheduled || 0) },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero row — identity + what's happening right now */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-1">
            <ProfileCard user={user} roleLabel="Volunteer" tone="volunteer" stats={stats} />
          </div>
          <div className="lg:col-span-2">
            <ActiveMissionCard />
          </div>
        </div>

        {/* Statistics Cards */}
        <VolunteerStatisticsCards />

        {/* Upcoming Missions */}
        <UpcomingMissions />

        {/* PHASE 5: lightweight links to Team / History / Notifications */}
        <VolunteerQuickLinks />
      </div>
    </DashboardLayout>
  );
}
