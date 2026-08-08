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
      primary: true,
    },
    {
      icon: Shirt,
      label: 'Donate Clothes',
      description: 'Give clothes a second life',
      route: '/donation/create',
      primary: true,
    },
    {
      icon: Package,
      label: 'My Donations',
      description: 'View and manage your donations',
      route: '/donor/my-donations',
    },
    {
      icon: Search,
      label: 'Discover Volunteers',
      description: 'Find nearby volunteers and teams',
      route: '/donor/discover-volunteers',
    },
    {
      icon: Trophy,
      label: 'Leaderboard',
      description: 'See top donors and volunteers',
      route: '/#leaderboard',
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      description: 'View your donation impact and trends',
      route: '/donor/analytics',
    },
    {
      icon: HelpCircle,
      label: 'Support Center',
      description: 'Get help and support',
      route: '/#roles',
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
      <h2 className="text-base font-semibold text-text-primary mb-3">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => handleActionClick(action.route)}
              className="group bg-surface rounded-xl border border-border p-4 text-left hover:border-dash-primary/40 hover:bg-surface-hover transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2 flex items-start gap-3"
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  action.primary ? 'bg-dash-primary text-white' : 'bg-dash-primary-soft text-dash-primary'
                }`}
              >
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-text-primary mb-0.5 truncate">
                  {action.label}
                </h3>
                <p className="text-xs text-text-secondary line-clamp-2">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
