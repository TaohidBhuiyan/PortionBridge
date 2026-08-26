import { useState, useEffect } from 'react';
import { Award, Loader2, Sparkles } from 'lucide-react';
import { achievementApi } from '../../services/achievementApi';
import { AchievementBadge } from './AchievementBadge';

/**
 * AchievementsPanel - Displays user's achievements with summary
 */
export function AchievementsPanel({ userId }) {
  const [achievements, setAchievements] = useState([]);
  const [summary, setSummary] = useState({ totalPoints: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
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
  };

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
      <div className="bg-surface rounded-lg border border-border/50 p-4">
        <div className="flex items-center justify-center gap-2 text-text-secondary">
          <Loader2 size={16} className="animate-spin" />
          <p className="text-xs">Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-lg border border-border/50 p-4">
        <div className="flex items-center gap-2 text-danger">
          <Award size={16} />
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
          <Award size={14} className="text-dash-primary" />
          Achievements
        </h3>
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1 text-text-secondary">
            <Sparkles size={12} className="text-warning" />
            <span className="font-medium text-text-primary">{summary.totalPoints}</span>
            <span>Points</span>
          </div>
          <div className="flex items-center gap-1 text-text-secondary">
            <Award size={12} className="text-dash-primary" />
            <span className="font-medium text-text-primary">{summary.totalCount}</span>
            <span>Badges</span>
          </div>
        </div>
      </div>

      {achievements.length === 0 ? (
        <div className="text-center py-4">
          <Award size={32} className="text-text-secondary opacity-50 mx-auto mb-2" />
          <p className="text-xs text-text-secondary">No achievements yet</p>
          <p className="text-[10px] text-text-secondary opacity-70 mt-1">
            Complete donations to unlock badges!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="relative">
              <AchievementBadge achievement={achievement} />
              <p className="text-[10px] text-text-secondary mt-1 ml-12">
                Unlocked {formatDate(achievement.unlocked_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
