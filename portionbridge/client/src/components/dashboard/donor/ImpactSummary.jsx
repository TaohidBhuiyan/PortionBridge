import { useState, useEffect } from 'react';
import { SkeletonCard } from '../skeletons';
import { Leaf, Users, Utensils, Shirt } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * ImpactSummary — a contextual, narrative view of the donor's impact.
 * Deliberately distinct from StatisticsCards (which already shows the raw
 * counts as a grid): this reads as a sentence plus a compact inline stat
 * row, not another set of colored boxes.
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
          setImpact({
            completedDonations: stats.completedDonations || 0,
            mealsShared: stats.mealsShared || 0,
            clothesDonated: stats.clothesDonated || 0,
            peopleHelped: stats.peopleHelped || 0,
          });
        } else {
          throw new Error('Failed to fetch impact data');
        }
      } catch (err) {
        console.error('Error fetching impact data:', err);
        setImpact({ completedDonations: 0, mealsShared: 0, clothesDonated: 0, peopleHelped: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchImpact();
  }, []);

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-text-primary mb-4">Your Impact</h2>
        <SkeletonCard count={1} />
      </div>
    );
  }

  const stats = [
    { icon: Users, value: impact.peopleHelped, label: 'people helped' },
    { icon: Utensils, value: impact.mealsShared, label: 'meals shared' },
    { icon: Shirt, value: impact.clothesDonated, label: 'clothes donated' },
  ];

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <h2 className="text-base font-semibold text-text-primary mb-2 flex items-center gap-2">
        <Leaf size={16} className="text-success" />
        Your Impact
      </h2>

      <p className="text-sm text-text-secondary mb-4">
        <span className="font-semibold text-text-primary">{impact.completedDonations.toLocaleString()}</span>{' '}
        {impact.completedDonations === 1 ? 'donation' : 'donations'} completed — your contributions are
        making a real difference in your community.
      </p>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 border-t border-border">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-success-soft flex items-center justify-center shrink-0">
              <Icon size={14} className="text-success" />
            </div>
            <span className="text-base font-semibold text-text-primary">{value.toLocaleString()}</span>
            <span className="text-xs text-text-secondary">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}