import { useState, useEffect } from 'react';
import { SkeletonCard } from '../skeletons';
import { Utensils, Shirt, Users, Leaf } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * ImpactSummary component showing environmental and social impact
 */
export function ImpactSummary() {
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImpact = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE}/profile/donor/statistics`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data?.success) {
          const stats = response.data.data.statistics;
          
          // Calculate estimated food waste saved (assuming average meal = 1.5 lbs)
          const mealsShared = stats.mealsShared || 0;
          const foodWasteSaved = Math.round(mealsShared * 1.5);

          setImpact({
            mealsShared: mealsShared,
            clothesDonated: stats.clothesDonated || 0,
            peopleHelped: stats.peopleHelped || 0,
            foodWasteSaved: foodWasteSaved,
          });
        } else {
          throw new Error('Failed to fetch impact data');
        }
      } catch (err) {
        console.error('Error fetching impact data:', err);
        
        // Set fallback data
        setImpact({
          mealsShared: 0,
          clothesDonated: 0,
          peopleHelped: 0,
          foodWasteSaved: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchImpact();
  }, []);

  const impactCards = [
    {
      icon: Utensils,
      label: 'Meals Shared',
      value: impact?.mealsShared || 0,
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      icon: Shirt,
      label: 'Clothes Donated',
      value: impact?.clothesDonated || 0,
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: Users,
      label: 'People Helped',
      value: impact?.peopleHelped || 0,
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      icon: Leaf,
      label: 'Food Waste Saved',
      value: impact?.foodWasteSaved || 0,
      unit: 'lbs',
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
  ];

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#120721] rounded-xl border border-gray-200 dark:border-purple-950/30 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Impact</h2>
        <SkeletonCard count={4} />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 via-teal-50 to-purple-50 dark:from-green-950/20 dark:via-teal-950/20 dark:to-purple-950/20 rounded-xl border border-green-200 dark:border-purple-950/50 p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Leaf size={20} className="text-green-600 dark:text-green-400" />
        Your Impact
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {impactCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`${card.bgColor} rounded-lg p-4 border border-gray-200 dark:border-purple-950/30 hover:shadow-md transition-all duration-300`}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                <Icon size={20} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {card.value.toLocaleString()}
                {card.unit && <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-1">{card.unit}</span>}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-4 bg-white dark:bg-[#120721] rounded-lg border border-gray-200 dark:border-purple-950/30">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Your contributions are making a real difference in fighting food waste and helping those in need.
          <span className="text-purple-600 dark:text-purple-400 font-medium"> Keep it up! 🌟</span>
        </p>
      </div>
    </div>
  );
}
