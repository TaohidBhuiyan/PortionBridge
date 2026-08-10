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
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-xl',
  };

  return (
    <div className="flex items-center gap-2.5 p-2 bg-dash-primary-soft rounded-md border border-border/50">
      <div className={`${sizeClasses[size]} rounded-full bg-dash-primary flex items-center justify-center text-white shadow-sm`}>
        <Icon size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary text-xs truncate">
          {achievement.achievement_name}
        </p>
        <p className="text-[10px] text-text-secondary truncate">
          {achievement.description}
        </p>
      </div>
    </div>
  );
}
