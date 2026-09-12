import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard } from '../skeletons';
import { Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { Avatar } from '../../common/Avatar';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * LeaderboardWidget — Donor Community Ranks
 * Displays top donors with podium medals (Gold, Silver, Bronze) and current user ranking.
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
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE}/leaderboard/donors?limit=5`, {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

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

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-xs font-bold text-xs">
          🥇
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-slate-400 to-slate-300 text-slate-900 flex items-center justify-center shadow-xs font-bold text-xs">
          🥈
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-700 to-amber-600 text-white flex items-center justify-center shadow-xs font-bold text-xs">
          🥉
        </div>
      );
    }
    return (
      <span className="w-6 text-center text-xs font-bold text-text-secondary">
        #{rank}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-3xl border border-border/50 p-5 shadow-pb-card h-full flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-28 bg-border/40 rounded-md animate-pulse" />
          <div className="h-4 w-14 bg-border/30 rounded-md animate-pulse" />
        </div>
        <div className="space-y-2">
          <SkeletonCard count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-3xl border border-border/50 p-5 sm:p-6 shadow-pb-card h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Trophy size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Leaderboard</h3>
              <p className="text-xs text-text-secondary">Top Community Donors</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/donor/leaderboard')}
            className="text-sm font-medium text-dash-primary hover:text-dash-primary-hover transition-colors"
          >
            View All
          </button>
        </div>

        {/* Current User Callout if ranked */}
        {currentUserEntry && (
          <div className="mb-3.5 p-3 rounded-2xl bg-gradient-to-r from-dash-primary-soft to-surface border border-dash-primary/30 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-dash-primary text-white flex items-center justify-center text-xs font-bold">
                #{currentUserRank}
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary flex items-center gap-1">
                  <span>Your Ranking</span>
                  <Sparkles size={11} className="text-amber-500" />
                </p>
                <p className="text-[11px] text-text-secondary">Outstanding support</p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-dash-primary">
              {currentUserEntry.points || 0} pts
            </span>
          </div>
        )}

        {/* List of top donors */}
        {topDonors.length === 0 ? (
          <div className="text-center py-6 text-text-secondary text-xs">
            No leaderboard data yet.
          </div>
        ) : (
          <div className="space-y-2">
            {topDonors.slice(0, 4).map((donor, index) => {
              const isSelf = donor.id === user?.id;
              return (
                <div
                  key={donor.id || index}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isSelf
                      ? 'bg-dash-primary-soft/50 border-dash-primary/30'
                      : 'bg-surface hover:bg-surface-hover border-border/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {getRankBadge(index + 1)}
                    <Avatar
                      name={donor.name || 'Donor'}
                      src={donor.photo || donor.profile_picture}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">
                        {donor.name || 'Anonymous Donor'} {isSelf && <span className="text-[10px] text-dash-primary font-semibold">(You)</span>}
                      </p>
                      <p className="text-[10px] text-text-secondary">
                        {donor.donationsCount || donor.totalDonations || 0} donations
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-text-primary shrink-0">
                    {donor.points || 0} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-border/40 text-center">
        <p className="text-[11px] text-text-secondary">
          Donations earn +50 impact points each
        </p>
      </div>
    </div>
  );
}