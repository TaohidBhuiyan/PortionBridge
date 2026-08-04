import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Sun, Moon, ChevronDown } from 'lucide-react';
import { ProfileDropdown } from './ProfileDropdown';
import { NotificationDropdown } from './NotificationDropdown';

const PRIMARY = 'var(--color-primary, oklch(60.6% 0.25 292.717))';

/**
 * TopNavbar component with breadcrumb, search, notifications, profile, and dark mode toggle
 */
export function TopNavbar({ onSidebarToggle, onMobileSidebarToggle, darkMode, onDarkModeToggle, user, onLogout }) {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Generate breadcrumb from current path
  const generateBreadcrumb = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    if (pathSegments.length === 0) {
      return [{ label: 'Home', path: '/' }];
    }

    const breadcrumb = [];
    let currentPath = '';

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      breadcrumb.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        path: currentPath,
      });
    });

    return breadcrumb;
  };

  const breadcrumb = generateBreadcrumb();

  // Mock notifications
  const notifications = [
    { id: 1, title: 'Donation picked up', message: 'Your food donation has been picked up', time: '5 min ago', unread: true },
    { id: 2, title: 'New volunteer nearby', message: 'A new volunteer joined your area', time: '1 hour ago', unread: true },
    { id: 3, title: 'Donation delivered', message: 'Your clothes donation reached the shelter', time: '2 hours ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-[#120721] border-b border-gray-200 dark:border-purple-950/30">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Section - Mobile Menu Toggle & Breadcrumb */}
        <div className="flex items-center gap-3 flex-1">
          {/* Mobile Menu Toggle */}
          <button
            onClick={onMobileSidebarToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-purple-950/20 text-gray-600 dark:text-gray-400 transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb */}
          <nav className="hidden sm:flex items-center gap-2 text-sm">
            {breadcrumb.map((item, index) => (
              <div key={item.path} className="flex items-center gap-2">
                {index > 0 && (
                  <span className="text-gray-400 dark:text-gray-600">/</span>
                )}
                <span
                  className={`${
                    index === breadcrumb.length - 1
                      ? 'text-gray-900 dark:text-white font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </nav>
        </div>

        {/* Center Section - Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search donations, volunteers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-purple-950/30 bg-gray-50 dark:bg-purple-950/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
            />
          </div>
        </div>

        {/* Right Section - Notifications, Dark Mode, Profile */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-purple-950/20 text-gray-600 dark:text-gray-400 transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {showNotificationDropdown && (
              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                onClose={() => setShowNotificationDropdown(false)}
              />
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={onDarkModeToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-purple-950/20 text-gray-600 dark:text-gray-400 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-purple-950/20 transition-colors"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ background: PRIMARY }}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <ChevronDown size={16} className="text-gray-400 hidden sm:block" />
            </button>

            {showProfileDropdown && (
              <ProfileDropdown
                user={user}
                onLogout={onLogout}
                onClose={() => setShowProfileDropdown(false)}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
