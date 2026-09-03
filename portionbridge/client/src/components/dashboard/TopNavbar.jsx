import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, Sun, Moon, ChevronDown, Menu } from 'lucide-react';
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
  '/messages': 'Messages',
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
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const { unreadCount, unreadMessageCount } = useAuthSocket();

  const pageTitle = getPageTitle(location.pathname);
  const isMessagesActive = location.pathname === '/messages' || location.pathname.startsWith('/messages/');
  const messagesBadge = unreadMessageCount > 99 ? '99+' : unreadMessageCount;

  return (
    <header className="sticky top-0 z-20 h-14 bg-surface border-b border-border/50 shadow-pb-subtle">
      <div className="flex items-center justify-between h-full px-4 md:px-5 gap-4">
        {/* Left Section - Mobile Menu Toggle & Page Title */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle (Phase 2 is desktop-focused; kept functional for mobile) */}
          <button
            onClick={onMobileSidebarToggle}
            aria-label="Open menu"
            className="lg:hidden p-1.5 rounded-md hover:bg-surface-hover text-text-secondary transition-colors"
          >
            <Menu size={18} />
          </button>

          <h1 className="text-sm font-semibold text-text-primary">{pageTitle}</h1>
        </div>

        {/* Right Section - Notifications, Dark Mode, Profile */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Messages */}
          <div className="relative">
            <button
              onClick={() => navigate('/messages')}
              aria-label={unreadMessageCount > 0 ? `Messages, ${unreadMessageCount} unread` : 'Messages'}
              title="Messages"
              aria-current={isMessagesActive ? 'page' : undefined}
              className={`relative p-1.5 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary/50 ${
                isMessagesActive
                  ? 'bg-dash-primary-soft text-dash-primary'
                  : 'text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <MessageSquare size={16} />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-danger text-white text-[9px] leading-none rounded-full">
                  {messagesBadge}
                </span>
              )}
            </button>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationDropdown((v) => !v)}
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
              className="relative p-1.5 rounded-md hover:bg-surface-hover text-text-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary/50"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-danger rounded-full" />
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
            className="p-1.5 rounded-md hover:bg-surface-hover text-text-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary/50"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown((v) => !v)}
              aria-label="Open profile menu"
              className="flex items-center gap-1 p-1 pr-1 rounded-md hover:bg-surface-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary/50"
            >
              <Avatar item={user} tone="dash" className="w-7 h-7 text-xs" />
              <ChevronDown size={12} className="text-text-secondary hidden sm:block" />
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
