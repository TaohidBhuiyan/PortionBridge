import { useNavigate } from 'react-router-dom';
import { 
  Utensils, 
  Shirt, 
  Package, 
  Search, 
  Trophy, 
  HelpCircle,
  BarChart3
} from 'lucide-react';

/**
 * QuickActions component with 6 navigation cards
 */
export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Utensils,
      label: 'Donate Food',
      description: 'Share excess food with those in need',
      route: '/donation/create',
      color: 'from-orange-400 to-orange-600',
    },
    {
      icon: Shirt,
      label: 'Donate Clothes',
      description: 'Give clothes a second life',
      route: '/donation/create',
      color: 'from-blue-400 to-blue-600',
    },
    {
      icon: Package,
      label: 'My Donations',
      description: 'View and manage your donations',
      route: '/donor/my-donations',
      color: 'from-purple-400 to-purple-600',
    },
    {
      icon: Search,
      label: 'Discover Volunteers',
      description: 'Find nearby volunteers and teams',
      route: '/donor/discover-volunteers',
      color: 'from-green-400 to-green-600',
    },
    {
      icon: Trophy,
      label: 'Leaderboard',
      description: 'See top donors and volunteers',
      route: '/#leaderboard',
      color: 'from-yellow-400 to-yellow-600',
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      description: 'View your donation impact and trends',
      route: '/donor/analytics',
      color: 'from-indigo-400 to-indigo-600',
    },
    {
      icon: HelpCircle,
      label: 'Support Center',
      description: 'Get help and support',
      route: '/#roles',
      color: 'from-teal-400 to-teal-600',
    },
  ];

  const handleActionClick = (route) => {
    // If route starts with '#' it is a hash link for landing page
    if (route.startsWith('/#')) {
      window.location.href = route;
    } else {
      navigate(route);
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => handleActionClick(action.route)}
              className="group bg-white/80 dark:bg-[#120721]/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-purple-950/20 p-6 text-left hover:shadow-xl hover:-translate-y-1 hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all duration-300 shadow-sm relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors duration-300" />
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-md`}>
                <Icon size={24} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {action.label}
              </h3>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                {action.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
