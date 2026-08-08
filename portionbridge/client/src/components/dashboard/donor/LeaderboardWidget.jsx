import { useState, useEffect } from 'react';
import { Trophy, Medal, ArrowRight } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * LeaderboardWidget component showing current rank and top donors.
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
    if (rank === 1) return <Medal size={20} className="text-warning" />;
    if (rank === 2) return <Medal size={20} className="text-text-secondary" />;
    if (rank === 3) return <Medal size={20} className="text-dash-primary" />;
    return <span className="text-sm font-medium text-text-secondary">#{rank}</span>;
  };

  const getRankBadge = (rank) => {
    const badges = {
      1: 'bg-warning-soft text-warning',
      2: 'bg-surface-hover text-text-secondary',
      3: 'bg-dash-primary-soft text-dash-primary',
    };
    return badges[rank] || 'bg-success-soft text-success';
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-text-primary mb-4">Leaderboard</h2>
        <div className="space-y-3">
          <div className="h-16 rounded-lg bg-surface-hover animate-pulse" />
          <div className="h-16 rounded-lg bg-surface-hover animate-pulse" />
          <div className="h-16 rounded-lg bg-surface-hover animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Trophy size={16} className="text-warning" />
          Leaderboard
        </h2>
        <button
          onClick={() => (window.location.href = '/#leaderboard')}
          className="text-xs text-dash-primary hover:text-dash-primary-hover font-medium flex items-center gap-1"
        >
          View All
          <ArrowRight size={14} />
        </button>
      </div>

      {currentRank && (
        <div className="bg-surface-hover rounded-lg p-3 mb-4 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full ${getRankBadge(currentRank)} flex items-center justify-center`}>
                {getRankIcon(currentRank)}
              </div>
              <div>
                <p className="text-xs text-text-secondary">Your Rank</p>
                <p className="font-semibold text-text-primary">#{currentRank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-secondary">Points</p>
              <p className="font-semibold text-text-primary">{currentPoints || 0}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium text-text-secondary mb-2">Top Donors</p>
        {topDonors.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-4">No leaderboard data available</p>
        ) : (
          topDonors.map((donor, index) => (
            <div key={donor.id || index} className="flex items-center gap-3 bg-surface-hover rounded-lg p-3 border border-border">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRankBadge(index + 1)}`}>
                {getRankIcon(index + 1)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary truncate">{donor.name || 'Anonymous'}</p>
                <p className="text-xs text-text-secondary">{donor.totalDonations || 0} donations</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-text-primary text-sm">{donor.points || 0} pts</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
