import React from "react";
import { Logo } from "../common/Logo";
import { Icon } from "../common/Icon";
import { Reveal } from "../common/Reveal";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PRIMARY = "var(--color-primary, oklch(60.6% 0.25 292.717))";
const PRIMARY_DEEP = "var(--color-primary-deep, oklch(38% 0.19 292.717))";
const PRIMARY_DEEPER = "var(--color-primary-deeper, oklch(22% 0.12 292.717))";

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
 * HeroSection component - Main landing page hero with CTA buttons
 * @param {Function} onGoToRole - Callback when role button is clicked
 * @param {Object} stats - Statistics object with volunteer count
 * @param {boolean} loading - Whether stats are loading
 */
export function HeroSection({ onGoToRole, stats, loading }) {
  const { isAuthenticated, user } = useAuth();
  const volunteerCount = stats?.verifiedVolunteers || (loading ? 0 : 312);

  const getDonatePath = () => {
    if (isAuthenticated) {
      switch (user?.role) {
        case 'donor': return '/donor/dashboard';
        case 'volunteer': return '/volunteer/dashboard';
        case 'leader': return '/leader/dashboard';
        case 'admin': return '/admin/dashboard';
        default: return '/login';
      }
    }
    return '/register';
  };

  const getVolunteerPath = () => {
    if (isAuthenticated) {
      switch (user?.role) {
        case 'volunteer': return '/volunteer/dashboard';
        case 'donor': return '/#roles';
        case 'leader': return '/leader/dashboard';
        case 'admin': return '/admin/dashboard';
        default: return '/#roles';
      }
    }
    return '/register';
  };

  return (
    <section id="top" className="relative pt-32 pb-24 overflow-hidden" style={{ background: PRIMARY_DEEPER }}>
      <div
        className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full blur-3xl opacity-40"
        style={{ background: PRIMARY, animation: "float 9s ease-in-out infinite" }}
      />
      <div
        className="absolute top-40 -left-20 w-72 h-72 rounded-full blur-3xl opacity-25"
        style={{ background: PRIMARY, animation: "float 7s ease-in-out infinite reverse" }}
      />

      <div className="relative max-w-6xl mx-auto px-6 md:px-10 text-white">
        <Reveal>
          <div className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-wider uppercase border border-white/15 rounded-full px-4.5 py-1.5 mb-8 bg-white/5 backdrop-blur-xs transition-colors hover:border-white/25 cursor-default select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            {volunteerCount} volunteers active right now
          </div>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl leading-[1.02] max-w-3xl tracking-tight">
            Spare food. Spare clothes.
            <br />
            <span className="italic" style={{ color: PRIMARY }}>One tap</span> to the right hands.
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-8 max-w-xl text-white/80 text-base md:text-lg leading-relaxed font-normal">
            PortionBridge connects donors with verified volunteers — so every
            meal and every shirt reaches its zone, tracked from pledge to
            delivery.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link 
              to={getDonatePath()}
              className="font-semibold px-8 py-4 rounded-full text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 cursor-pointer" 
              style={{ background: PRIMARY, animation: "pulseGlow 2.4s ease-in-out infinite" }}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Donate food or clothes'}
            </Link>
            <Link 
              to={getVolunteerPath()}
              className="font-semibold px-8 py-4 rounded-full border border-white/20 text-white hover:bg-white/10 hover:border-white/40 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              {isAuthenticated && user?.role === 'volunteer' ? 'Go to Dashboard' : 'Join as a volunteer'}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
