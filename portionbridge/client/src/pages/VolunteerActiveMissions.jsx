import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Utensils, Shirt, MapPin, CalendarClock, Package, Navigation, ArrowRight, Truck } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero Header */}
        <div className="pb-volunteer-hero rounded-2xl p-6 sm:p-7 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Truck size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                Active Missions ({missions.length})
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                All donations you've accepted that are currently in progress or awaiting pickup.
              </p>
            </div>
          </div>

          {missions.length > 0 && (
            <button
              onClick={() => navigate('/volunteer/live-map')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 hover:bg-emerald-500/20 shadow-sm transition-all text-xs"
            >
              <Navigation size={15} /> Launch Live Map Tracking
            </button>
          )}
        </div>

        {/* Missions Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="pb-glass-card rounded-2xl p-5 border border-border/60 shadow-sm">
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
            title="No active missions right now"
            description="You don't have any accepted or scheduled pickups right now."
            actionLabel="Explore Opportunities"
            onAction={() => navigate('/volunteer/opportunities')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {missions.map((mission, index) => {
              const CategoryIcon = CATEGORY_ICON[mission.category] || Package;
              return (
                <div
                  key={mission.id}
                  onClick={() => navigate(`/donations/${mission.id}`)}
                  style={{ animation: 'rowIn 0.25s ease backwards', animationDelay: `${index * 50}ms` }}
                  className="pb-glass-card pb-hover-lift rounded-2xl p-5 border border-border/70 hover:border-dash-primary/40 shadow-sm cursor-pointer transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dash-primary/10 to-indigo-500/10 text-dash-primary flex items-center justify-center shrink-0 border border-dash-primary/20">
                          <CategoryIcon size={18} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-text-primary capitalize truncate max-w-[200px] sm:max-w-[240px]">
                            {mission.category} donation {mission.quantity ? `· Qty ${mission.quantity}` : ''}
                          </h3>
                          <p className="text-xs text-text-muted truncate max-w-[200px]">
                            {mission.description || 'Rescue mission'}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={mission.status} size="small" />
                    </div>

                    <div className="space-y-2 py-2">
                      {mission.pickup_location && (
                        <div className="flex items-center gap-2 text-xs text-text-secondary bg-surface/80 p-2.5 rounded-xl border border-border/60">
                          <MapPin size={14} className="text-rose-500 shrink-0" />
                          <span className="truncate">{mission.pickup_location}</span>
                        </div>
                      )}
                      {(mission.scheduled_at || mission.pickup_time) && (
                        <div className="flex items-center gap-2 text-xs text-text-secondary bg-surface/80 p-2.5 rounded-xl border border-border/60">
                          <CalendarClock size={14} className="text-dash-primary shrink-0" />
                          <span>Pickup: {formatDateTime(mission.scheduled_at || mission.pickup_time)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs font-bold text-dash-primary">
                    <span>View Full Details & Steps</span>
                    <div className="w-7 h-7 rounded-full bg-dash-primary-soft flex items-center justify-center group-hover:translate-x-1 transition-transform">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
