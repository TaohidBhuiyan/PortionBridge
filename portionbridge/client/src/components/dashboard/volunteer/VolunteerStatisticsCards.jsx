import { useState, useEffect, useRef } from 'react';
import { SkeletonCard } from '../skeletons';
import { ErrorState } from '../ErrorState';
import { CheckCircle2, Truck, Users } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * AnimatedCounter — identical count-up behavior to the one in
 * donor/StatisticsCards.jsx. Duplicated rather than extracted into a
 * shared util, matching this project's existing per-widget component
 * style (donor widgets each own their small helpers rather than sharing
 * a common lib).
 */
function AnimatedCounter({ value, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const animationRef = useRef(null);

  useEffect(() => {
    const startTimestamp = Date.now();
    const endValue = parseInt(value) || 0;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTimestamp) / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * endValue);

      setCount(currentCount);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
}

const TONE_CLASSES = {
  primary: 'bg-dash-primary-soft text-dash-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
};

const HOVER_BORDER_CLASSES = {
  primary: 'hover:border-dash-primary/30',
  success: 'hover:border-success/30',
  warning: 'hover:border-warning/30',
  danger: 'hover:border-danger/30',
  info: 'hover:border-info/30',
};

function StatCard({ icon: Icon, label, value, suffix = '', tone = 'primary', loading, error }) {
  if (loading) {
    return (
      <div className="bg-surface rounded-lg border border-border/50 p-3">
        <SkeletonCard count={1} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-lg border border-border/50 p-3">
        <div className="text-center text-text-secondary">
          <Icon size={18} className="mx-auto mb-1.5 opacity-50" />
          <p className="text-[11px]">Unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-surface rounded-lg border border-border/50 p-3 ${HOVER_BORDER_CLASSES[tone] || HOVER_BORDER_CLASSES.primary} hover:shadow-md hover:scale-[1.01] transition-all duration-200 ease-out cursor-default`}>
      <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-2 ${TONE_CLASSES[tone]}`}>
        <Icon size={16} />
      </div>
      <p className="text-xl font-semibold text-text-primary mb-0.5 tracking-tight">
        <AnimatedCounter value={value} />{suffix}
      </p>
      <p className="text-[11px] font-medium text-text-secondary">{label}</p>
    </div>
  );
}

/**
 * Rating card — kept separate from StatCard because a decimal average
 * (e.g. 4.87) doesn't make sense running through the integer count-up
 * animation, and "no ratings yet" needs its own real (not zero-as-fake)
 * empty phrasing.
 */
function RatingCard({ averageRating, totalRatings, loading, error }) {
  if (loading) {
    return (
      <div className="bg-surface rounded-lg border border-border/50 p-3">
        <SkeletonCard count={1} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-lg border border-border/50 p-3">
        <div className="text-center text-text-secondary">
          <span className="text-lg mx-auto mb-1.5 block opacity-50">⭐</span>
          <p className="text-[11px]">Unavailable</p>
        </div>
      </div>
    );
  }

  const hasRatings = totalRatings > 0;

  return (
    <div className="bg-surface rounded-lg border border-border/50 p-3 hover:border-warning/30 hover:shadow-md hover:scale-[1.01] transition-all duration-200 ease-out cursor-default">
      <div className="w-8 h-8 rounded-md flex items-center justify-center mb-2 bg-warning-soft text-warning">
        <span className="text-sm leading-none">⭐</span>
      </div>
      {hasRatings ? (
        <>
          <p className="text-xl font-semibold text-text-primary mb-0.5 tracking-tight">
            {averageRating.toFixed(1)} ⭐
          </p>
          <p className="text-[11px] font-medium text-text-secondary">
            Rating · {totalRatings} review{totalRatings === 1 ? '' : 's'}
          </p>
        </>
      ) : (
        <>
          <p className="text-xl font-semibold text-text-primary mb-0.5 tracking-tight">—</p>
          <p className="text-[11px] font-medium text-text-secondary">No ratings yet</p>
        </>
      )}
    </div>
  );
}

/**
 * VolunteerStatisticsCards — volunteer-side equivalent of
 * donor/StatisticsCards.jsx. Pulls from GET /profile/volunteer/statistics
 * (Phase 1: rating calculation fixed to use ratings.stars, peopleHelped
 * added). Deliberately does NOT show volunteer hours — Phase 1 confirmed
 * that metric isn't stored/derivable yet, so it's left out rather than
 * faked, per the Phase 2 brief.
 */
export function VolunteerStatisticsCards() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE}/profile/volunteer/statistics`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data?.success) {
          setStats(response.data.data.statistics);
        } else {
          throw new Error('Failed to fetch volunteer statistics');
        }
      } catch (err) {
        console.error('Error fetching volunteer statistics:', err);
        setError(err.message);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <SkeletonCard count={4} />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="mb-5">
        <ErrorState
          title="Failed to load statistics"
          message="Unable to fetch your volunteer statistics. Please try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      <StatCard
        icon={CheckCircle2}
        label="Missions Completed"
        value={stats?.completedPickups || 0}
        tone="success"
        loading={loading}
        error={error}
      />
      <StatCard
        icon={Truck}
        label="Active Pickups"
        value={stats?.acceptedDonations || 0}
        tone="info"
        loading={loading}
        error={error}
      />
      <StatCard
        icon={Users}
        label="People Helped"
        value={stats?.peopleHelped || 0}
        tone="primary"
        loading={loading}
        error={error}
      />
      <RatingCard
        averageRating={stats?.averageRating || 0}
        totalRatings={stats?.totalRatings || 0}
        loading={loading}
        error={error}
      />
    </div>
  );
}
