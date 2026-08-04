import { useMemo } from 'react';
import { Avatar } from '../../common/Avatar';
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

  const randomMessage = useMemo(() => {
    // Use day of month to make it deterministic but still varies daily
    const dayOfMonth = new Date().getDate();
    return motivationalMessages[dayOfMonth % motivationalMessages.length];
  }, []);

  return (
    <div className="bg-gradient-to-r from-purple-50 via-purple-100/50 to-purple-50 dark:from-purple-950/30 dark:via-purple-900/20 dark:to-purple-950/30 rounded-2xl p-6 md:p-8 mb-6 border border-purple-200 dark:border-purple-950/50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Section - Greeting and User Info */}
        <div className="flex items-center gap-4">
          <Avatar item={user} className="w-16 h-16 text-xl" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {greeting}, {user?.name?.split(' ')[0] || 'Donor'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base mb-2">
              {randomMessage}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-gray-500 dark:text-gray-400">{currentDate}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 capitalize">
                {user?.role || 'Donor'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section - Leaderboard Rank */}
        {leaderboardRank && (
          <div className="flex items-center gap-3 bg-white dark:bg-[#120721] rounded-xl px-4 py-3 shadow-sm border border-purple-200 dark:border-purple-950/30">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Trophy size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Your Rank</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                #{leaderboardRank}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
