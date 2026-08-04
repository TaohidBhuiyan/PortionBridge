import { useState, useEffect } from 'react';
import { SkeletonCard } from '../skeletons';
import { Trophy, Medal, ArrowRight } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * LeaderboardWidget component showing current rank and top donors
 */
export function LeaderboardWidget({ currentRank, currentPoints }) {
  const [topDonors, setTopDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopDonors = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`${API_BASE}/leaderboard/donors?limit=3`);
        
        if (response.data?.success) {
          setTopDonors(response.data.data.donors || []);
        } else {
          throw new Error('Failed to fetch leaderboard');
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setTopDonors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopDonors();
  }, []);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Medal size={20} className="text-yellow-500" />;
    if (rank === 2) return <Medal size={20} className="text-gray-400" />;
    if (rank === 3) return <Medal size={20} className="text-orange-400" />;
    return <span className="text-sm font-medium text-gray-500 dark:text-gray-400">#{rank}</span>;
  };

  const getRankBadge = (rank) => {
    const badges = {
      1: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      2: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      3: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return badges[rank] || 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#120721] rounded-xl border border-gray-200 dark:border-purple-950/30 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Leaderboard</h2>
        <SkeletonCard count={3} />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-purple-50 dark:from-purple-950/30 dark:via-orange-950/20 dark:to-purple-950/30 rounded-xl border border-yellow-200 dark:border-purple-950/50 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy size={20} className="text-yellow-500" />
          Leaderboard
        </h2>
        <button className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1">
          View All
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Current User Stats */}
      {currentRank && (
        <div className="bg-white dark:bg-[#120721] rounded-lg p-4 mb-4 border border-purple-200 dark:border-purple-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${getRankBadge(currentRank)} flex items-center justify-center`}>
                {getRankIcon(currentRank)}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your Rank</p>
                <p className="font-semibold text-gray-900 dark:text-white">#{currentRank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Points</p>
              <p className="font-semibold text-gray-900 dark:text-white">{currentPoints || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Donors */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Top Donors</p>
        {topDonors.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No leaderboard data available
          </p>
        ) : (
          topDonors.map((donor, index) => (
            <div
              key={donor.id || index}
              className="flex items-center gap-3 bg-white dark:bg-[#120721] rounded-lg p-3 border border-gray-200 dark:border-purple-950/30"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRankBadge(index + 1)}`}>
                {getRankIcon(index + 1)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {donor.name || 'Anonymous'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {donor.totalDonations || 0} donations
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {donor.points || 0} pts
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
