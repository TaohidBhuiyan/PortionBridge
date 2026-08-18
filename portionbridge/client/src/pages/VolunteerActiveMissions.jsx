import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Utensils, Shirt, MapPin, CalendarClock, Package } from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { SkeletonCard } from '../components/dashboard/skeletons';
import { StatusBadge } from '../components/donation/StatusBadge';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const CATEGORY_ICON = {
  food: Utensils,
  clothes: Shirt,
};

function formatDateTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * VolunteerActiveMissions — "Active Missions" (Phase 1: Dashboard
 * Foundation). Lists every currently accepted/scheduled assignment via the
 * existing GET /volunteer/assignments endpoint (same source as the
 * dashboard's single-item ActiveMissionCard, just unfiltered/unlimited
 * here) — no new backend route, no fake data.
 */
export function VolunteerActiveMissions() {
  const navigate = useNavigate();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchMissions = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE}/volunteer/assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (response.data?.success) {
          setMissions(response.data.data?.assignments || []);
        } else {
          throw new Error('Failed to fetch active missions');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchMissions();
    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Active Missions</h1>
          <p className="text-text-secondary text-sm">
            All donations you've accepted that are awaiting pickup.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface rounded-lg border border-border/50 p-4">
                <SkeletonCard count={1} />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load active missions"
            message={error}
            onRetry={() => setRefreshTrigger((t) => t + 1)}
          />
        ) : missions.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No active missions"
            description="You don't have any accepted or scheduled pickups right now."
            actionLabel="Find Opportunities"
            onAction={() => navigate('/volunteer/opportunities')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missions.map((mission) => {
              const CategoryIcon = CATEGORY_ICON[mission.category] || Package;
              return (
                <button
                  key={mission.id}
                  onClick={() => navigate(`/donations/${mission.id}`)}
                  className="text-left bg-surface rounded-lg border border-border/50 p-4 hover:border-dash-primary/30 hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-dash-primary-soft flex items-center justify-center shrink-0">
                        <CategoryIcon size={16} className="text-dash-primary" />
                      </div>
                      <p className="text-sm font-medium text-text-primary truncate max-w-[180px]">
                        {mission.description || `${mission.category} donation`}
                      </p>
                    </div>
                    <StatusBadge status={mission.status} size="small" />
                  </div>
                  {mission.pickup_location && (
                    <p className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{mission.pickup_location}</span>
                    </p>
                  )}
                  {(mission.scheduled_at || mission.pickup_time) && (
                    <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <CalendarClock size={12} className="shrink-0" />
                      {formatDateTime(mission.scheduled_at || mission.pickup_time)}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
