import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  PlusCircle, 
  Search, 
  Trophy, 
  ShieldCheck,
  Flame,
  Sparkles
} from 'lucide-react';

/**
 * WelcomeHeader — Sleek Executive Welcome Bar
 * Compact, lightweight banner that sits elegantly above the ProfileCard hero row.
 */
export function WelcomeHeader({ user, leaderboardRank, summary }) {
  const navigate = useNavigate();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const currentDate = useMemo(() => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  }, []);

  const displayName = user?.name?.split(' ')[0] || 'Donor';
  const totalDonations = summary?.totalDonations ?? summary?.total ?? 0;

  // Donor Honor Tier Calculation
  const honorTier = useMemo(() => {
    if (totalDonations >= 20) return { label: 'Champion Benefactor', icon: Trophy };
    if (totalDonations >= 10) return { label: 'Gold Guardian', icon: Flame };
    if (totalDonations >= 5) return { label: 'Silver Patron', icon: ShieldCheck };
    if (totalDonations >= 1) return { label: 'Community Hero', icon: Sparkles };
    return { label: 'Rising Donor', icon: Sparkles };
  }, [totalDonations]);

  const TierIcon = honorTier.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-r from-dash-primary-soft/50 via-surface to-surface py-2.5 sm:py-3 px-4 sm:px-5 shadow-pb-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      {/* Subtle ambient lighting */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-dash-primary/5 blur-2xl" />

      {/* Left: Greeting + Honor Tier + Date */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
        <h1 className="text-base sm:text-lg font-extrabold text-text-primary tracking-tight flex items-center gap-1.5">
          <span>{greeting},</span>
          <span className="bg-gradient-to-r from-dash-primary via-indigo-600 to-purple-600 dark:from-violet-400 dark:to-indigo-300 bg-clip-text text-transparent">
            {displayName}
          </span>
          <span className="text-base">👋</span>
        </h1>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface border border-border/60 text-text-primary shadow-2xs">
            <TierIcon size={11} className="text-dash-primary" />
            <span>{honorTier.label}</span>
          </span>

          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-text-secondary font-medium">
            <Calendar size={11} className="opacity-70" />
            <span>{currentDate}</span>
          </span>

          <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Portal
          </span>

          {leaderboardRank && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Trophy size={10} />
              Rank #{leaderboardRank}
            </span>
          )}
        </div>
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <button
          onClick={() => navigate('/donor/discover-volunteers')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-border/60 text-xs font-semibold text-text-primary transition-all hover:shadow-xs focus:outline-none"
        >
          <Search size={13} className="text-text-secondary" />
          <span>Volunteers</span>
        </button>

        <button
          onClick={() => navigate('/donation/create')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-dash-primary to-indigo-600 hover:from-dash-primary-hover hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition-all hover:scale-102 focus:outline-none"
        >
          <PlusCircle size={14} />
          <span>Donate Food</span>
        </button>
      </div>
    </motion.div>
  );
}
