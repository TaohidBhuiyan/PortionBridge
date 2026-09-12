import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Utensils,
  Shirt,
  Package,
  Search,
  Trophy,
  BarChart3,
  ArrowUpRight,
  Zap
} from 'lucide-react';

/**
 * QuickActions — Modern Interactive Action Hub
 * Features gradient icon medallions, micro-tags, hover physics, and instant routing.
 */
export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Utensils,
      label: 'Donate Food',
      description: 'Share freshly prepared or packaged food surplus',
      route: '/donation/create',
      gradient: 'from-amber-500 to-orange-500',
      shadowColor: 'shadow-amber-500/20',
      badge: 'Popular',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      icon: Shirt,
      label: 'Donate Clothes',
      description: 'Give clean, wearable garments a second life',
      route: '/donation/create',
      gradient: 'from-sky-500 to-blue-600',
      shadowColor: 'shadow-sky-500/20',
      badge: 'Needed',
      badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    },
    {
      icon: Package,
      label: 'My Donations',
      description: 'Manage active requests and view past receipts',
      route: '/donor/my-donations',
      gradient: 'from-violet-500 to-indigo-600',
      shadowColor: 'shadow-violet-500/20',
      badge: 'History',
      badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    },
    {
      icon: Search,
      label: 'Find Volunteers',
      description: 'Discover verified couriers and local rescue teams',
      route: '/donor/discover-volunteers',
      gradient: 'from-emerald-500 to-teal-600',
      shadowColor: 'shadow-emerald-500/20',
      badge: 'Live Map',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      icon: Trophy,
      label: 'Leaderboard',
      description: 'View top donors',
      route: '/donor/leaderboard',
      gradient: 'from-yellow-400 to-amber-500',
      shadowColor: 'shadow-amber-500/20',
      badge: 'Ranks',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      icon: BarChart3,
      label: 'Impact Analytics',
      description: 'Explore detailed trend charts and community footprints',
      route: '/donor/analytics',
      gradient: 'from-rose-500 to-pink-600',
      shadowColor: 'shadow-rose-500/20',
      badge: 'Trends',
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
  ];

  const handleActionClick = (route) => {
    if (route.startsWith('/#')) {
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = route;
    } else {
      navigate(route);
    }
  };

  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-dash-primary-soft flex items-center justify-center text-dash-primary">
            <Zap size={15} />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">Quick Actions Hub</h2>
          </div>
        </div>
        <span className="text-xs text-text-secondary font-medium">Fast shortcuts</span>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleActionClick(action.route)}
              className="group relative flex flex-col justify-between p-4 rounded-2xl bg-surface border border-border/60 hover:border-dash-primary/40 text-left shadow-pb-card hover:shadow-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary/50"
            >
              <div className="flex items-start justify-between gap-3 w-full mb-3">
                {/* Gradient Medallion Icon */}
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${action.gradient} text-white flex items-center justify-center shadow-md ${action.shadowColor} group-hover:scale-110 transition-transform duration-200`}
                >
                  <Icon size={20} />
                </div>

                {/* Badge Tag and Arrow */}
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${action.badgeColor}`}>
                    {action.badge}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-surface-hover flex items-center justify-center text-text-secondary group-hover:text-dash-primary group-hover:bg-dash-primary-soft transition-colors">
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-text-primary group-hover:text-dash-primary transition-colors mb-1">
                  {action.label}
                </h3>
                <p className="text-xs text-text-secondary leading-snug line-clamp-2">
                  {action.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
