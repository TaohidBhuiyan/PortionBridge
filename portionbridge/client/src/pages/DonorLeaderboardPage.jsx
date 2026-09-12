import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard';
import leaderboardApi from '../services/leaderboardApi';

const PAGE_SIZE = 10;

/**
 * DonorLeaderboardPage - Public leaderboard showing top donors
 * Displays paginated list with badges for top 3 ranks
 */
export function DonorLeaderboardPage() {
  const navigate = useNavigate();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [page]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await leaderboardApi.getTopDonors({ page, limit: PAGE_SIZE });
      if (response.success) {
        setDonors(response.data?.donors || []);
        setMeta(response.meta || null);
      } else {
        setError(response.message || 'Failed to load leaderboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-700" />;
    return <span className="text-lg font-bold text-text-muted">#{rank}</span>;
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/donor/dashboard')}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-dash-primary" />
              Donor Leaderboard
            </h1>
            <p className="text-text-secondary mt-1 text-sm">
              Top donors making the biggest impact in our community
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dash-primary mx-auto"></div>
              <p className="mt-4 text-text-secondary">Loading leaderboard...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-danger">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="mt-4 px-4 py-2 bg-dash-primary text-white rounded-lg hover:bg-dash-primary-hover"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            {donors.length === 0 ? (
              <div className="text-center py-16 px-6">
                <Trophy className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary">No leaderboard data yet.</p>
                <p className="text-sm text-text-muted mt-1">Complete a donation to start earning impact points.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {donors.map((donor, index) => {
                  const rank = (page - 1) * PAGE_SIZE + index + 1;
                  const initial = (donor.name || '?').charAt(0).toUpperCase();
                  return (
                    <div
                      key={donor.id || rank}
                      className="flex items-center gap-4 p-4 hover:bg-surface-hover transition-colors"
                    >
                      <div className="flex items-center justify-center w-12 h-12 shrink-0">
                        {getRankBadge(rank)}
                      </div>

                      <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-hover shrink-0">
                        {donor.photo ? (
                          <img
                            src={donor.photo}
                            alt={donor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-dash-primary-soft text-dash-primary font-semibold text-lg">
                            {initial}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-text-primary truncate">{donor.name || 'Anonymous Donor'}</h3>
                        <p className="text-sm text-text-secondary">
                          {donor.donationsCount || 0} donation{(donor.donationsCount || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-dash-primary">{donor.points || 0}</div>
                        <div className="text-xs text-text-muted">points</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-text-secondary">
                  Page {page} of {meta.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
