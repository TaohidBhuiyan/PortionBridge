import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, Sun, Moon, ChevronDown, Menu } from 'lucide-react';
import { ProfileDropdown } from './ProfileDropdown';
import { NotificationDropdown } from './NotificationDropdown';
import { useAuthSocket } from '../../context/SocketContext';
import { Avatar } from '../common/Avatar';

// Maps known dashboard routes to a short, human page title. Falls back to a
// capitalized version of the last path segment for anything not listed here,
// so new routes don't end up with a blank title.
const PAGE_TITLES = {
  '/donor/dashboard': 'Dashboard',
  '/volunteer/dashboard': 'Dashboard',
  '/admin/dashboard': 'Dashboard',
  '/donation/create': 'New Donation',
  '/donor/my-donations': 'My Donations',
  '/donor/discover-volunteers': 'Discover Volunteers',
  '/donor/analytics': 'Analytics',
  '/donor/profile': 'Profile',
  '/donor/settings': 'Settings',
  '/notifications': 'Notifications',
};

function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const matchedPrefix = Object.keys(PAGE_TITLES).find((path) => pathname.startsWith(path + '/'));
  if (matchedPrefix) return PAGE_TITLES[matchedPrefix];
  const lastSegment = pathname.split('/').filter(Boolean).pop() || 'Dashboard';
  return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
}

/**
 * TopNavbar component with page title, search, notifications, profile, and dark mode toggle
 */
export function TopNavbar({ onMobileSidebarToggle, darkMode, onDarkModeToggle, user, onLogout }) {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const { unreadCount } = useAuthSocket();

  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 z-20 h-16 bg-surface border-b border-border">
      <div className="flex items-center justify-between h-full px-4 md:px-6 gap-4">
        {/* Left Section - Mobile Menu Toggle & Page Title */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle (Phase 2 is desktop-focused; kept functional for mobile) */}
          <button
            onClick={onMobileSidebarToggle}
            aria-label="Open menu"
            className="lg:hidden p-2 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors"
          >
            <Menu size={20} />
          </button>

          <h1 className="text-base font-semibold text-text-primary">{pageTitle}</h1>
        </div>

        {/* Center Section - Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
            <input
              type="text"
              placeholder="Search donations, volunteers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-border bg-page text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-dash-primary/40 focus:border-dash-primary transition-colors"
            />
          </div>
        </div>

        {/* Right Section - Notifications, Dark Mode, Profile */}
        <div className="flex items-center gap-1.5">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationDropdown((v) => !v)}
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
              className="relative p-2 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
              )}
            </button>

            {showNotificationDropdown && (
              <NotificationDropdown
                isOpen={showNotificationDropdown}
                onClose={() => setShowNotificationDropdown(false)}
              />
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={onDarkModeToggle}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown((v) => !v)}
              aria-label="Open profile menu"
              className="flex items-center gap-1.5 p-1 pr-1.5 rounded-lg hover:bg-surface-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary"
            >
              <Avatar item={user} tone="dash" className="w-8 h-8 text-sm" />
              <ChevronDown size={14} className="text-text-secondary hidden sm:block" />
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
