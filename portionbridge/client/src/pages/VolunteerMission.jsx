import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard';
import { ActiveMissionCard } from '../components/dashboard/volunteer';
import { MissionMap } from '../components/dashboard/volunteer/MissionMap';
import { volunteerApi } from '../services/volunteerApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const TRACKABLE_STATUSES = new Set(['accepted', 'scheduled', 'on_the_way', 'picked_up']);

/**
 * VolunteerMission — "My Mission" (Phase 1 foundation, Phase 5 adds the
 * live mission map).
 *
 * Reuses ActiveMissionCard as-is for the summary card at the top. Below
 * it, when there's an active assignment, fetches the richer mission
 * detail (donor contact, pickup coordinates, team info) via
 * volunteerApi.getAssignmentDetail — the same GET
 * /volunteer/assignments/:id endpoint that existed but had no frontend
 * caller before this phase — and renders MissionMap.
 */
export function VolunteerMission() {
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadActiveMission = async () => {
      setLoading(true);
      try {
        // Same lightweight "give me my one active mission" call
        // ActiveMissionCard already makes — reused here just to learn the
        // donation ID, then the richer detail call below fills in the rest.
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE}/volunteer/assignments?limit=1`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await response.json();
        const assignment = json?.data?.assignments?.[0];

        if (!assignment || cancelled) {
          if (!cancelled) setMission(null);
          return;
        }

        const detailResult = await volunteerApi.getAssignmentDetail(assignment.id);
        if (!cancelled && detailResult.success) {
          setMission(detailResult.data);
        }
      } catch {
        if (!cancelled) setMission(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadActiveMission();
    return () => { cancelled = true; };
  }, []);

  const handleStatusChange = (newStatus) => {
    setMission((prev) => (prev ? { ...prev, status: newStatus } : prev));
  };

  const showMap = !loading && mission && TRACKABLE_STATUSES.has(mission.status);

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

        {showMap && (
          <div className="max-w-3xl">
            <h2 className="text-lg font-semibold text-text-primary mb-3">Mission Map</h2>
            <MissionMap mission={mission} onStatusChange={handleStatusChange} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
