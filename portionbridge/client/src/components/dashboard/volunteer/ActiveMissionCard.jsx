import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard } from '../skeletons';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { StatusBadge } from '../../donation/StatusBadge';
import { Utensils, Shirt, MapPin, Clock, CalendarClock, ArrowRight, Package } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const CATEGORY_ICON = {
  food: Utensils,
  clothes: Shirt,
};

/**
 * ActiveMissionCard — the volunteer's current active mission (accepted or
 * scheduled), sourced from the existing GET /volunteer/assignments
 * endpoint (Phase 0/1 audit: reuses volunteer.model.js's active-assignments
 * query, no new backend route). Called with limit=1 and no extra sort
 * params, so the backend's own default ordering (scheduled_at ASC, i.e.
 * the soonest/most pressing pickup) decides which single mission surfaces.
 *
 * Known scope limitation (documented, not silently patched): this
 * endpoint's status filter only ever returns 'accepted' or 'scheduled'
 * donations (see volunteer.validator.js ASSIGNMENT_STATUSES) — donations
 * the volunteer has already marked on_the_way or picked_up won't appear
 * here. There's currently no volunteer-scoped endpoint that returns those
 * statuses for an individually-accepted (non-team) donation. Widening
 * ASSIGNMENT_STATUSES is a small, defensible backend follow-up, but Phase
 * 2 is display-only and the brief calls for zero backend changes unless
 * unavoidable, so this is left as-is and called out in the phase report.
 *
 * PHASE 3 UPDATE: the empty state below now links to
 * /volunteer/opportunities (added in Phase 3), which didn't exist when
 * this component was first built — the rest of the component (data
 * fetching, loading/error states, mission card layout) is unchanged from
 * Phase 2.
 */
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
      <div className="bg-surface rounded-lg border border-border/50 p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Active Mission</h2>
        <SkeletonCard count={1} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-lg border border-border/50 p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-2">Active Mission</h2>
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
      <div className="bg-surface rounded-lg border border-border/50 p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-2">Active Mission</h2>
        <EmptyState
          icon={Package}
          title="No active mission"
          description="You don't have an active mission right now. New assignments will appear here once you accept a donation."
          actionLabel="Find Opportunities"
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
    <div className="bg-surface rounded-lg border border-border/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-primary">Active Mission</h2>
        <button
          onClick={() => navigate(`/donations/${mission.id}`)}
          className="text-[11px] text-dash-primary hover:text-dash-primary-hover font-medium focus:outline-none focus-visible:underline"
        >
          View Details
        </button>
      </div>

      <div
        onClick={() => navigate(`/donations/${mission.id}`)}
        className="flex items-start gap-3 p-2.5 rounded-md border border-border/50 hover:border-dash-primary/30 hover:bg-surface-hover hover:shadow-pb-card cursor-pointer transition-[border-color,background-color,box-shadow,transform] duration-150 hover:-translate-y-0.5"
      >
        <div className="w-9 h-9 rounded-md bg-dash-primary-soft flex items-center justify-center shrink-0">
          <CategoryIcon size={16} className="text-dash-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-sm font-medium text-text-primary capitalize">
              {mission.category} donation{mission.quantity ? ` · Qty ${mission.quantity}` : ''}
            </h3>
            <StatusBadge status={mission.status} size="small" />
          </div>

          {mission.description && (
            <p className="text-xs text-text-secondary mb-2 line-clamp-2">{mission.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-text-secondary">
            {mission.pickup_location && (
              <span className="flex items-center gap-1">
                <MapPin size={10} />
                {mission.pickup_location}
              </span>
            )}
            {pickupTimeLabel && (
              <span className="flex items-center gap-1">
                <Clock size={10} />
                Pickup {pickupTimeLabel}
              </span>
            )}
            {scheduledLabel && (
              <span className="flex items-center gap-1">
                <CalendarClock size={10} />
                Scheduled {scheduledLabel}
              </span>
            )}
          </div>
        </div>

        <ArrowRight size={14} className="text-dash-primary shrink-0 mt-1" />
      </div>
    </div>
  );
}
