import { useNavigate } from 'react-router-dom';
import { 
  Utensils, 
  Shirt, 
  Package, 
  MapPin, 
  Trophy, 
  HelpCircle 
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
      icon: MapPin,
      label: 'Track Donation',
      description: 'Track your donation in real-time',
      route: '/donor/track-donation',
      color: 'from-green-400 to-green-600',
    },
    {
      icon: Trophy,
      label: 'Leaderboard',
      description: 'See top donors and volunteers',
      route: '/donor/leaderboard',
      color: 'from-yellow-400 to-yellow-600',
    },
    {
      icon: HelpCircle,
      label: 'Support Center',
      description: 'Get help and support',
      route: '/donor/help',
      color: 'from-teal-400 to-teal-600',
    },
  ];

  const handleActionClick = (route) => {
    navigate(route);
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => handleActionClick(action.route)}
              className="group bg-white dark:bg-[#120721] rounded-xl border border-gray-200 dark:border-purple-950/30 p-6 text-left hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={24} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {action.label}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {action.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
