import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard } from '../skeletons';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { StatusBadge } from '../../donation/StatusBadge';
import { Utensils, Shirt, MapPin, CalendarClock, ArrowRight, Package } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const PREVIEW_LIMIT = 3;

const CATEGORY_ICON = {
  food: Utensils,
  clothes: Shirt,
};

/**
 * UpcomingMissions — dashboard preview of the volunteer's scheduled,
 * future pickups. Sourced from the existing GET /volunteer/upcoming
 * endpoint (volunteer.model.js#findUpcoming), which already restricts to
 * status = 'scheduled' with a future scheduled_at — no new backend logic.
 * Capped to a 3-item preview per the Phase 2 brief; a "View All" link is
 * intentionally omitted since Mission History UI (where that would point)
 * is a separate, later phase.
 */
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
      <div className="bg-surface rounded-lg border border-border/50 p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Upcoming Missions</h2>
        <div className="space-y-2">
          <SkeletonCard count={PREVIEW_LIMIT} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-lg border border-border/50 p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-2">Upcoming Missions</h2>
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
      <div className="bg-surface rounded-lg border border-border/50 p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-2">Upcoming Missions</h2>
        <EmptyState
          icon={CalendarClock}
          title="No upcoming missions"
          description="Missions you've scheduled a pickup for will appear here."
          showAction={false}
          size="small"
        />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border/50 p-4">
      <h2 className="text-sm font-semibold text-text-primary mb-3">Upcoming Missions</h2>

      <div className="space-y-2">
        {missions.map((mission, index) => {
          const CategoryIcon = CATEGORY_ICON[mission.category] || Package;
          const scheduledLabel = formatDateTime(mission.scheduled_at);

          return (
            <div
              key={mission.id}
              onClick={() => navigate(`/donations/${mission.id}`)}
              style={{ animation: 'rowIn 0.25s ease backwards', animationDelay: `${index * 40}ms` }}
              className="flex items-start gap-3 p-2.5 rounded-md border border-border/50 hover:border-dash-primary/30 hover:bg-surface-hover hover:shadow-pb-card cursor-pointer transition-[border-color,background-color,box-shadow,transform] duration-150 hover:-translate-y-0.5"
            >
              <div className="w-8 h-8 rounded-md bg-dash-primary-soft flex items-center justify-center shrink-0">
                <CategoryIcon size={14} className="text-dash-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-xs font-medium text-text-primary capitalize truncate">
                    {mission.category} donation{mission.quantity ? ` · Qty ${mission.quantity}` : ''}
                  </h3>
                  <StatusBadge status={mission.status} size="small" />
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-text-secondary">
                  {mission.pickup_location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={10} />
                      {mission.pickup_location}
                    </span>
                  )}
                  {scheduledLabel && (
                    <span className="flex items-center gap-1">
                      <CalendarClock size={10} />
                      {scheduledLabel}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/donations/${mission.id}`); }}
                aria-label="View mission details"
                className="p-1 rounded-md hover:bg-dash-primary-soft text-dash-primary transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary/50"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
