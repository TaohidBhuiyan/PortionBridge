import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Award, ChevronLeft, ChevronRight, Crown, HandHeart, Medal, Sparkles, Star, Trophy, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard';
import leaderboardApi from '../services/leaderboardApi';

const PAGE_SIZE = 10;

const PODIUM_STYLES = {
  1: {
    label: 'Community Champion',
    accent: 'from-amber-400 via-orange-500 to-amber-600',
    surface: 'border-amber-500/40 bg-surface/90 shadow-amber-500/10',
    icon: Crown,
    iconClass: 'text-amber-500 fill-amber-500/20',
    rankClass: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/40',
  },
  2: {
    label: 'Impact Leader',
    accent: 'from-slate-300 via-slate-400 to-slate-500',
    surface: 'border-slate-400/40 bg-surface/90 shadow-slate-400/10',
    icon: Medal,
    iconClass: 'text-slate-400',
    rankClass: 'bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-slate-400/40',
  },
  3: {
    label: 'Difference Maker',
    accent: 'from-amber-600 via-amber-700 to-amber-800',
    surface: 'border-amber-700/40 bg-surface/90 shadow-amber-700/10',
    icon: Award,
    iconClass: 'text-amber-700',
    rankClass: 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-amber-700/40',
  },
};

function Avatar({ volunteer, className = '' }) {
  const initial = (volunteer.name || '?').charAt(0).toUpperCase();
  return (
    <div className={`overflow-hidden rounded-full bg-gradient-to-br from-dash-primary via-indigo-500 to-emerald-500 p-[2px] ${className}`}>
      <div className="h-full w-full overflow-hidden rounded-full bg-surface">
        {volunteer.photo ? (
          <img src={volunteer.photo} alt={volunteer.name || 'Volunteer'} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-dash-primary-soft text-base font-extrabold text-dash-primary">
            {initial}
          </div>
        )}
      </div>
    </div>
  );
}

function PodiumCard({ volunteer, rank, reducedMotion }) {
  const style = PODIUM_STYLES[rank] || PODIUM_STYLES[1];
  const Icon = style.icon;

  return (
    <motion.article
      initial={reducedMotion ? false : { opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: rank === 1 ? 0.1 : rank === 2 ? 0.2 : 0.3, ease: 'easeOut' }}
      whileHover={reducedMotion ? undefined : { y: -6 }}
      className={`pb-glass-card pb-hover-lift relative overflow-hidden rounded-3xl border p-6 shadow-md ${style.surface} ${rank === 1 ? 'md:-mt-4 md:pb-8' : ''}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${style.accent}`} />
      <div className="relative flex items-center justify-between">
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold shadow-lg ${style.rankClass}`}>
          #{rank}
        </span>
        <Icon className={`h-6 w-6 ${style.iconClass}`} />
      </div>

      <div className="relative mt-5 flex flex-col items-center text-center">
        <Avatar volunteer={volunteer} className="h-18 w-18 shadow-md" />
        <p className="mt-3 truncate text-base font-extrabold text-text-primary max-w-[180px]">
          {volunteer.name || 'Anonymous Volunteer'}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-text-muted">{style.label}</p>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-3xl font-extrabold tracking-tight text-text-primary">
            {(volunteer.points || 0).toLocaleString()}
          </span>
          <span className="text-xs font-bold text-dash-primary uppercase">pts</span>
        </div>

        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-dash-primary-soft/60 px-3.5 py-1 text-xs font-semibold text-dash-primary border border-dash-primary/20">
          <HandHeart className="h-3.5 w-3.5 text-dash-primary" />
          {volunteer.completedCount || 0} pickups completed
        </div>
      </div>
    </motion.article>
  );
}

export function VolunteerLeaderboardPage() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await leaderboardApi.getTopVolunteers({ page, limit: PAGE_SIZE });
        if (response.success) {
          setVolunteers(response.data?.volunteers || []);
          setMeta(response.meta || null);
        } else {
          setError(response.message || 'Failed to load leaderboard');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [page, refreshTrigger]);

  const totalPoints = volunteers.reduce((total, v) => total + Number(v.points || 0), 0);
  const totalPickups = volunteers.reduce((total, v) => total + Number(v.completedCount || 0), 0);
  const podiumVolunteers = page === 1 ? volunteers.slice(0, 3) : [];
  const listVolunteers = page === 1 ? volunteers.slice(3) : volunteers;

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-6xl pb-8 space-y-6">
        {/* Hero Header */}
        <motion.section
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="pb-volunteer-hero rounded-3xl p-6 sm:p-8 relative overflow-hidden text-white shadow-xl"
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/volunteer/dashboard')}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all"
                  aria-label="Back to dashboard"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-100">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Community Changemakers
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary dark:text-white">
                Volunteer Impact Leaderboard
              </h1>
              <p className="text-sm sm:text-base text-text-secondary dark:text-emerald-100 leading-relaxed">
                Every completed mission keeps food and items moving to families who need them. Celebrate our top volunteers.
              </p>
            </div>

            {/* Quick Stat Badges */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="pb-glass-card rounded-2xl p-3.5 text-center border border-border/60">
                <Users className="h-4 w-4 mx-auto text-dash-primary mb-1" />
                <p className="text-lg font-extrabold text-text-primary">{meta?.total ?? volunteers.length}</p>
                <p className="text-[10px] font-semibold text-text-muted uppercase">Volunteers</p>
              </div>
              <div className="pb-glass-card rounded-2xl p-3.5 text-center border border-border/60">
                <HandHeart className="h-4 w-4 mx-auto text-emerald-500 mb-1" />
                <p className="text-lg font-extrabold text-text-primary">{totalPickups}</p>
                <p className="text-[10px] font-semibold text-text-muted uppercase">Pickups</p>
              </div>
              <div className="pb-glass-card rounded-2xl p-3.5 text-center border border-border/60">
                <Star className="h-4 w-4 mx-auto text-amber-500 mb-1" />
                <p className="text-lg font-extrabold text-text-primary">{totalPoints.toLocaleString()}</p>
                <p className="text-[10px] font-semibold text-text-muted uppercase">Points</p>
              </div>
            </div>
          </div>
        </motion.section>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-64 animate-pulse rounded-3xl bg-surface border border-border/60 shadow-sm" />
            ))}
          </div>
        ) : error ? (
          <section className="pb-glass-card rounded-3xl border border-danger/20 p-8 text-center shadow-sm">
            <Trophy className="mx-auto h-12 w-12 text-danger opacity-60" />
            <h2 className="mt-3 text-lg font-bold text-text-primary">Leaderboard unavailable</h2>
            <p className="mt-1 text-xs text-text-secondary">{error}</p>
            <button
              onClick={() => setRefreshTrigger((t) => t + 1)}
              className="mt-4 rounded-xl bg-dash-primary px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-dash-primary-hover"
            >
              Try again
            </button>
          </section>
        ) : volunteers.length === 0 ? (
          <section className="pb-glass-card rounded-3xl p-12 text-center border border-border/60 shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-dash-primary-soft text-dash-primary mb-4">
              <Trophy className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">The first impact story starts here</h2>
            <p className="mt-2 text-xs text-text-secondary max-w-md mx-auto">
              Complete a pickup mission to earn points and feature on the community leaderboard.
            </p>
          </section>
        ) : (
          <>
            {/* Top 3 Podium Cards */}
            {podiumVolunteers.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-bold text-text-primary">Top Volunteer Champions</h2>
                </div>
                <div className="grid gap-5 md:grid-cols-3 md:items-end">
                  {[2, 1, 3].map((rank) =>
                    podiumVolunteers[rank - 1] ? (
                      <PodiumCard
                        key={rank}
                        volunteer={podiumVolunteers[rank - 1]}
                        rank={rank}
                        reducedMotion={reducedMotion}
                      />
                    ) : null
                  )}
                </div>
              </section>
            )}

            {/* Remaining Volunteer List */}
            {listVolunteers.length > 0 && (
              <section className="pb-glass-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
                  <div>
                    <h2 className="font-bold text-text-primary text-base">Impact Rankings</h2>
                    <p className="text-xs text-text-muted">Honoring every rescue mission</p>
                  </div>
                  <span className="rounded-full bg-dash-primary-soft px-3.5 py-1 text-xs font-bold text-dash-primary border border-dash-primary/20">
                    {meta?.total ?? volunteers.length} Volunteers
                  </span>
                </div>

                <div className="p-3 space-y-1.5">
                  {listVolunteers.map((volunteer, index) => {
                    const rank = (page - 1) * PAGE_SIZE + index + 1 + (page === 1 ? 3 : 0);
                    return (
                      <motion.article
                        key={volunteer.id || rank}
                        initial={reducedMotion ? false : { opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
                        whileHover={reducedMotion ? undefined : { x: 4 }}
                        className="group flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-colors hover:bg-dash-primary-soft/40 border border-transparent hover:border-dash-primary/20"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface border border-border/60 text-xs font-black text-text-secondary group-hover:text-dash-primary">
                          #{rank}
                        </span>
                        <Avatar volunteer={volunteer} className="h-11 w-11 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-bold text-text-primary text-sm group-hover:text-dash-primary transition-colors">
                            {volunteer.name || 'Anonymous Volunteer'}
                          </h3>
                          <p className="mt-0.5 text-xs font-medium text-text-muted">
                            {volunteer.completedCount || 0} pickup{(volunteer.completedCount || 0) === 1 ? '' : 's'} completed
                            {volunteer.averageRating ? ` · ${Number(volunteer.averageRating).toFixed(1)}★` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-extrabold tracking-tight text-dash-primary">
                            {(volunteer.points || 0).toLocaleString()}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">points</p>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Pagination Controls */}
            {meta && meta.totalPages > 1 && (
              <nav className="flex items-center justify-between pb-glass-card rounded-2xl p-3 border border-border/60 shadow-sm">
                <button
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="text-xs font-semibold text-text-muted">
                  Page <span className="text-text-primary font-bold">{page}</span> of {meta.totalPages}
                </span>
                <button
                  onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
                  disabled={page === meta.totalPages}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            )}
          </>
        )}
      </main>
    </DashboardLayout>
  );
}
