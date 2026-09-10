import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard } from '../skeletons';
import { ErrorState } from '../ErrorState';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Utensils, 
  Shirt, 
  Users, 
  Award,
  Sparkles
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * AnimatedCounter component for smooth counting up animation
 */
function AnimatedCounter({ value, duration = 1800 }) {
  const [count, setCount] = useState(0);
  const animationRef = useRef(null);

  useEffect(() => {
    const endValue = parseInt(value, 10) || 0;
    
    if (endValue === 0) {
      return;
    }

    const startTimestamp = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTimestamp) / duration, 1);
      
      // Easing function for smooth organic deceleration
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * endValue);
      
      setCount(currentCount);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCount(endValue);
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

/**
 * StatisticsCards component with 2-tier spotlight & impact layout
 */
export function StatisticsCards() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE}/profile/donor/statistics`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data?.success) {
          setStats(response.data.data.statistics);
        } else {
          throw new Error('Failed to fetch statistics');
        }
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError(err.message);

        // Fallback default stats
        setStats({
          totalDonations: 0,
          completedDonations: 0,
          pendingDonations: 0,
          cancelledDonations: 0,
          mealsShared: 0,
          clothesDonated: 0,
          peopleHelped: 0,
          successRate: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl border border-border/50 p-4">
              <SkeletonCard count={1} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="mb-6">
        <ErrorState
          title="Failed to load statistics"
          message="Unable to fetch your donation statistics. Please try again later."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Tier 1: Spotlight Operational Metrics
  const spotlightCards = [
    {
      label: 'Total Donations',
      value: stats?.totalDonations || 0,
      suffix: '',
      subtext: 'All contributions logged',
      icon: Package,
      gradient: 'from-violet-500/10 to-purple-500/5',
      iconColor: 'text-dash-primary',
      iconBg: 'bg-dash-primary-soft',
      borderColor: 'hover:border-dash-primary/40',
      badge: 'Lifetime',
    },
    {
      label: 'Completed Deliveries',
      value: stats?.completedDonations || 0,
      suffix: '',
      subtext: 'Delivered to beneficiaries',
      icon: CheckCircle2,
      gradient: 'from-emerald-500/10 to-teal-500/5',
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      borderColor: 'hover:border-emerald-500/40',
      badge: 'Delivered',
    },
    {
      label: 'In Progress',
      value: stats?.pendingDonations || 0,
      suffix: '',
      subtext: 'Awaiting / on the way',
      icon: Clock,
      gradient: 'from-amber-500/10 to-yellow-500/5',
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      borderColor: 'hover:border-amber-500/40',
      badge: 'Active',
    },
    {
      label: 'Fulfillment Rate',
      value: stats?.successRate || 0,
      suffix: '%',
      subtext: 'Successful completion score',
      icon: TrendingUp,
      gradient: 'from-indigo-500/10 to-blue-500/5',
      iconColor: 'text-indigo-500',
      iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      borderColor: 'hover:border-indigo-500/40',
      badge: 'Reliability',
    },
  ];

  // Tier 2: Community Impact Metrics
  const impactCards = [
    {
      label: 'Meals Shared',
      value: stats?.mealsShared || 0,
      suffix: '',
      icon: Utensils,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      unit: 'portions nourished',
    },
    {
      label: 'Clothes Donated',
      value: stats?.clothesDonated || 0,
      suffix: '',
      icon: Shirt,
      color: 'text-sky-500',
      bgColor: 'bg-sky-500/10',
      unit: 'items wearable',
    },
    {
      label: 'People Impacted',
      value: stats?.peopleHelped || 0,
      suffix: '',
      icon: Users,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      unit: 'lives touched',
    },
    {
      label: 'Community Karma',
      value: (stats?.totalDonations || 0) * 50 + (stats?.mealsShared || 0) * 10,
      suffix: ' pts',
      icon: Award,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      unit: 'impact points',
    },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-dash-primary-soft flex items-center justify-center text-dash-primary">
            <Sparkles size={15} />
          </div>
          <h2 className="text-base font-bold text-text-primary">Performance & Impact</h2>
        </div>
        <span className="text-xs font-semibold text-text-secondary bg-surface px-2.5 py-1 rounded-full border border-border/50">
          Real-time Statistics
        </span>
      </div>

      {/* Row 1: Primary Spotlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {spotlightCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.35 }}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              className={`relative overflow-hidden bg-surface rounded-2xl border border-border/60 p-4 sm:p-5 shadow-pb-card ${card.borderColor} transition-all duration-200 group cursor-default`}
            >
              {/* Subtle gradient wash */}
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-40 group-hover:opacity-100 transition-opacity`} />

              <div className="relative z-10 flex items-start justify-between gap-2 mb-3">
                <div className={`w-10 h-10 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform`}>
                  <Icon size={19} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface/80 border border-border/50 text-text-secondary">
                  {card.badge}
                </span>
              </div>

              <div className="relative z-10">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight mb-1">
                  <AnimatedCounter value={card.value} />
                  <span className="text-xl font-bold ml-0.5">{card.suffix}</span>
                </h3>
                <p className="text-xs font-bold text-text-primary">{card.label}</p>
                <p className="text-[11px] text-text-secondary mt-0.5">{card.subtext}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Row 2: Community & Material Impact Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {impactCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.04, duration: 0.3 }}
              whileHover={{ y: -2 }}
              className="bg-surface/80 hover:bg-surface rounded-xl border border-border/50 p-3.5 flex items-center gap-3 transition-all duration-150 hover:shadow-xs group"
            >
              <div className={`w-9 h-9 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon size={17} />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold text-text-primary leading-tight flex items-baseline gap-1">
                  <AnimatedCounter value={card.value} />
                  <span className="text-xs font-semibold text-text-secondary">{card.suffix}</span>
                </div>
                <p className="text-xs font-medium text-text-primary truncate">{card.label}</p>
                <p className="text-[10px] text-text-secondary truncate">{card.unit}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
