import { useState, useEffect } from 'react';
import { DashboardLayout, ProfileCard } from '../components/dashboard';
import { useAuth } from '../context/AuthContext';
import {
  VolunteerStatisticsCards,
  ActiveMissionCard,
  UpcomingMissions,
  VolunteerQuickLinks,
  BaseLocationCard,
} from '../components/dashboard/volunteer';
import { donationApi } from '../services/donationApi';
import { profileApi } from '../services/profileApi';

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
  const [volunteerProfile, setVolunteerProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    donationApi.getVolunteerHistorySummary().then((result) => {
      if (!cancelled && result.success) setSummary(result.data);
    });
    profileApi.getProfile().then((result) => {
      if (!cancelled && result?.data?.volunteerProfile) {
        setVolunteerProfile(result.data.volunteerProfile);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleSaveLocation = async (data) => {
    try {
      const result = await profileApi.updateVolunteerLocation(data);
      if (result?.data?.volunteerProfile) {
        setVolunteerProfile(result.data.volunteerProfile);
        return { success: true };
      }
      return { success: false, error: result?.message || 'Failed to save location.' };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to save location.' };
    }
  };

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

        {/* Base location — self-service address (falls back for
            VolunteerOpportunities.jsx when live GPS isn't granted, and
            makes this volunteer findable in donor-side "Discover
            Volunteers"). */}
        <BaseLocationCard
          savedLocation={volunteerProfile ? { baseAddress: volunteerProfile.base_address, coverageRadius: volunteerProfile.coverage_radius } : null}
          onSave={handleSaveLocation}
          title="My Base Location"
        />

        {/* Upcoming Missions */}
        <UpcomingMissions />

        {/* PHASE 5: lightweight links to Team / History / Notifications */}
        <VolunteerQuickLinks />
      </div>
    </DashboardLayout>
  );
}
