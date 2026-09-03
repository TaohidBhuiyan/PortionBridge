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
    body: "List spare food or clothes in under a minute. Choose cash, kind, or both — track exactly which zone and volunteer picked it up.",
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

  return (
    <section id="roles" className="py-24 md:py-28">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <Reveal>
          <div className="font-mono text-xs mb-4" style={{ color: PRIMARY_DEEP }}>HOW IT WORKS</div>
          <h2 className="font-serif text-4xl md:text-5xl max-w-xl">Two roles, one bridge.</h2>
        </Reveal>

        <Reveal delay={80}>
          <div className="flex gap-2.5 mt-10 mb-8 flex-wrap">
            {ROLES.map((r) => (
              <button
                key={r.key}
                onClick={() => setActiveRole(r.key)}
                className={`flex items-center gap-2 px-5.5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-300 cursor-pointer active:scale-95 ${
                  activeRole === r.key ? "text-white border-transparent shadow-md shadow-primary/15 scale-105" : "border-black/10 text-black/60 hover:border-black/20 hover:text-black hover:bg-slate-50"
                }`}
                style={activeRole === r.key ? { background: PRIMARY } : {}}
              >
                <Icon name={r.icon} className="w-4 h-4" />
                {r.title}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="grid md:grid-cols-[1fr_1.2fr] gap-10 items-start bg-slate-50/50 border border-slate-100 shadow-xs rounded-3xl p-6 sm:p-8 md:p-12">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] font-bold tracking-wider uppercase" style={{ color: PRIMARY_DEEP }}>{activeRoleData.tag}</span>
            <h3 className="font-serif text-3xl font-bold tracking-tight text-slate-900 mt-3 mb-4">{activeRoleData.title}</h3>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base font-normal">{activeRoleData.body}</p>
          </div>
          <div className="flex flex-col gap-3">
            {activeRoleData.points.map((p) => (
              <div key={p} className="flex items-start gap-3 bg-white border border-slate-100/80 shadow-[0_2px_8px_rgba(0,0,0,0.015)] rounded-xl p-4 transition-all duration-300 hover:translate-x-1.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
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
