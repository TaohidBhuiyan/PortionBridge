import { useState, useEffect, useRef } from 'react';
import { SkeletonCard } from '../skeletons';
import { ErrorState } from '../ErrorState';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Utensils, 
  Shirt, 
  Users, 
  TrendingUp 
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * AnimatedCounter component for counting up numbers
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
      
      // Easing function for smooth animation
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

/**
 * StatCard component for individual statistics
 */
const TONE_CLASSES = {
  primary: 'bg-dash-primary-soft text-dash-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
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

  const hoverBorderClass = {
    primary: 'hover:border-dash-primary/30',
    success: 'hover:border-success/30',
    warning: 'hover:border-warning/30',
    danger: 'hover:border-danger/30',
    info: 'hover:border-info/30',
  }[tone] || 'hover:border-dash-primary/30';

  return (
    <div className={`bg-surface rounded-lg border border-border/50 p-3 ${hoverBorderClass} hover:shadow-md hover:scale-[1.01] transition-all duration-200 ease-out cursor-default`}>
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
 * StatisticsCards component with 8 summary cards
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

        // Fetch donor statistics from existing API
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

        // Set fallback data if API fails
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

  const cardConfig = [
    {
      icon: Package,
      label: 'Total Donations',
      value: stats?.totalDonations || 0,
      tone: 'primary',
    },
    {
      icon: CheckCircle,
      label: 'Completed',
      value: stats?.completedDonations || 0,
      tone: 'success',
    },
    {
      icon: Clock,
      label: 'Pending',
      value: stats?.pendingDonations || 0,
      tone: 'warning',
    },
    {
      icon: XCircle,
      label: 'Cancelled',
      value: stats?.cancelledDonations || 0,
      tone: 'danger',
    },
    {
      icon: Utensils,
      label: 'Meals Shared',
      value: stats?.mealsShared || 0,
      tone: 'info',
    },
    {
      icon: Shirt,
      label: 'Clothes Donated',
      value: stats?.clothesDonated || 0,
      tone: 'info',
    },
    {
      icon: Users,
      label: 'People Helped',
      value: stats?.peopleHelped || 0,
      tone: 'success',
    },
    {
      icon: TrendingUp,
      label: 'Success Rate',
      value: stats?.successRate || 0,
      tone: 'primary',
      suffix: '%',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {cardConfig.map((_, index) => (
          <SkeletonCard key={index} count={1} />
        ))}
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="mb-5">
        <ErrorState
          title="Failed to load statistics"
          message="Unable to fetch your donation statistics. Please try again later."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {cardConfig.map((card, index) => (
        <StatCard
          key={index}
          icon={card.icon}
          label={card.label}
          value={card.value}
          suffix={card.suffix}
          tone={card.tone}
          loading={loading}
          error={error}
        />
      ))}
    </div>
  );
}
