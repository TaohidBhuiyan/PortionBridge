import { useCountUp } from "../hooks/useCountUp";
import { Icon } from "../common/Icon";

const PRIMARY = "var(--color-primary, oklch(60.6% 0.25 292.717))";
const PRIMARY_DEEP = "var(--color-primary-deep, oklch(38% 0.19 292.717))";
const PRIMARY_TINT = "var(--color-primary-tint, oklch(94% 0.03 292.717))";

const STAT_META = [
  { key: "mealsDelivered", label: "Meals delivered", suffix: "+", icon: "food" },
  { key: "clothesDonated", label: "Clothes donated", suffix: "+", icon: "shirt" },
  { key: "verifiedVolunteers", label: "Verified volunteers", suffix: "", icon: "volunteer" },
  { key: "activeZones", label: "Active zones", suffix: "", icon: "pin" },
];

function StatSkeleton() {
  return (
    <div className="flex flex-col items-center md:items-start gap-2 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-white/10" />
      <div className="h-9 w-20 bg-white/10 rounded mt-1" />
      <div className="h-3 w-24 bg-white/10 rounded" />
    </div>
  );
}

/**
 * StatsSection component - Displays live statistics with animated counters
 * @param {boolean} visible - Whether section is visible for animation
 * @param {Object} stats - Statistics object from API
 * @param {boolean} loading - Whether stats are loading
 *
 * AUDIT FIX: this previously fell back to a hardcoded FALLBACK_STATS object
 * (invented figures like "18,420 meals delivered") whenever `stats` was
 * falsy, shown as if it were live data. That's the same pattern already
 * removed from HeroSection/ReviewSection/LeaderboardSection, so it's fixed
 * here too — the section now only counts up real numbers from the API, and
 * shows a skeleton (not fabricated content) while they're loading or
 * unavailable.
 */
export function StatsSection({ visible, stats, loading }) {
  const hasStats = !loading && stats && typeof stats === "object";

  return (
    <section className="relative py-16 border-b border-black/5 overflow-hidden" style={{ background: `linear-gradient(180deg, ${PRIMARY_TINT}00, ${PRIMARY_TINT}35)` }}>
      <div className="max-w-6xl mx-auto px-6 md:px-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        {STAT_META.map((meta, i) => (
          <StatCard key={meta.key} meta={meta} value={stats?.[meta.key]} hasStats={hasStats} visible={visible} index={i} />
        ))}
      </div>
    </section>
  );
}

function StatCard({ meta, value, hasStats, visible, index }) {
  const isReady = hasStats && typeof value === "number";
  const count = useCountUp(isReady ? value : 0, visible && isReady);

  if (!hasStats) {
    return <StatSkeleton />;
  }

  if (!isReady) return null;

  return (
    <div
      className="group flex flex-col items-center md:items-start text-center md:text-left transition-all duration-300 hover:-translate-y-1"
      style={{ animation: "rowIn 0.5s ease-out both", animationDelay: `${index * 0.08}s` }}
    >
      <span
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
        style={{ background: `${PRIMARY}15`, color: PRIMARY_DEEP }}
      >
        <Icon name={meta.icon} className="w-5 h-5" />
      </span>
      <div className="font-serif text-4xl md:text-5xl font-bold tracking-tight" style={{ color: PRIMARY_DEEP }}>
        {count.toLocaleString()}
        <span className="font-sans text-2xl md:text-3xl ml-0.5 opacity-80">{meta.suffix}</span>
      </div>
      <div className="text-sm font-medium text-slate-500 mt-1">{meta.label}</div>
      <span
        className="mt-2 h-0.5 w-8 rounded-full origin-left scale-x-75 group-hover:scale-x-100 transition-transform duration-300"
        style={{ background: `linear-gradient(90deg, ${PRIMARY_DEEP}, ${PRIMARY})` }}
      />
    </div>
  );
}
