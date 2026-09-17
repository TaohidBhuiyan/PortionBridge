import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard } from '../skeletons';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { StatusBadge } from '../../donation/StatusBadge';
import { Utensils, Shirt, MapPin, Clock, CalendarClock, ArrowRight, Package, Navigation, Compass } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const CATEGORY_ICON = {
  food: Utensils,
  clothes: Shirt,
};

export function ActiveMissionCard() {
  const navigate = useNavigate();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActiveMission = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE}/volunteer/assignments?limit=1`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data?.success) {
          const assignments = response.data.data?.assignments || [];
          setMission(assignments[0] || null);
        } else {
          throw new Error('Failed to fetch active mission');
        }
      } catch (err) {
        console.error('Error fetching active mission:', err);
        setError(err.message);
        setMission(null);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveMission();
  }, []);

  const formatDateTime = (value) => {
    if (!value) return null;
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="pb-glass-card rounded-2xl p-5 border border-border/60 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Compass size={16} className="text-dash-primary" /> Active Mission
          </h2>
        </div>
        <SkeletonCard count={1} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-glass-card rounded-2xl p-5 border border-border/60 shadow-sm">
        <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Compass size={16} className="text-dash-primary" /> Active Mission
        </h2>
        <ErrorState
          title="Failed to load active mission"
          message="Unable to fetch your current mission. Please try again."
          onRetry={() => window.location.reload()}
          size="small"
        />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="pb-glass-card rounded-2xl p-5 border border-border/60 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Compass size={16} className="text-dash-primary" /> Active Mission
          </h2>
        </div>
        <EmptyState
          icon={Package}
          title="No active mission assigned"
          description="You don't have an active mission right now. New assignments will appear here once you claim a donation."
          actionLabel="Explore Opportunities"
          onAction={() => navigate('/volunteer/opportunities')}
          size="small"
        />
      </div>
    );
  }

  const CategoryIcon = CATEGORY_ICON[mission.category] || Package;
  const scheduledLabel = formatDateTime(mission.scheduled_at);
  const pickupTimeLabel = formatDateTime(mission.pickup_time);

  return (
    <div className="pb-glass-card rounded-2xl p-5 border border-dash-primary/30 shadow-md relative overflow-hidden group">
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-dash-primary/10 via-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />

      {/* Header with Radar indicator */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-75"></span>
          </div>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            Live Active Mission
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/volunteer/live-map')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
          >
            <Navigation size={12} /> Live Map
          </button>
          <button
            onClick={() => navigate(`/donations/${mission.id}`)}
            className="text-xs text-dash-primary hover:text-dash-primary-hover font-semibold underline-offset-2 hover:underline"
          >
            Details &rarr;
          </button>
        </div>
      </div>

      {/* Mission Body Card */}
      <div
        onClick={() => navigate(`/donations/${mission.id}`)}
        className="relative z-10 p-4 rounded-xl bg-surface/80 border border-border/80 hover:border-dash-primary/40 hover:shadow-pb-card cursor-pointer transition-all duration-200"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-dash-primary to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <CategoryIcon size={20} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5 flex-wrap">
              <h3 className="text-base font-bold text-text-primary capitalize truncate">
                {mission.category} donation {mission.quantity ? `· Qty: ${mission.quantity}` : ''}
              </h3>
              <StatusBadge status={mission.status} size="small" />
            </div>

            {mission.description && (
              <p className="text-xs text-text-secondary mb-3 line-clamp-2">
                {mission.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-secondary">
              {mission.pickup_location && (
                <span className="flex items-center gap-1.5 bg-page px-2.5 py-1 rounded-md border border-border/60">
                  <MapPin size={13} className="text-rose-500 shrink-0" />
                  <span className="truncate max-w-[200px]">{mission.pickup_location}</span>
                </span>
              )}
              {pickupTimeLabel && (
                <span className="flex items-center gap-1.5 bg-page px-2.5 py-1 rounded-md border border-border/60">
                  <Clock size={13} className="text-dash-primary shrink-0" />
                  <span>Pickup: {pickupTimeLabel}</span>
                </span>
              )}
              {scheduledLabel && (
                <span className="flex items-center gap-1.5 bg-page px-2.5 py-1 rounded-md border border-border/60">
                  <CalendarClock size={13} className="text-amber-500 shrink-0" />
                  <span>Scheduled: {scheduledLabel}</span>
                </span>
              )}
            </div>
          </div>

          <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-dash-primary-soft text-dash-primary shrink-0 self-center group-hover:translate-x-1 transition-transform">
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
