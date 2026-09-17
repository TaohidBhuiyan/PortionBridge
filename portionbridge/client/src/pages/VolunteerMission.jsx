import { useState, useEffect } from 'react';
import { Compass, MapPin } from 'lucide-react';
import { DashboardLayout } from '../components/dashboard';
import { ActiveMissionCard } from '../components/dashboard/volunteer';
import { MissionMap } from '../components/dashboard/volunteer/MissionMap';
import { volunteerApi } from '../services/volunteerApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const TRACKABLE_STATUSES = new Set(['accepted', 'scheduled', 'on_the_way', 'picked_up']);

export function VolunteerMission() {
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadActiveMission = async () => {
      setLoading(true);
      try {
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero Header */}
        <div className="pb-volunteer-hero rounded-2xl p-6 sm:p-7 relative overflow-hidden flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dash-primary via-indigo-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Compass size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                Current Active Mission
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                Track pickup details, update status steps, and view route map.
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1">
            <ActiveMissionCard />
          </div>

          <div className="lg:col-span-2">
            {showMap ? (
              <div className="pb-glass-card rounded-2xl p-5 border border-border/60 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={18} className="text-emerald-500" />
                  <h2 className="text-base font-bold text-text-primary">Live Navigation & Route Map</h2>
                </div>
                <MissionMap mission={mission} onStatusChange={handleStatusChange} />
              </div>
            ) : (
              <div className="pb-glass-card rounded-2xl p-8 border border-border/60 text-center text-text-muted">
                <Compass size={32} className="mx-auto mb-2 opacity-40 text-dash-primary" />
                <p className="text-sm font-semibold text-text-primary">No Active Navigation Route</p>
                <p className="text-xs text-text-secondary mt-1">
                  Once you accept an active donation mission, your interactive route map and step controls will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
