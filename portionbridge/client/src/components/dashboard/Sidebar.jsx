import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Utensils, 
  Shirt, 
  Package, 
  MapPin, 
  Trophy, 
  Bell, 
  User, 
  Settings, 
  HelpCircle, 
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

const PRIMARY = 'var(--color-primary, oklch(60.6% 0.25 292.717))';

/**
 * Sidebar component with collapsible desktop and drawer mobile functionality
 * Supports nested menus and active route highlighting
 */
export function Sidebar({ collapsed, open, onToggle, onMobileToggle, userRole, currentPath, onLogout }) {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});

  // Menu configuration based on role
  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: `/${userRole}/dashboard`,
    },
    {
      title: 'Donate Food',
      icon: Utensils,
      path: `/${userRole}/donate-food`,
    },
    {
      title: 'Donate Clothes',
      icon: Shirt,
      path: `/${userRole}/donate-clothes`,
    },
    {
      title: 'My Donations',
      icon: Package,
      path: `/${userRole}/my-donations`,
    },
    {
      title: 'Track Donation',
      icon: MapPin,
      path: `/${userRole}/track-donation`,
    },
    {
      title: 'Leaderboard',
      icon: Trophy,
      path: `/${userRole}/leaderboard`,
    },
    {
      title: 'Notifications',
      icon: Bell,
      path: `/${userRole}/notifications`,
      badge: 3,
    },
    {
      title: 'Profile',
      icon: User,
      path: `/${userRole}/profile`,
    },
    {
      title: 'Settings',
      icon: Settings,
      path: `/${userRole}/settings`,
    },
    {
      title: 'Help',
      icon: HelpCircle,
      path: `/${userRole}/help`,
    },
  ];

  // Toggle nested menu expansion
  const toggleMenu = (title) => {
    setExpandedMenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Check if menu item is active
  const isActive = (path) => {
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  // Handle logout
  const handleLogout = () => {
    onLogout();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-full bg-white dark:bg-[#120721] border-r border-gray-200 dark:border-purple-950/30 transition-all duration-300 z-30 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-purple-950/30">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500 flex items-center justify-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full" />
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">PortionBridge</span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-purple-950/20 text-gray-600 dark:text-gray-400 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {menuItems.map((item) => (
            <Link
              key={item.title}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                isActive(item.path)
                  ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-purple-950/10'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.title : ''}
            >
              <item.icon size={20} />
              {!collapsed && (
                <>
                  <span className="flex-1 font-medium">{item.title}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          ))}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mt-4 transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Logout' : ''}
          >
            <LogOut size={20} />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
        </nav>

        {/* User Info */}
        {!collapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-purple-950/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: PRIMARY }}>
                {userRole?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate capitalize">
                  {userRole}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {userRole} Account
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full bg-white dark:bg-[#120721] border-r border-gray-200 dark:border-purple-950/30 transition-transform duration-300 z-50 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } w-64`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-purple-950/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500 flex items-center justify-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">PortionBridge</span>
          </div>
          <button
            onClick={onMobileToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-purple-950/20 text-gray-600 dark:text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {menuItems.map((item) => (
            <Link
              key={item.title}
              to={item.path}
              onClick={onMobileToggle}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                isActive(item.path)
                  ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-purple-950/10'
              }`}
            >
              <item.icon size={20} />
              <span className="flex-1 font-medium">{item.title}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg mt-4 transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 w-full"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200 dark:border-purple-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: PRIMARY }}>
              {userRole?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate capitalize">
                {userRole}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {userRole} Account
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
