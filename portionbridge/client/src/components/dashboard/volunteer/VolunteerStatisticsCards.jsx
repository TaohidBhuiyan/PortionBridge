import { useState, useEffect, useRef } from 'react';
import { SkeletonCard } from '../skeletons';
import { ErrorState } from '../ErrorState';
import { CheckCircle2, Truck, Users, Star, ArrowUpRight } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

function AnimatedCounter({ value, duration = 1800 }) {
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

const CARD_STYLES = {
  success: {
    badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    iconGradient: 'from-emerald-500 to-teal-600',
    borderGlow: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10',
    accentText: 'text-emerald-600 dark:text-emerald-400',
  },
  info: {
    badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    iconGradient: 'from-blue-500 to-indigo-600',
    borderGlow: 'hover:border-blue-500/40 hover:shadow-blue-500/10',
    accentText: 'text-blue-600 dark:text-blue-400',
  },
  primary: {
    badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    iconGradient: 'from-purple-500 to-pink-600',
    borderGlow: 'hover:border-purple-500/40 hover:shadow-purple-500/10',
    accentText: 'text-purple-600 dark:text-purple-400',
  },
  warning: {
    badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    iconGradient: 'from-amber-500 to-orange-600',
    borderGlow: 'hover:border-amber-500/40 hover:shadow-amber-500/10',
    accentText: 'text-amber-600 dark:text-amber-400',
  },
};

function StatCard({ icon: Icon, label, value, suffix = '', tone = 'primary', loading, error, subtitle }) {
  const style = CARD_STYLES[tone] || CARD_STYLES.primary;

  if (loading) {
    return (
      <div className="pb-glass-card rounded-2xl p-4 border border-border/60 shadow-sm">
        <SkeletonCard count={1} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-glass-card rounded-2xl p-4 border border-border/60 shadow-sm text-center text-text-muted">
        <Icon size={20} className="mx-auto mb-1.5 opacity-40" />
        <p className="text-xs font-medium">Unavailable</p>
      </div>
    );
  }

  return (
    <div className={`pb-glass-card pb-hover-lift rounded-2xl p-4 sm:p-5 border border-border/60 shadow-sm ${style.borderGlow} relative overflow-hidden group`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.iconGradient} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={20} />
        </div>
        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${style.badgeBg}`}>
          <ArrowUpRight size={10} /> Active
        </span>
      </div>

      <div>
        <p className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
          <AnimatedCounter value={value} />{suffix}
        </p>
        <p className="text-xs font-semibold text-text-secondary mt-0.5">{label}</p>
        {subtitle && <p className="text-[11px] text-text-muted mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

function RatingCard({ averageRating, totalRatings, loading, error }) {
  const style = CARD_STYLES.warning;

  if (loading) {
    return (
      <div className="pb-glass-card rounded-2xl p-4 border border-border/60 shadow-sm">
        <SkeletonCard count={1} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-glass-card rounded-2xl p-4 border border-border/60 shadow-sm text-center text-text-muted">
        <Star size={20} className="mx-auto mb-1.5 opacity-40" />
        <p className="text-xs font-medium">Unavailable</p>
      </div>
    );
  }

  const hasRatings = totalRatings > 0;

  return (
    <div className={`pb-glass-card pb-hover-lift rounded-2xl p-4 sm:p-5 border border-border/60 shadow-sm ${style.borderGlow} relative overflow-hidden group`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.iconGradient} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
          <Star size={20} className="fill-white" />
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${style.badgeBg}`}>
          Rating Score
        </span>
      </div>

      <div>
        {hasRatings ? (
          <>
            <p className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight flex items-baseline gap-1">
              {(Number(averageRating) || 0).toFixed(1)} <span className="text-sm font-semibold text-amber-500">⭐</span>
            </p>
            <p className="text-xs font-semibold text-text-secondary mt-0.5">
              Volunteer Rating
            </p>
            <p className="text-[11px] text-text-muted mt-1">
              Based on {totalRatings} review{totalRatings === 1 ? '' : 's'}
            </p>
          </>
        ) : (
          <>
            <p className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">—</p>
            <p className="text-xs font-semibold text-text-secondary mt-0.5">No Ratings Yet</p>
            <p className="text-[11px] text-text-muted mt-1">Complete missions to earn ratings</p>
          </>
        )}
      </div>
    </div>
  );
}

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SkeletonCard count={4} />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="mb-6">
        <ErrorState
          title="Failed to load statistics"
          message="Unable to fetch your volunteer statistics. Please try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={CheckCircle2}
        label="Missions Completed"
        subtitle="Total food & supply rescues"
        value={stats?.completedPickups || 0}
        tone="success"
        loading={loading}
        error={error}
      />
      <StatCard
        icon={Truck}
        label="Active Pickups"
        subtitle="Currently assigned to you"
        value={stats?.acceptedDonations || 0}
        tone="info"
        loading={loading}
        error={error}
      />
      <StatCard
        icon={Users}
        label="People Helped"
        subtitle="Beneficiaries served"
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
