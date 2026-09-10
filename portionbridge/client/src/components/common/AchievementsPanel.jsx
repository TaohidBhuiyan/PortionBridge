import { useState, useEffect, useCallback } from 'react';
import { Award, Loader2, Sparkles } from 'lucide-react';
import { achievementApi } from '../../services/achievementApi';
import { AchievementBadge } from './AchievementBadge';

/**
 * AchievementsPanel - Displays user's achievements with summary
 */
export function AchievementsPanel() {
  const [achievements, setAchievements] = useState([]);
  const [summary, setSummary] = useState({ totalPoints: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAchievements = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await achievementApi.getUserAchievements();
      
      if (result.success) {
        setAchievements(result.data.achievements || []);
        setSummary(result.data.summary || { totalPoints: 0, totalCount: 0 });
      } else {
        setError(result.error || 'Failed to load achievements');
      }
    } catch {
      setError('Failed to load achievements. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Standard fetch-on-mount pattern used throughout this codebase.
    // loadAchievements' internal setState calls are needed on refetch
    // (not just first mount), so they can't be removed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAchievements();
  }, [loadAchievements]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-3xl border border-border/50 p-5 shadow-pb-card h-full flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-28 bg-border/40 rounded-md animate-pulse" />
          <div className="h-4 w-14 bg-border/30 rounded-md animate-pulse" />
        </div>
        <div className="flex items-center justify-center gap-2 text-text-secondary py-6">
          <Loader2 size={16} className="animate-spin text-dash-primary" />
          <p className="text-xs">Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-3xl border border-border/50 p-5 shadow-pb-card h-full flex flex-col justify-between">
        <div className="flex items-center gap-2 text-danger py-6">
          <Award size={16} />
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-3xl border border-border/50 p-5 sm:p-6 shadow-pb-card h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-dash-primary-soft flex items-center justify-center text-dash-primary">
              <Award size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Achievements</h3>
              <p className="text-xs text-text-secondary">Earned Medals & Badges</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
              <Sparkles size={11} />
              {summary.totalPoints} pts
            </span>
          </div>
        </div>

        {achievements.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-2xl bg-surface-hover flex items-center justify-center mx-auto mb-2 text-dash-primary">
              <Award size={24} className="opacity-60" />
            </div>
            <p className="text-xs font-bold text-text-primary">No badges unlocked yet</p>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Complete your first donation to earn the Community Pioneer badge!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="relative p-2 rounded-xl bg-surface hover:bg-surface-hover border border-border/40 transition-colors">
                <AchievementBadge achievement={achievement} />
                <p className="text-[10px] text-text-secondary mt-1 ml-11">
                  Unlocked {formatDate(achievement.unlocked_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-border/40 text-center">
        <p className="text-[11px] text-text-secondary">
          {summary.totalCount} badges unlocked
        </p>
      </div>
    </div>
  );
}
