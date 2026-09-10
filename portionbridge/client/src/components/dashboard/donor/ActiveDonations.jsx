import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SkeletonCard } from '../skeletons';
import { ErrorState } from '../ErrorState';
import { StatusBadge } from '../../donation/StatusBadge';
import { 
  Package, 
  Clock, 
  User, 
  Calendar, 
  ArrowRight, 
  Sparkles,
  Utensils,
  Shirt,
  HeartHandshake
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * ActiveDonations — Mission Control Panel
 * Displays in-flight donations with live tracking status, volunteer assignment info,
 * and high-converting empty state.
 */
export function ActiveDonations() {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActiveDonations = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${API_BASE}/donations/my-history?status=pending,accepted,scheduled,on_the_way&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success) {
        setDonations(response.data.data.donations || []);
      } else {
        throw new Error('Failed to fetch active donations');
      }
    } catch (err) {
      console.error('Error fetching active donations:', err);
      setError(err.message);
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchActiveDonations();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return null;
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'food':
        return <Utensils size={16} className="text-amber-500" />;
      case 'clothes':
      case 'clothing':
        return <Shirt size={16} className="text-sky-500" />;
      default:
        return <Package size={16} className="text-dash-primary" />;
    }
  };

  const getCategoryBadgeClass = (category) => {
    switch (category?.toLowerCase()) {
      case 'food':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'clothes':
      case 'clothing':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      default:
        return 'bg-dash-primary-soft text-dash-primary border-dash-primary/20';
    }
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-3xl border border-border/50 p-3.5 sm:p-4 h-full min-h-[230px] sm:min-h-[245px] flex flex-col justify-between shadow-pb-card">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-36 bg-border/40 rounded-md animate-pulse" />
          <div className="h-4 w-16 bg-border/30 rounded-md animate-pulse" />
        </div>
        <div className="space-y-3 flex-1 flex flex-col justify-center">
          <SkeletonCard count={2} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-3xl border border-border/50 p-3.5 sm:p-4 h-full min-h-[230px] sm:min-h-[245px] flex flex-col justify-between shadow-pb-card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-text-primary">Active Donations</h2>
        </div>
        <div className="flex-1 flex items-center justify-center py-4">
          <ErrorState
            title="Failed to load donations"
            message="Unable to fetch your active donations. Please try again."
            onRetry={fetchActiveDonations}
            size="small"
          />
        </div>
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="relative overflow-hidden bg-surface rounded-3xl border border-border/50 p-3.5 sm:p-4 h-full min-h-[230px] sm:min-h-[245px] flex flex-col justify-between shadow-pb-card">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-dash-primary/5 blur-2xl" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-dash-primary-soft flex items-center justify-center text-dash-primary">
              <Package size={15} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-text-primary leading-tight">Active Donations</h2>
              <p className="text-[11px] text-text-secondary">Current in-flight requests</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-hover text-text-secondary border border-border/40">
            0 Active
          </span>
        </div>

        {/* High-fidelity Compact Empty State */}
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center py-1.5 px-3">
          <div className="relative mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-dash-primary-soft to-indigo-50 dark:to-slate-800 flex items-center justify-center text-dash-primary shadow-inner border border-dash-primary/20">
              <HeartHandshake size={20} className="text-dash-primary animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles size={9} />
            </div>
          </div>

          <h3 className="text-sm font-bold text-text-primary mb-1">
            No active donations right now
          </h3>
          <p className="w-full max-w-[460px] text-xs text-text-secondary mb-3 leading-relaxed">
            Your kitchen surplus or gently worn clothes can bring immediate relief to someone in your neighborhood today.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => navigate('/donation/create?category=food')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-dash-primary hover:bg-dash-primary-hover text-white text-xs font-semibold shadow-xs transition-all hover:scale-102"
            >
              <Utensils size={13} />
              <span>Donate Food</span>
            </button>
            <button
              onClick={() => navigate('/donation/create?category=clothes')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all hover:scale-102"
            >
              <Shirt size={13} />
              <span>Donate Clothes</span>
            </button>
            <button
              onClick={() => navigate('/donor/my-donations')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover text-text-primary text-xs font-medium border border-border/60 transition-colors"
            >
              <span>Past History</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-3xl border border-border/50 p-3.5 sm:p-4 h-full min-h-[230px] sm:min-h-[245px] flex flex-col justify-between shadow-pb-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-dash-primary-soft flex items-center justify-center text-dash-primary">
            <Package size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-text-primary">Active Donations</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-dash-primary text-white">
                {donations.length} Active
              </span>
            </div>
            <p className="text-xs text-text-secondary">Tracking pickups & deliveries</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/donor/my-donations')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-dash-primary hover:text-dash-primary-hover transition-colors"
        >
          <span>View All</span>
          <ArrowRight size={12} />
        </button>
      </div>

      <div className="space-y-3 flex-1 flex flex-col justify-start">
        {donations.map((donation, idx) => (
          <motion.div
            key={donation.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            onClick={() => navigate(`/donations/${donation.id}`)}
            className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border border-border/50 hover:border-dash-primary/40 bg-surface hover:bg-surface-hover/60 cursor-pointer transition-all duration-200 hover:shadow-sm"
          >
            {/* Left: Category Icon + Title + Metadata */}
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-surface border border-border/60 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                {getCategoryIcon(donation.category)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-sm font-bold text-text-primary truncate group-hover:text-dash-primary transition-colors">
                    {donation.title}
                  </h3>
                  <StatusBadge status={donation.status} size="small" />
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs text-text-secondary">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getCategoryBadgeClass(donation.category)} capitalize`}>
                    {donation.category}
                  </span>

                  <span className="inline-flex items-center gap-1">
                    <Calendar size={11} className="opacity-70" />
                    <span>{formatDate(donation.createdAt)}</span>
                  </span>

                  {donation.scheduledPickupTime && (
                    <span className="inline-flex items-center gap-1 text-warning font-medium">
                      <Clock size={11} />
                      <span>{formatTime(donation.scheduledPickupTime)}</span>
                    </span>
                  )}

                  {donation.assignedVolunteer ? (
                    <span className="inline-flex items-center gap-1 text-dash-primary font-medium">
                      <User size={11} />
                      <span className="truncate max-w-[120px]">{donation.assignedVolunteer.name}</span>
                    </span>
                  ) : (
                    <span className="text-text-muted italic text-[11px]">
                      Waiting for volunteer
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quick Action Pill */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/donations/${donation.id}`);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dash-primary-soft hover:bg-dash-primary text-dash-primary hover:text-white text-xs font-semibold transition-all duration-150"
              >
                <span>Track Live</span>
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}