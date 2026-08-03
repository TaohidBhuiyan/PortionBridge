import React, { useMemo } from "react";
import { Logo } from "../common/Logo";
import { Link } from "react-router-dom";

const PRIMARY = "var(--color-primary, oklch(60.6% 0.25 292.717))";
const PRIMARY_DEEP = "var(--color-primary-deep, oklch(38% 0.19 292.717))";
const PRIMARY_DEEPER = "var(--color-primary-deeper, oklch(22% 0.12 292.717))";

/**
 * FooterMarquee component - Scrolling text marquee in footer
 * @param {string} text - Text to display in marquee
 */
function FooterMarquee({ text }) {
  const items = useMemo(() => Array(6).fill(text), [text]);
  return (
    <div className="relative overflow-hidden py-8 border-b border-white/10">
      {/* Premium Side Fades */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-primary-deeper to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-primary-deeper to-transparent pointer-events-none z-10" />

      <div
        className="flex items-center gap-10 whitespace-nowrap"
        style={{ width: "max-content", animation: "scrollx-ltr-to-rtl 30s linear infinite" }}
      >
        {items.map((t, i) => (
          <span key={i} className="flex items-center gap-10 font-serif font-bold text-2xl md:text-4xl text-white">
            {t}
            <span className="text-lg not-italic" style={{ color: PRIMARY }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Footer component - Main footer with navigation and branding
 * @param {Function} onGoToRole - Callback when role button is clicked
 */
export function Footer({ onGoToRole }) {
  return (
    <footer style={{ background: PRIMARY_DEEPER }} className="text-white">
      <FooterMarquee text="Connecting donors and volunteers so spare food and clothes reach the right zone, every time." />

      <div className="max-w-6xl mx-auto px-6 md:px-10 pt-14 pb-10">
        <div className="grid md:grid-cols-[1.2fr_1fr_1fr] gap-10 pb-10">
          <div>
            <div className="flex items-center gap-2 font-serif text-lg font-medium mb-4">
              <Logo className="w-7 h-7" />
              PortionBridge
            </div>
            <p className="text-sm text-white/60 max-w-xs leading-relaxed mb-5">
              A youth-led platform turning spare meals and clothes into tracked deliveries, zone by zone.
            </p>
          </div>
          <div>
            <div className="font-mono text-[11px] font-semibold tracking-wider text-white/40 mb-4">NAVIGATE</div>
            <div className="flex flex-col gap-2 text-sm text-white/70">
              <Link to="/#roles" className="hover:text-primary-tint transition-all duration-200">Roles</Link>
              <Link to="/#leaderboard" className="hover:text-primary-tint transition-all duration-200">Leaderboard</Link>
            </div>
          </div>
          <div className="md:text-right">
            <div className="font-mono text-[11px] font-semibold tracking-wider text-white/40 mb-4">REACH US</div>
            <div className="flex flex-col gap-2 text-sm text-white/60">
              <span>Wari, Dhaka</span>
              <span>Bangladesh</span>
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-white/15 pt-6 flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-6 text-sm">
            <button onClick={() => onGoToRole("donor")} className="relative text-white font-semibold transition-colors duration-200 hover:text-primary-tint cursor-pointer">
              Donors
              <span className="absolute -bottom-2 left-0 w-1 h-1 rounded-full" style={{ background: PRIMARY }} />
            </button>
            <button onClick={() => onGoToRole("volunteer")} className="text-white/60 hover:text-primary-tint font-medium transition-all duration-200 cursor-pointer">
              Volunteers
            </button>
          </div>
          <button
            onClick={() => onGoToRole("donor")}
            className="inline-flex items-center gap-2 bg-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
            style={{ color: PRIMARY_DEEP }}
          >
            Donate
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3 text-xs text-white/35">
          <span>© 2026 PortionBridge. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
