import React from "react";
import { Icon } from "../common/Icon";
import { Reveal } from "../common/Reveal";

const PRIMARY = "oklch(60.6% 0.25 292.717)";
const PRIMARY_DEEP = "oklch(38% 0.19 292.717)";
const PRIMARY_TINT = "oklch(94% 0.03 292.717)";

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
 * @param {string} activeRole - Currently selected role
 * @param {Function} onSetActiveRole - Callback to change active role
 */
export function RoleSection({ activeRole, onSetActiveRole }) {
  const activeRoleData = ROLES.find((r) => r.key === activeRole);

  return (
    <section id="roles" className="py-24 md:py-28">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <Reveal>
          <div className="font-mono text-xs mb-4" style={{ color: PRIMARY_DEEP }}>HOW IT WORKS</div>
          <h2 className="font-serif text-4xl md:text-5xl max-w-xl">Two roles, one bridge.</h2>
        </Reveal>

        <Reveal delay={80}>
          <div className="flex gap-2 mt-10 mb-8 flex-wrap">
            {ROLES.map((r) => (
              <button
                key={r.key}
                onClick={() => onSetActiveRole(r.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border transition-all ${
                  activeRole === r.key ? "text-white border-transparent" : "border-black/10 text-black/60 hover:border-black/30"
                }`}
                style={activeRole === r.key ? { background: PRIMARY } : {}}
              >
                <Icon name={r.icon} className="w-4 h-4" />
                {r.title}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="grid md:grid-cols-[1fr_1.2fr] gap-10 items-start bg-gray-50 rounded-3xl p-8 md:p-12">
          <div>
            <span className="font-mono text-[10px]" style={{ color: PRIMARY_DEEP }}>{activeRoleData.tag}</span>
            <h3 className="font-serif text-3xl italic mt-3 mb-4">{activeRoleData.title}</h3>
            <p className="text-black/65 leading-relaxed">{activeRoleData.body}</p>
          </div>
          <div className="flex flex-col gap-3">
            {activeRoleData.points.map((p, i) => (
              <div key={p} className="flex items-start gap-3 bg-white rounded-xl p-4 transition-transform hover:translate-x-1">
                <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: PRIMARY_TINT, color: PRIMARY_DEEP }}>
                  <Icon name="check" className="w-3.5 h-3.5" />
                </span>
                <span className="text-sm pt-1">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
