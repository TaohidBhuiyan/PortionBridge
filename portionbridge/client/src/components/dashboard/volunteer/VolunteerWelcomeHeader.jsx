import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, ShieldCheck, Sparkles, Trophy, HelpCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const SLOT_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

export function VolunteerWelcomeHeader({ user }) {
  const navigate = useNavigate();
  const [availability, setAvailability] = useState(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const currentDate = useMemo(() => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchAvailability = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (isMounted && response.data?.success) {
          const slots = response.data.data?.volunteerProfile?.availability;
          setAvailability(Array.isArray(slots) ? slots : null);
        }
      } catch (err) {
        console.error('Error fetching volunteer availability:', err);
      }
    };

    fetchAvailability();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = user?.name?.split(' ')[0] || 'Volunteer';
  const fullName = user?.name || 'Volunteer Hero';

  return (
    <div className="relative overflow-hidden rounded-2xl pb-volunteer-hero p-5 sm:p-6 transition-all duration-300">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-dash-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left Section - Hero User Info */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-emerald-500 p-0.5 shadow-md">
              <div className="w-full h-full rounded-[14px] bg-surface flex items-center justify-center font-bold text-xl text-dash-primary">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-surface"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-dash-primary-soft text-dash-primary border border-dash-primary/20">
                <Sparkles size={12} className="animate-spin-slow" /> {greeting}
              </span>
              <span className="text-xs font-medium text-text-secondary flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-500" /> Verified Hero
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-dash-primary via-indigo-500 to-emerald-500 bg-clip-text text-transparent">{fullName}</span> 👋
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              {currentDate} &middot; Ready to rescue food & serve communities today?
            </p>
          </div>
        </div>

        {/* Right Section - Availability Slots Card & Quick Page Navigation */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {availability && availability.length > 0 && (
            <div className="pb-glass-card rounded-xl p-3 sm:px-4 sm:py-3 flex items-center gap-3 border border-border/80 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dash-primary/10 to-indigo-500/10 flex items-center justify-center text-dash-primary shrink-0">
                <CalendarClock size={20} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Active Availability</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {availability.map((slot) => (
                    <span
                      key={slot}
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    >
                      {SLOT_LABELS[slot] || slot}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/volunteer/leaderboard')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20 hover:bg-amber-500/20 transition-colors shadow-sm"
              title="Volunteer Leaderboard"
            >
              <Trophy size={14} /> Leaderboard
            </button>
            <button
              onClick={() => navigate('/volunteer/help')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-500/20 hover:bg-purple-500/20 transition-colors shadow-sm"
              title="Volunteer Help Center"
            >
              <HelpCircle size={14} /> Help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
