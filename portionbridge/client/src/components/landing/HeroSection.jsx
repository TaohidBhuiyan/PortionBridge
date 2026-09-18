import { useEffect, useRef } from "react";
import { Reveal } from "../common/Reveal";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Icon } from "../common/Icon";

const PRIMARY = "var(--color-primary, #6d45bd)";
const PRIMARY_DEEPER = "var(--color-primary-deeper, #35206f)";

function HeroVisual() {
  const visualRef = useRef(null);

  useEffect(() => {
    const visual = visualRef.current;
    if (!visual || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const render = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      visual.style.setProperty("--tilt-x", `${currentY}deg`);
      visual.style.setProperty("--tilt-y", `${currentX}deg`);
      frame = requestAnimationFrame(render);
    };

    const handleMove = (event) => {
      const rect = visual.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 5;
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * -5;
    };
    const reset = () => { targetX = 0; targetY = 0; };

    visual.addEventListener("pointermove", handleMove);
    visual.addEventListener("pointerleave", reset);
    frame = requestAnimationFrame(render);
    return () => {
      visual.removeEventListener("pointermove", handleMove);
      visual.removeEventListener("pointerleave", reset);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={visualRef} className="hero-visual relative mx-auto mt-8 w-full max-w-[520px] lg:mt-20" aria-label="Donation coordination dashboard preview">
      <div className="hero-visual-orbit absolute -inset-5 rounded-[2.5rem] border border-white/65" />
      <div className="hero-visual-orbit hero-visual-orbit-delayed absolute -inset-10 rounded-[3rem] border border-[#6d45bd]/10" />

      <div className="glass-panel relative rounded-[2rem] p-3">
        <div className="flex items-center justify-between rounded-2xl bg-[#35206f] px-4 py-3 text-white shadow-lg shadow-[#35206f]/20">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
              <Icon name="food" className="h-4 w-4" />
            </span>
            <div className="text-left">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">PortionBridge</div>
              <div className="text-sm font-semibold">Impact overview</div>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_#6ee7b7]" /> Live
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 p-2 pt-5 text-left sm:gap-4 sm:p-5">
          <div className="col-span-2 flex items-center justify-between rounded-2xl bg-[#f6effb] p-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6d45bd]/65">Your next handover</div>
              <div className="mt-1 text-lg font-bold text-[#35206f]">Food essentials</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-[#35206f]/55">
                <Icon name="pin" className="h-3.5 w-3.5" /> Zone pickup in progress
              </div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Icon name="arrow" className="h-6 w-6 text-[#6d45bd]" />
            </div>
          </div>

          <div className="rounded-2xl border border-[#6d45bd]/10 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#35206f]/50">Progress</span>
              <Icon name="bolt" className="h-4 w-4 text-[#6d45bd]" />
            </div>
            <div className="text-2xl font-bold text-[#35206f]">84%</div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eee5f6]">
              <div className="hero-progress h-full w-[84%] rounded-full bg-gradient-to-r from-[#6d45bd] to-[#b88de0]" />
            </div>
          </div>

          <div className="rounded-2xl border border-[#6d45bd]/10 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#35206f]/50">Connection</span>
              <Icon name="volunteer" className="h-4 w-4 text-[#6d45bd]" />
            </div>
            <div className="text-sm font-bold text-[#35206f]">Volunteer matched</div>
            <div className="mt-3 flex -space-x-2">
              {['A', 'R', 'S'].map((initial, index) => (
                <span key={initial} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white" style={{ background: ['#6d45bd', '#b88de0', '#35206f'][index] }}>
                  {initial}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-floating-note absolute -right-5 top-24 hidden items-center gap-2 rounded-2xl border border-white/80 bg-white/90 px-3 py-2.5 text-left shadow-xl shadow-[#35206f]/10 backdrop-blur-md lg:flex">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Icon name="check" className="h-4 w-4" /></span>
          <span><strong className="block text-xs text-[#35206f]">Pickup confirmed</strong><small className="text-[10px] text-[#35206f]/50">A moment ago</small></span>
        </div>
        <div className="hero-floating-note hero-floating-note-delayed absolute -left-7 bottom-12 hidden items-center gap-2 rounded-2xl border border-white/80 bg-white/90 px-3 py-2.5 text-left shadow-xl shadow-[#35206f]/10 backdrop-blur-md lg:flex">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f6effb] text-[#6d45bd]"><Icon name="shirt" className="h-4 w-4" /></span>
          <span><strong className="block text-xs text-[#35206f]">More than a donation</strong><small className="text-[10px] text-[#35206f]/50">A bridge to someone</small></span>
        </div>
      </div>
    </div>
  );
}

/**
 * HeroSection component - Main landing page hero with CTA buttons
 * @param {Object} stats - Statistics object with volunteer count
 * @param {boolean} loading - Whether stats are loading
 */
export function HeroSection({ stats, loading }) {
  const { isAuthenticated, user } = useAuth();
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const handleMove = (event) => {
      const bounds = section.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 100;
      const y = ((event.clientY - bounds.top) / bounds.height) * 100;
      section.style.setProperty("--cursor-x", `${x}%`);
      section.style.setProperty("--cursor-y", `${y}%`);
    };
    section.addEventListener("pointermove", handleMove);
    return () => section.removeEventListener("pointermove", handleMove);
  }, []);
  // AUDIT FIX: this previously fell back to a hardcoded "312" whenever the
  // real /public/stats value was falsy (including a legitimate 0, or a
  // failed fetch) — fabricating a live "active right now" count. Now only
  // ever shows a real number from the API; if there isn't one yet, the
  // badge falls back to generic copy with no invented number at all.
  const volunteerCount = stats?.verifiedVolunteers;
  const hasVolunteerCount = !loading && typeof volunteerCount === 'number' && volunteerCount > 0;

  const getDonatePath = () => {
    if (isAuthenticated) {
      // AUDIT FIX: removed a dead 'leader' case — users.role is only ever
      // donor/volunteer/admin (see schema).
      switch (user?.role) {
        case 'donor': return '/donor/dashboard';
        case 'volunteer': return '/volunteer/dashboard';
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
        case 'admin': return '/admin/dashboard';
        default: return '/#roles';
      }
    }
    return '/register';
  };

  return (
    <section ref={sectionRef} id="top" className="hero-section relative pt-24 pb-0 overflow-hidden" style={{ background: "linear-gradient(135deg, #f1e5f8 0%, #f8effb 47%, #efe8fa 100%)" }}>
      {/* Soft editorial lighting keeps the hero bright while adding depth. */}
      <div
        className="absolute -top-36 right-[8%] w-[440px] h-[300px] rounded-full blur-3xl opacity-40"
        style={{ background: "#e8c6ed", animation: "float 9s ease-in-out infinite" }}
      />
      <div
        className="absolute top-48 -left-20 w-72 h-72 rounded-full blur-3xl opacity-25"
        style={{ background: "#d9c8f1", animation: "float 7s ease-in-out infinite reverse" }}
      />

      {/* Faint dot-grid texture, fading toward the edges — static, so it reads as texture not noise */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(73,42,123,0.45) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 75%)",
        }}
      />

      <div className="hero-content-grid relative mx-auto grid max-w-6xl items-start gap-10 px-6 pb-24 md:px-10 lg:gap-16 lg:pb-28" style={{ width: '100%' }}>
        <div className="hero-content-copy relative z-10 text-center lg:text-left">
        <Reveal immediate>
          <div className="inline-flex w-fit items-center gap-2 font-mono text-[10px] font-semibold tracking-wider uppercase border border-[#6d45bd]/15 rounded-full px-4 py-1.5 mb-7 bg-white/45 backdrop-blur-xs transition-colors hover:border-[#6d45bd]/30 cursor-default select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            {hasVolunteerCount ? `${volunteerCount} volunteers active right now` : 'A better way to move surplus forward'}
          </div>
        </Reveal>
        <Reveal immediate delay={80}>
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl leading-[1.02] tracking-tight lg:max-w-[650px]" style={{ width: '100%' }}>
            Turn extra into
            <br />
            <span className="relative inline-block">
              <span
                className="relative italic bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${PRIMARY_DEEPER}, ${PRIMARY}, ${PRIMARY_DEEPER})`,
                  backgroundSize: "200% auto",
                  animation: "shimmerSweep 4s linear infinite",
                }}
              >
                One tap
              </span>
              <svg
                viewBox="0 0 200 16"
                className="absolute -bottom-2 left-0 w-full h-3"
                preserveAspectRatio="none"
                style={{ animation: "float 5s ease-in-out infinite" }}
              >
                <path d="M2 10 Q 50 2 100 8 T 198 6" fill="none" stroke={PRIMARY} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
              </svg>
            </span>
            {" "}to the right hands.
          </h1>
        </Reveal>
        <Reveal immediate delay={160}>
          <p className="mt-8 text-[#35206f]/65 text-base md:text-lg leading-relaxed font-normal lg:max-w-[560px]" style={{ width: '100%' }}>
            PortionBridge connects donors with verified volunteers — so every
            meal and every shirt reaches its zone, tracked from pledge to
            delivery.
          </p>
        </Reveal>
        <Reveal immediate delay={240}>
          <div className="w-full mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <Link
              to={getDonatePath()}
              className="group relative overflow-hidden font-semibold px-6 py-3 rounded-xl text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${PRIMARY_DEEPER}, ${PRIMARY})`, animation: "pulseGlow 2.4s ease-in-out infinite" }}
            >
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)", backgroundSize: "220% 220%", animation: "shimmerSweep 1.6s ease-in-out infinite" }}
              />
              <span className="relative inline-flex items-center gap-2">
                {isAuthenticated ? 'Go to Dashboard' : 'Donate food or clothes'}
                <svg viewBox="0 0 24 24" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
            <Link
              to={getVolunteerPath()}
              className="group relative font-semibold px-6 py-3 rounded-xl border border-[#35206f]/20 text-[#35206f] hover:bg-white/55 hover:border-[#35206f]/40 active:scale-95 transition-all duration-300 cursor-pointer inline-flex items-center gap-2"
            >
              {isAuthenticated && user?.role === 'volunteer' ? 'Go to Dashboard' : 'Join as a volunteer'}
              <svg viewBox="0 0 24 24" className="w-4 h-4 transition-transform duration-300 group-hover:rotate-45" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M7 7h10v10" />
              </svg>
            </Link>
          </div>
        </Reveal>
        </div>
        <HeroVisual />
      </div>

      {/* Scroll cue — nudges the visitor toward the rest of the page */}
      <Reveal immediate delay={420}>
        <a
          href="#roles"
          aria-label="Scroll to learn more"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-[#35206f]/40 hover:text-[#35206f]/70 transition-colors duration-300"
        >
          <span className="font-mono text-[10px] tracking-widest uppercase">Scroll</span>
          <svg viewBox="0 0 24 24" className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </a>
      </Reveal>
    </section>
  );
}
