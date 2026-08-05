import { Award, Star, Trophy, Crown, Heart, Gift, Truck, ShieldCheck, Zap, CalendarCheck } from 'lucide-react';

/**
 * AchievementBadge - Displays a single achievement badge
 */
export function AchievementBadge({ achievement, size = 'md' }) {
  const iconMap = {
    gift: Gift,
    'hand-heart': Heart,
    award: Award,
    crown: Crown,
    trophy: Trophy,
    star: Star,
    truck: Truck,
    'shield-check': ShieldCheck,
    zap: Zap,
    'calendar-check': CalendarCheck,
  };

  const Icon = iconMap[achievement.icon] || Award;

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg border border-purple-200 dark:border-purple-950/50">
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md`}>
        <Icon size={size === 'sm' ? 16 : size === 'md' ? 24 : 32} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
          {achievement.achievement_name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {achievement.description}
        </p>
      </div>
    </div>
  );
}
