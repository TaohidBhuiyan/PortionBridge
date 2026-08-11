import { useMemo } from 'react';
import { Trophy } from 'lucide-react';

const motivationalMessages = [
  "Your generosity is making a real difference in people's lives.",
  "Every donation counts towards building a better community.",
  "Thank you for being a champion of change.",
  "Your kindness is inspiring others to give back.",
  "Together, we're bridging abundance with those in need.",
];

/**
 * WelcomeHeader component with greeting, user info, date, and leaderboard rank
 * Redesigned for compact, professional appearance
 */
export function WelcomeHeader({ user, leaderboardRank }) {
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

  // Fallback user data if user is not provided
  const displayName = user?.name?.split(' ')[0] || 'Donor';
  const userRole = user?.role || 'Donor';

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
              <span className="text-text-secondary">{currentDate}</span>
              <span className="text-text-secondary opacity-40">•</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-dash-primary-soft text-dash-primary uppercase tracking-wide">
                {userRole}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section - Leaderboard Rank */}
        {leaderboardRank && (
          <div className="flex items-center gap-2 bg-surface-hover rounded-md px-2.5 py-1.5 border border-border/50">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Trophy size={12} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-[9px] text-text-secondary font-medium uppercase tracking-wide">Rank</p>
              <p className="text-xs font-bold text-text-primary">
                #{leaderboardRank}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
