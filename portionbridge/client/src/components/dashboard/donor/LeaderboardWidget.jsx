import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard } from '../skeletons';
import { Trophy, Medal } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { Avatar } from '../../common/Avatar';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const RANK_TONE = {
  1: 'bg-warning-soft text-warning',
  2: 'bg-surface-hover text-text-secondary',
  3: 'bg-warning-soft text-warning',
};

/**
 * LeaderboardWidget — shows the top donors and, if the current donor appears
 * in the fetched list, their real rank. If they don't appear in the fetched
 * page, "Your Rank" is simply not shown rather than guessed.
 */
export function LeaderboardWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topDonors, setTopDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopDonors = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`${API_BASE}/leaderboard/donors?limit=5`);

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

  const currentUserIndex = topDonors.findIndex((d) => d.id === user?.id);
  const currentUserEntry = currentUserIndex >= 0 ? topDonors[currentUserIndex] : null;
  const currentUserRank = currentUserIndex >= 0 ? currentUserIndex + 1 : null;

  const getRankIcon = (rank) => {
    if (rank <= 3) return <Medal size={16} />;
    return <span className="text-xs font-semibold">#{rank}</span>;
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-text-primary mb-4">Leaderboard</h2>
        <SkeletonCard count={3} />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-1.5">
          <Trophy size={16} className="text-warning" />
          Leaderboard
        </h2>
        <button
          onClick={() => navigate('/#leaderboard')}
          className="text-xs text-dash-primary hover:text-dash-primary-hover font-medium focus:outline-none focus-visible:underline"
        >
          View All
        </button>
      </div>

      {/* Current User Stats — only rendered when real data places them in the list */}
      {currentUserEntry && (
        <div className="flex items-center justify-between bg-dash-primary-soft rounded-lg p-2.5 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${RANK_TONE[currentUserRank] || 'bg-surface text-text-secondary'}`}>
              {getRankIcon(currentUserRank)}
            </div>
            <div>
              <p className="text-xs text-text-secondary">Your Rank</p>
              <p className="text-sm font-semibold text-dash-primary">#{currentUserRank}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-secondary">Points</p>
            <p className="text-sm font-semibold text-text-primary">{currentUserEntry.points || 0}</p>
          </div>
        </div>
      )}

      {/* Top Donors */}
      <div className="space-y-1.5">
        {topDonors.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-4">
            No leaderboard data available
          </p>
        ) : (
          topDonors.map((donor, index) => {
            const rank = index + 1;
            const isCurrentUser = donor.id === user?.id;
            return (
              <div
                key={donor.id || index}
                className={`flex items-center gap-2.5 rounded-lg p-2 ${isCurrentUser ? 'bg-dash-primary-soft' : ''}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${RANK_TONE[rank] || 'bg-page text-text-secondary'}`}>
                  {getRankIcon(rank)}
                </div>
                <Avatar item={donor} tone="dash" className="w-7 h-7 text-xs" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${isCurrentUser ? 'font-semibold text-dash-primary' : 'font-medium text-text-primary'}`}>
                    {donor.name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {donor.totalDonations || 0} donations
                  </p>
                </div>
                <p className="text-sm font-semibold text-text-primary shrink-0">
                  {donor.points || 0} pts
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}