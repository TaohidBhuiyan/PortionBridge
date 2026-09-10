import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard } from '../skeletons';
import { 
  Leaf, 
  Users, 
  Utensils, 
  Shirt, 
  Sparkles, 
  Trophy,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * ImpactSummary — Visual Impact Sanctuary
 * Celebrates donor contributions with environmental savings, milestone progress,
 * and high-fidelity metrics.
 */
export function ImpactSummary() {
  const navigate = useNavigate();
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
      <div className="bg-surface rounded-3xl border border-border/50 p-6 shadow-pb-card h-full flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-32 bg-border/40 rounded-md animate-pulse" />
          <div className="h-4 w-12 bg-border/30 rounded-md animate-pulse" />
        </div>
        <SkeletonCard count={2} />
      </div>
    );
  }

  const completed = impact?.completedDonations || 0;
  // Calculate next milestone progress (e.g. tiers of 5, 10, 25, 50, 100)
  const targetMilestone = completed < 5 ? 5 : completed < 10 ? 10 : completed < 25 ? 25 : (Math.floor(completed / 25) + 1) * 25;
  const progressPercent = Math.min(Math.round((completed / targetMilestone) * 100), 100);

  // Environmental impact estimate: ~1.8kg CO2 saved per meal diverted from landfill
  const co2AvoidedKg = Math.round((impact?.mealsShared || 0) * 1.8);

  return (
    <div className="relative overflow-hidden bg-surface rounded-3xl border border-border/50 p-6 shadow-pb-card flex flex-col justify-between h-full group">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-success/5 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-dash-primary/5 blur-2xl" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-success-soft flex items-center justify-center text-success">
              <Leaf size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Impact Sanctuary</h2>
              <p className="text-xs text-text-secondary">Community & Ecological Footprint</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-success-soft text-success border border-success/20">
            <Sparkles size={11} />
            Verified Impact
          </span>
        </div>

        {/* Milestone Progress Bar */}
        <div className="p-4 rounded-2xl bg-surface-hover/70 border border-border/50 mb-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-text-primary flex items-center gap-1.5">
              <Trophy size={13} className="text-amber-500" />
              Next Milestone: {targetMilestone} Deliveries
            </span>
            <span className="font-bold text-dash-primary">{completed} / {targetMilestone} ({progressPercent}%)</span>
          </div>
          <div className="w-full h-2.5 bg-border/40 rounded-full overflow-hidden p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-dash-primary to-emerald-500"
            />
          </div>
        </div>

        {/* 3 Impact Hero Metric Blocks */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-surface border border-border/60 text-center shadow-xs">
            <div className="w-8 h-8 mx-auto mb-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Users size={16} />
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-text-primary">
              {impact.peopleHelped.toLocaleString()}
            </p>
            <p className="text-[11px] font-medium text-text-secondary">People Fed</p>
          </div>

          <div className="p-3 rounded-2xl bg-surface border border-border/60 text-center shadow-xs">
            <div className="w-8 h-8 mx-auto mb-1.5 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Utensils size={16} />
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-text-primary">
              {impact.mealsShared.toLocaleString()}
            </p>
            <p className="text-[11px] font-medium text-text-secondary">Meals Rescued</p>
          </div>

          <div className="p-3 rounded-2xl bg-surface border border-border/60 text-center shadow-xs">
            <div className="w-8 h-8 mx-auto mb-1.5 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Shirt size={16} />
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-text-primary">
              {impact.clothesDonated.toLocaleString()}
            </p>
            <p className="text-[11px] font-medium text-text-secondary">Clothes Donated</p>
          </div>
        </div>
      </div>

      {/* Footer Banner: Ecological Metric & Analytics Link */}
      <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span>
            Prevented <strong className="text-text-primary font-bold">{co2AvoidedKg} kg</strong> of CO₂ emissions
          </span>
        </div>

        <button
          onClick={() => navigate('/donor/analytics')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-dash-primary hover:text-dash-primary-hover self-start sm:self-auto transition-colors"
        >
          <span>Detailed Breakdown</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}