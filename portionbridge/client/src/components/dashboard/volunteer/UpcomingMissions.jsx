import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard } from '../skeletons';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { StatusBadge } from '../../donation/StatusBadge';
import { Utensils, Shirt, MapPin, CalendarClock, ArrowRight, Package, Clock } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const PREVIEW_LIMIT = 3;

const CATEGORY_ICON = {
  food: Utensils,
  clothes: Shirt,
};

export function UpcomingMissions() {
  const navigate = useNavigate();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE}/volunteer/upcoming?limit=${PREVIEW_LIMIT}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data?.success) {
          setMissions(response.data.data?.assignments || []);
        } else {
          throw new Error('Failed to fetch upcoming missions');
        }
      } catch (err) {
        console.error('Error fetching upcoming missions:', err);
        setError(err.message);
        setMissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcoming();
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
        <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Clock size={16} className="text-dash-primary" /> Scheduled Upcoming Missions
        </h2>
        <div className="space-y-3">
          <SkeletonCard count={PREVIEW_LIMIT} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-glass-card rounded-2xl p-5 border border-border/60 shadow-sm">
        <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Clock size={16} className="text-dash-primary" /> Scheduled Upcoming Missions
        </h2>
        <ErrorState
          title="Failed to load upcoming missions"
          message="Unable to fetch your upcoming missions. Please try again."
          onRetry={() => window.location.reload()}
          size="small"
        />
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="pb-glass-card rounded-2xl p-5 border border-border/60 shadow-sm">
        <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Clock size={16} className="text-dash-primary" /> Scheduled Upcoming Missions
        </h2>
        <EmptyState
          icon={CalendarClock}
          title="No upcoming scheduled missions"
          description="Missions you've scheduled a pickup for will appear here."
          showAction={false}
          size="small"
        />
      </div>
    );
  }

  return (
    <div className="pb-glass-card rounded-2xl p-5 border border-border/60 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
          <Clock size={16} className="text-dash-primary" /> Scheduled Upcoming ({missions.length})
        </h2>
        <button
          onClick={() => navigate('/volunteer/history')}
          className="text-xs text-dash-primary hover:text-dash-primary-hover font-semibold"
        >
          View All History &rarr;
        </button>
      </div>

      <div className="space-y-3">
        {missions.map((mission, index) => {
          const CategoryIcon = CATEGORY_ICON[mission.category] || Package;
          const scheduledLabel = formatDateTime(mission.scheduled_at);

          return (
            <div
              key={mission.id}
              onClick={() => navigate(`/donations/${mission.id}`)}
              style={{ animation: 'rowIn 0.25s ease backwards', animationDelay: `${index * 50}ms` }}
              className="pb-hover-lift flex items-center justify-between p-3.5 rounded-xl bg-surface/80 border border-border/80 hover:border-dash-primary/30 cursor-pointer transition-all duration-200"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-dash-primary/10 text-dash-primary flex items-center justify-center shrink-0 border border-dash-primary/20">
                  <CategoryIcon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-text-primary capitalize truncate">
                      {mission.category} donation {mission.quantity ? `· Qty: ${mission.quantity}` : ''}
                    </h3>
                    <StatusBadge status={mission.status} size="small" />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                    {mission.pickup_location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-rose-500 shrink-0" />
                        <span className="truncate max-w-[180px]">{mission.pickup_location}</span>
                      </span>
                    )}
                    {scheduledLabel && (
                      <span className="flex items-center gap-1 text-dash-primary font-medium">
                        <CalendarClock size={11} className="shrink-0" />
                        {scheduledLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-dash-primary-soft text-dash-primary flex items-center justify-center shrink-0 ml-2 group-hover:translate-x-1 transition-transform">
                <ArrowRight size={14} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
