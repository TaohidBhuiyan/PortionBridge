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
function StatCard({ icon: Icon, label, value, color, loading, error }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#120721] rounded-xl border border-gray-200 dark:border-purple-950/30 p-6">
        <SkeletonCard count={1} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-[#120721] rounded-xl border border-gray-200 dark:border-purple-950/30 p-6">
        <div className="text-center text-gray-400 dark:text-gray-600">
          <Icon size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#120721] rounded-xl border border-gray-200 dark:border-purple-950/30 p-6 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 group">
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={24} className="text-white" />
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        <AnimatedCounter value={value} />
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
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
      color: 'bg-purple-500',
    },
    {
      icon: CheckCircle,
      label: 'Completed Donations',
      value: stats?.completedDonations || 0,
      color: 'bg-green-500',
    },
    {
      icon: Clock,
      label: 'Pending Donations',
      value: stats?.pendingDonations || 0,
      color: 'bg-yellow-500',
    },
    {
      icon: XCircle,
      label: 'Cancelled Donations',
      value: stats?.cancelledDonations || 0,
      color: 'bg-red-500',
    },
    {
      icon: Utensils,
      label: 'Meals Shared',
      value: stats?.mealsShared || 0,
      color: 'bg-orange-500',
    },
    {
      icon: Shirt,
      label: 'Clothes Donated',
      value: stats?.clothesDonated || 0,
      color: 'bg-blue-500',
    },
    {
      icon: Users,
      label: 'People Helped',
      value: stats?.peopleHelped || 0,
      color: 'bg-teal-500',
    },
    {
      icon: TrendingUp,
      label: 'Success Rate',
      value: stats?.successRate || 0,
      color: 'bg-indigo-500',
      suffix: '%',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cardConfig.map((_, index) => (
          <SkeletonCard key={index} count={1} />
        ))}
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cardConfig.map((card, index) => (
        <StatCard
          key={index}
          icon={card.icon}
          label={card.label}
          value={card.value}
          color={card.color}
          loading={loading}
          error={error}
        />
      ))}
    </div>
  );
}
