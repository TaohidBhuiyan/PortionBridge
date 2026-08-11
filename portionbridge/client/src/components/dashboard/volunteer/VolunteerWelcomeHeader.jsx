import { useState, useEffect, useMemo } from 'react';
import { CalendarClock } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const SLOT_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

/**
 * VolunteerWelcomeHeader — volunteer-side equivalent of the donor
 * WelcomeHeader (components/dashboard/donor/WelcomeHeader.jsx). Same
 * gradient card, greeting, and date pattern; the right-hand slot shows
 * the volunteer's availability instead of a leaderboard rank, since
 * volunteers don't have one.
 *
 * Availability is read from GET /profile (data.volunteerProfile.availability),
 * the existing profile endpoint — no new route. Phase 1 confirmed this is a
 * JSON array of time slots (e.g. ["morning", "evening"]), not a boolean, so
 * it's rendered as a small list of slot pills rather than an
 * available/unavailable toggle. If the volunteer hasn't set an availability
 * yet (no volunteer_profiles row, or an empty array), the row is simply
 * omitted — no invented default is shown.
 */
export function VolunteerWelcomeHeader({ user }) {
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
        // Availability is a secondary, decorative detail here — a failed
        // fetch just means the row doesn't render, not a dashboard error.
        console.error('Error fetching volunteer availability:', err);
      }
    };

    fetchAvailability();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = user?.name?.split(' ')[0] || 'Volunteer';
  const userRole = user?.role || 'Volunteer';

  return (
    <div className="bg-gradient-to-r from-dash-primary-soft/50 to-surface rounded-lg border border-border/50 p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left Section - Greeting and User Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-surface/80 flex items-center justify-center text-text-secondary border border-border/50 shrink-0 shadow-sm">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <h1 className="text-base font-semibold text-text-primary mb-0.5">
              {greeting}, <span className="text-dash-primary">{displayName}</span> 👋
            </h1>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-text-secondary">Ready to make an impact today?</span>
              <span className="text-text-secondary opacity-40">•</span>
              <span className="text-text-secondary">{currentDate}</span>
              <span className="text-text-secondary opacity-40">•</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-dash-primary-soft text-dash-primary uppercase tracking-wide">
                {userRole}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section - Availability slots (real data only, no toggle) */}
        {availability && availability.length > 0 && (
          <div className="flex items-center gap-2 bg-surface-hover rounded-md px-2.5 py-1.5 border border-border/50">
            <div className="w-6 h-6 rounded-full bg-dash-primary-soft flex items-center justify-center shrink-0">
              <CalendarClock size={12} className="text-dash-primary" />
            </div>
            <div className="text-left">
              <p className="text-[9px] text-text-secondary font-medium uppercase tracking-wide">Available</p>
              <p className="text-xs font-semibold text-text-primary">
                {availability.map((slot) => SLOT_LABELS[slot] || slot).join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
