import { useState, useEffect } from 'react';
import { Award, Loader2, Sparkles } from 'lucide-react';
import { achievementApi } from '../../services/achievementApi';
import { AchievementBadge } from './AchievementBadge';

/**
 * AchievementsPanel - Displays user's achievements with summary
 */
export function AchievementsPanel({ userId, userRole }) {
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
    } catch (err) {
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
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <p>Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <Award size={20} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Award size={20} className="text-purple-500" />
          Achievements
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Sparkles size={16} className="text-yellow-500" />
            <span className="font-medium text-gray-900 dark:text-white">{summary.totalPoints}</span>
            <span>Points</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Award size={16} className="text-purple-500" />
            <span className="font-medium text-gray-900 dark:text-white">{summary.totalCount}</span>
            <span>Badges</span>
          </div>
        </div>
      </div>

      {achievements.length === 0 ? (
        <div className="text-center py-8">
          <Award size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No achievements yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Complete donations to unlock badges!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="relative">
              <AchievementBadge achievement={achievement} />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-14">
                Unlocked {formatDate(achievement.unlocked_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
