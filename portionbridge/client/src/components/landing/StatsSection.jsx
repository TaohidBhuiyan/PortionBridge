import React from "react";
import { useCountUp } from "../hooks/useCountUp";
import { Reveal } from "../common/Reveal";

const PRIMARY_DEEP = "var(--color-primary-deep, oklch(38% 0.19 292.717))";

const FALLBACK_STATS = {
  mealsDelivered: 18420,
  clothesDonated: 9650,
  verifiedVolunteers: 312,
  activeZones: 9,
};

/**
 * StatsSection component - Displays live statistics with animated counters
 * @param {boolean} visible - Whether section is visible for animation
 * @param {Object} stats - Statistics object from API
 * @param {boolean} loading - Whether stats are loading
 */
export function StatsSection({ visible, stats, loading }) {
  const data = stats || FALLBACK_STATS;
  const mealsCount = useCountUp(loading ? 0 : data.mealsDelivered, visible && !loading);
  const clothesCount = useCountUp(loading ? 0 : data.clothesDonated, visible && !loading);
  const volunteersCount = useCountUp(loading ? 0 : data.verifiedVolunteers, visible && !loading);
  const zonesCount = useCountUp(loading ? 0 : data.activeZones, visible && !loading);

  return (
    <section className="py-16 border-b border-black/5">
      <div className="max-w-6xl mx-auto px-6 md:px-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { v: mealsCount, label: "Meals delivered", suffix: "+" },
          { v: clothesCount, label: "Clothes donated", suffix: "+" },
          { v: volunteersCount, label: "Verified volunteers", suffix: "" },
          { v: zonesCount, label: "Active zones", suffix: "" },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center md:items-start text-center md:text-left transition-transform duration-300 hover:translate-y-[-2px]">
            <div className="font-serif text-4xl md:text-5xl font-bold tracking-tight" style={{ color: PRIMARY_DEEP }}>
              {s.v.toLocaleString()}
              <span className="font-sans text-2xl md:text-3xl ml-0.5 opacity-80">{s.suffix}</span>
            </div>
            <div className="text-sm font-medium text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
