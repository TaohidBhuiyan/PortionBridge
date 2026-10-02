import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Award, ChevronLeft, ChevronRight, Crown, Heart, Medal, Sparkles, Target, Trophy, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard';
import { Avatar as UserAvatar } from '../components/common/Avatar';
import leaderboardApi from '../services/leaderboardApi';

const PAGE_SIZE = 10;
const podiumStyles = {
  1: { label: 'Community champion', accent: 'from-indigo-500 to-violet-500', surface: 'border-indigo-200 bg-surface dark:border-indigo-400/30', icon: Crown, iconClass: 'text-indigo-600 dark:text-indigo-300', rankClass: 'bg-indigo-600 text-white shadow-indigo-300/50' },
  2: { label: 'Impact leader', accent: 'from-slate-400 to-slate-500', surface: 'border-slate-200 bg-surface dark:border-slate-400/30', icon: Medal, iconClass: 'text-slate-500 dark:text-slate-300', rankClass: 'bg-slate-500 text-white shadow-slate-300/50' },
  3: { label: 'Difference maker', accent: 'from-violet-400 to-fuchsia-500', surface: 'border-violet-200 bg-surface dark:border-violet-400/30', icon: Award, iconClass: 'text-violet-600 dark:text-violet-300', rankClass: 'bg-violet-500 text-white shadow-violet-300/50' },
};

function Avatar({ donor, className = '' }) {
  return <div className={`overflow-hidden rounded-full bg-gradient-to-br from-donor to-violet-500 p-[2px] ${className}`}><UserAvatar item={donor} tone="brand" className="h-full w-full" /></div>;
}

function PodiumCard({ donor, rank, reducedMotion }) {
  const style = podiumStyles[rank];
  const Icon = style.icon;
  return <motion.article initial={reducedMotion ? false : { opacity: 0, y: 22, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.45, delay: rank === 1 ? 0.12 : rank === 2 ? 0.22 : 0.32, ease: 'easeOut' }} whileHover={reducedMotion ? undefined : { y: -5 }} className={`relative overflow-hidden rounded-3xl border p-5 shadow-pb-card transition-shadow hover:shadow-pb-elevated ${style.surface} ${rank === 1 ? 'md:-mt-4 md:pb-7' : ''}`}>
    <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${style.accent}`} />
    <div className="relative flex items-center justify-between"><span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-black shadow-lg ${style.rankClass}`}>#{rank}</span><Icon className={`h-6 w-6 ${style.iconClass}`} /></div>
    <div className="relative mt-5 flex flex-col items-center text-center"><Avatar donor={donor} className="h-16 w-16 shadow-lg" /><p className="mt-3 truncate text-base font-bold text-text-primary">{donor.name || 'Anonymous Donor'}</p><p className="mt-1 text-xs font-medium text-text-muted">{style.label}</p><div className="mt-4 flex items-baseline gap-1"><span className="text-2xl font-black tracking-tight text-text-primary">{donor.points || 0}</span><span className="text-xs font-semibold text-text-muted">pts</span></div><div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-text-secondary ring-1 ring-black/[0.04] dark:bg-white/5 dark:ring-white/10"><Heart className="h-3.5 w-3.5 text-donor" fill="currentColor" />{donor.donationsCount || 0} donations</div></div>
  </motion.article>;
}

export function DonorLeaderboardPage() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [donors, setDonors] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [page, setPage] = useState(1); const [meta, setMeta] = useState(null);
  async function fetchLeaderboard() { setLoading(true); setError(''); try { const response = await leaderboardApi.getTopDonors({ page, limit: PAGE_SIZE }); if (response.success) { setDonors(response.data?.donors || []); setMeta(response.meta || null); } else setError(response.message || 'Failed to load leaderboard'); } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to load leaderboard'); } finally { setLoading(false); } }
  useEffect(() => { fetchLeaderboard(); }, [page]);
  const totalPoints = donors.reduce((total, donor) => total + Number(donor.points || 0), 0); const totalDonations = donors.reduce((total, donor) => total + Number(donor.donationsCount || 0), 0); const podiumDonors = page === 1 ? donors.slice(0, 3) : []; const listDonors = page === 1 ? donors.slice(3) : donors;

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-6xl pb-8">
        <motion.section
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 75%, #6d28d9 100%)',
          }}
          className="relative isolate overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-7 text-white shadow-xl shadow-indigo-950/25 border border-white/10"
        >
          {/* Ambient Lighting & Pattern Effects */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-pink-500/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.06]" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left Content Column */}
            <div className="space-y-3 max-w-xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => navigate('/donor/dashboard')}
                  className="group inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Back to dashboard"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                </button>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-wider uppercase text-indigo-100 backdrop-blur-md shadow-sm">
                  <Sparkles className="h-3 w-3 text-amber-300 animate-pulse" />
                  Community Changemakers
                </div>
                {/* Mobile Live Badge */}
                <div className="sm:hidden inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-200 backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Live
                </div>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                  Donor Leaderboard
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-indigo-100/90 leading-relaxed max-w-lg">
                  Every completed donation creates a visible ripple of good. Celebrate the people moving our community forward.
                </p>
              </div>
            </div>

            {/* Right Column: Live Status & Stat Cards */}
            <div className="flex flex-col gap-2.5 shrink-0 lg:max-w-md w-full lg:w-auto">
              {/* Desktop Live Badge */}
              <div className="hidden sm:flex items-center justify-end gap-2 text-xs">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold text-indigo-100 backdrop-blur-md shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  <span className="font-bold text-emerald-300">LIVE IMPACT</span>
                  <span className="text-white/40">•</span>
                  <span className="text-white/80">Updated in real time</span>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <div className="group rounded-2xl border border-white/15 bg-white/[0.08] hover:bg-white/[0.14] hover:border-white/25 p-3 text-center backdrop-blur-md transition-all duration-200 shadow-sm hover:scale-[1.02]">
                  <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-200 group-hover:text-white transition-colors">
                    <Users className="h-4 w-4" />
                  </div>
                  <p className="text-base sm:text-lg font-black text-white tracking-tight">
                    {(meta?.total ?? donors.length).toLocaleString()}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200/80">
                    Donors
                  </p>
                </div>

                <div className="group rounded-2xl border border-white/15 bg-white/[0.08] hover:bg-white/[0.14] hover:border-white/25 p-3 text-center backdrop-blur-md transition-all duration-200 shadow-sm hover:scale-[1.02]">
                  <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/20 text-pink-300 group-hover:text-white transition-colors">
                    <Heart className="h-4 w-4" />
                  </div>
                  <p className="text-base sm:text-lg font-black text-white tracking-tight">
                    {totalDonations.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200/80">
                    Donations
                  </p>
                </div>

                <div className="group rounded-2xl border border-white/15 bg-white/[0.08] hover:bg-white/[0.14] hover:border-white/25 p-3 text-center backdrop-blur-md transition-all duration-200 shadow-sm hover:scale-[1.02]">
                  <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 group-hover:text-white transition-colors">
                    <Target className="h-4 w-4" />
                  </div>
                  <p className="text-base sm:text-lg font-black text-white tracking-tight">
                    {totalPoints.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200/80">
                    Points
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
    {loading ? <div className="mt-6 grid gap-4 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-3xl bg-surface shadow-pb-card" />)}</div> : error ? <section className="mt-6 rounded-3xl border border-danger/20 bg-danger-soft px-6 py-14 text-center shadow-pb-card"><Trophy className="mx-auto h-10 w-10 text-danger" /><h2 className="mt-4 text-lg font-bold text-text-primary">Leaderboard unavailable</h2><p className="mt-1 text-sm text-text-secondary">{error}</p><button onClick={fetchLeaderboard} className="mt-5 rounded-xl bg-dash-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:bg-dash-primary-hover focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2">Try again</button></section> : donors.length === 0 ? <section className="mt-6 rounded-3xl border border-border bg-surface px-6 py-16 text-center shadow-pb-card"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-donor-soft"><Trophy className="h-8 w-8 text-donor" /></div><h2 className="mt-5 text-xl font-bold text-text-primary">The first impact story starts here</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">Complete a donation to earn points and join the community leaderboard.</p></section> : <>
      {podiumDonors.length > 0 && <section className="mt-7"><div className="mb-4 flex items-center gap-2"><Crown className="h-5 w-5 text-amber-500" /><h2 className="text-lg font-bold text-text-primary">This month&apos;s standouts</h2></div><div className="grid gap-4 md:grid-cols-3 md:items-end">{[2, 1, 3].map((rank) => podiumDonors[rank - 1] && <PodiumCard key={rank} donor={podiumDonors[rank - 1]} rank={rank} reducedMotion={reducedMotion} />)}</div></section>}
      {listDonors.length > 0 && <section className="mt-7 overflow-hidden rounded-3xl border border-border bg-surface shadow-pb-card"><div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6"><div><h2 className="font-bold text-text-primary">Impact rankings</h2><p className="mt-0.5 text-xs text-text-muted">Honouring every contribution</p></div><span className="rounded-full bg-donor-soft px-3 py-1 text-xs font-bold text-donor">{meta?.total ?? donors.length} donors</span></div><div className="p-2 sm:p-3">{listDonors.map((donor, index) => { const rank = (page - 1) * PAGE_SIZE + index + 1 + (page === 1 ? 3 : 0); return <motion.article key={donor.id || rank} initial={reducedMotion ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: Math.min(index * 0.055, 0.35) }} whileHover={reducedMotion ? undefined : { x: 3 }} className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-donor-soft/65 sm:gap-4 sm:px-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-hover text-sm font-black text-text-secondary group-hover:bg-white group-hover:text-donor group-hover:shadow-sm dark:group-hover:bg-surface">#{rank}</span><Avatar donor={donor} className="h-11 w-11 shrink-0" /><div className="min-w-0 flex-1"><h3 className="truncate font-bold text-text-primary">{donor.name || 'Anonymous Donor'}</h3><p className="mt-0.5 text-xs font-medium text-text-muted">{donor.donationsCount || 0} donation{(donor.donationsCount || 0) === 1 ? '' : 's'} made</p></div><div className="text-right"><p className="text-lg font-black tracking-tight text-donor">{(donor.points || 0).toLocaleString()}</p><p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">points</p></div></motion.article>; })}</div></section>}
        {meta && meta.totalPages > 1 && (
          <nav className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-surface p-2 shadow-pb-subtle" aria-label="Leaderboard pagination">
            <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-text-secondary transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />Previous
            </button>
            <span className="text-xs font-semibold text-text-muted sm:text-sm">
              Page <span className="text-text-primary">{page}</span> of {meta.totalPages}
            </span>
            <button onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))} disabled={page === meta.totalPages} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-text-secondary transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40">
              Next<ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
      </>}
    </main>
  </DashboardLayout>
  );
}

