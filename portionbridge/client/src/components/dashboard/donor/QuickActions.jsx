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
      // Safe: this only runs inside a click handler (never during render),
      // so it can't violate render purity; window.location.href is the
      // correct way to navigate to a landing-page hash anchor from another route.
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = route;
    } else {
      navigate(route);
    }
  };

  return (
    <div className="mb-5">
      <h2 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => handleActionClick(action.route)}
              className="group bg-surface rounded-lg border border-border/50 p-3 text-left hover:border-dash-primary/30 hover:bg-surface-hover hover:shadow-md hover:scale-[1.01] transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-dash-primary/50 focus:ring-offset-2 flex flex-col items-start gap-2"
            >
              <div
                className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                  action.primary ? 'gradient-accent text-white' : 'bg-dash-primary-soft text-dash-primary'
                }`}
              >
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-text-primary mb-0.5 truncate">
                  {action.label}
                </h3>
                <p className="text-[11px] text-text-secondary line-clamp-2">
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
