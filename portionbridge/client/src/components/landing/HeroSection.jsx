import { Reveal } from "../common/Reveal";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PRIMARY = "var(--color-primary, oklch(60.6% 0.25 292.717))";
const PRIMARY_DEEPER = "var(--color-primary-deeper, oklch(22% 0.12 292.717))";

/**
 * HeroSection component - Main landing page hero with CTA buttons
 * @param {Object} stats - Statistics object with volunteer count
 * @param {boolean} loading - Whether stats are loading
 */
export function HeroSection({ stats, loading }) {
  const { isAuthenticated, user } = useAuth();
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
    <section id="top" className="relative pt-32 pb-24 overflow-hidden" style={{ background: PRIMARY_DEEPER }}>
      <div
        className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full blur-3xl opacity-40"
        style={{ background: PRIMARY, animation: "float 9s ease-in-out infinite" }}
      />
      <div
        className="absolute top-40 -left-20 w-72 h-72 rounded-full blur-3xl opacity-25"
        style={{ background: PRIMARY, animation: "float 7s ease-in-out infinite reverse" }}
      />

      <div className="relative mx-auto px-6 md:px-10 text-left text-white" style={{ width: '100%', maxWidth: '1152px' }}>
        <Reveal>
          <div className="inline-flex w-fit items-center gap-2 font-mono text-[11px] font-semibold tracking-wider uppercase border border-white/15 rounded-full px-4.5 py-1.5 mb-8 bg-white/5 backdrop-blur-xs transition-colors hover:border-white/25 cursor-default select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            {hasVolunteerCount ? `${volunteerCount} volunteers active right now` : 'Volunteers ready to help right now'}
          </div>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl leading-[1.02] tracking-tight" style={{ width: '100%', maxWidth: '850px' }}>
            Spare food. Spare clothes.
            <br />
            <span className="italic" style={{ color: PRIMARY }}>One tap</span> to the right hands.
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-8 text-white/80 text-base md:text-lg leading-relaxed font-normal" style={{ width: '100%', maxWidth: '620px' }}>
            PortionBridge connects donors with verified volunteers — so every
            meal and every shirt reaches its zone, tracked from pledge to
            delivery.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="w-full mt-10 flex flex-wrap items-center gap-4">
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
