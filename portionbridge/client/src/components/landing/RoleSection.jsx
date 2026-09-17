import { useState } from "react";
import { Icon } from "../common/Icon";
import { Reveal } from "../common/Reveal";

const PRIMARY = "var(--color-primary, oklch(60.6% 0.25 292.717))";
const PRIMARY_DEEP = "var(--color-primary-deep, oklch(38% 0.19 292.717))";
const PRIMARY_TINT = "var(--color-primary-tint, oklch(94% 0.03 292.717))";

const ROLES = [
  {
    key: "donor",
    icon: "donor",
    title: "Donor",
    tag: "GIVE WHAT YOU CAN SPARE",
    body: "Share extra food or clothes in under a minute. Choose to donate cash, goods, or both — and easily track which zone and volunteer handles the pickup.",
    points: ["Schedule a pickup from your address", "See your total impact on the leaderboard", "Get a receipt for every handover"],
  },
  {
    key: "volunteer",
    icon: "volunteer",
    title: "Volunteer",
    tag: "COLLECT, AREA BY AREA",
    body: "Claim a zone, see nearby pending pickups on a map, and mark each collection complete — food and clothes tracked separately.",
    points: ["Zone-based task queue, no overlap", "Photo confirmation on handover", "Climb the volunteer leaderboard"],
  },
];

/**
 * RoleSection component - Displays donor and volunteer role information
 */
export function RoleSection() {
  const [activeRole, setActiveRole] = useState("donor");
  const activeRoleData = ROLES.find((r) => r.key === activeRole);
  const activeIndex = ROLES.findIndex((r) => r.key === activeRole);

  return (
    <section id="roles" className="py-24 md:py-28">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <Reveal>
          <div className="font-mono text-xs mb-4 text-center" style={{ color: PRIMARY_DEEP }}>HOW IT WORKS</div>
          <h2 className="font-serif text-4xl md:text-5xl max-w-xl mx-auto text-center">Two roles, one bridge.</h2>
          <p className="text-black/55 max-w-lg mx-auto mt-4 text-center">
            PortionBridge connects donors and volunteers through one simple platform. Donors can share food, clothes, or financial support, while volunteers help ensure every contribution reaches the people who need it.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="relative inline-flex gap-1 mt-8 mb-8 p-1 rounded-xl border border-[#6d45bd]/10 bg-[#f7f1fb]">
            {/* Sliding active-tab indicator, so switching roles reads as one continuous motion */}
            <span
              className="absolute top-1 bottom-1 rounded-full shadow-md shadow-primary/15 transition-all duration-300 ease-out"
              style={{
                background: `linear-gradient(135deg, var(--color-primary-deeper), ${PRIMARY})`,
                width: `calc(50% - 4px)`,
                left: activeIndex === 0 ? "4px" : "calc(50% + 0px)",
              }}
            />
            {ROLES.map((r) => (
              <button
                key={r.key}
                onClick={() => setActiveRole(r.key)}
                className={`relative z-10 flex items-center justify-center gap-2 px-5.5 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-300 cursor-pointer active:scale-95 ${
                  activeRole === r.key ? "text-white" : "text-black/60 hover:text-black"
                }`}
              >
                <Icon name={r.icon} className={`w-4 h-4 transition-transform duration-300 ${activeRole === r.key ? "scale-110" : ""}`} />
                {r.title}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="glass-panel relative grid md:grid-cols-[1fr_1.2fr] gap-10 items-start rounded-3xl p-6 sm:p-8 md:p-12 overflow-hidden">
          <div
            className="absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-[0.06] pointer-events-none transition-all duration-500"
            style={{ background: PRIMARY, animation: "float 8s ease-in-out infinite" }}
          />
          <div key={`${activeRole}-info`} className="relative flex flex-col" style={{ animation: "fadeIn 0.35s ease" }}>
            <span className="font-mono text-[10px] font-bold tracking-wider uppercase" style={{ color: PRIMARY_DEEP }}>{activeRoleData.tag}</span>
            <h3 className="font-serif text-3xl font-bold tracking-tight text-slate-900 mt-3 mb-4">{activeRoleData.title}</h3>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base font-normal">{activeRoleData.body}</p>
          </div>
          <div className="relative flex flex-col gap-3">
            {activeRoleData.points.map((p, i) => (
              <div
                key={`${activeRole}-${p}`}
                className="glass-card role-feature interactive-card flex items-start gap-3 rounded-xl p-4 transition-all duration-300 hover:translate-x-1.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
                style={{ animation: "rowIn 0.4s ease-out both", animationDelay: `${i * 0.07}s` }}
              >
                <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: PRIMARY_TINT, color: PRIMARY_DEEP }}>
                  <Icon name="check" className="w-3.5 h-3.5" />
                </span>
                <span className="text-sm font-medium text-slate-700 pt-0.5">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
