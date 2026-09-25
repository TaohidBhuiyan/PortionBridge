import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, Sun, Moon, ChevronDown, Menu, ShieldCheck } from 'lucide-react';
import { ProfileDropdown } from './ProfileDropdown';
import { NotificationDropdown } from './NotificationDropdown';
import { useAuthSocket } from '../../context/SocketContext';
import { Avatar } from '../common/Avatar';

// Maps known dashboard routes to a short, human page title.
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
  '/admin/users': 'Users',
  '/admin/donations': 'Donations',
  '/admin/volunteers-teams': 'Volunteers & Teams',
  '/admin/live-operations': 'Live Operations',
  '/admin/attention-center': 'Attention Center',
  '/admin/reports': 'Reports',
  '/admin/analytics': 'Analytics',
  '/admin/audit-logs': 'Audit Logs',
  '/admin/notifications': 'Notifications',
  '/admin/settings': 'Settings',
};

function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const matchedPrefix = Object.keys(PAGE_TITLES).find((path) => pathname.startsWith(path + '/'));
  if (matchedPrefix) return PAGE_TITLES[matchedPrefix];
  const lastSegment = pathname.split('/').filter(Boolean).pop() || 'Dashboard';
  return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
}

/**
 * TopNavbar — with admin role indicator badge and subtle admin-tinted bg.
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
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <header
      className={`sticky top-0 z-20 h-14 border-b shadow-pb-subtle transition-colors ${
        isAdminRoute
          ? 'bg-[oklch(18%_0.04_285)]/95 backdrop-blur-sm border-white/8'
          : 'bg-surface border-border/50'
      }`}
    >
      <div className="flex items-center justify-between h-full px-4 md:px-5 gap-4">

        {/* Left — mobile toggle + page title + admin badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileSidebarToggle}
            aria-label="Open menu"
            className={`lg:hidden p-1.5 rounded-md transition-colors ${
              isAdminRoute
                ? 'hover:bg-white/10 text-white/60 hover:text-white'
                : 'hover:bg-surface-hover text-text-secondary'
            }`}
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-2.5">
            <h1
              className={`text-sm font-bold ${
                isAdminRoute ? 'text-white/80' : 'text-text-primary'
              }`}
            >
              {pageTitle}
            </h1>

            {/* Admin badge pill */}
            {isAdminRoute && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-[10px] font-bold text-violet-300 uppercase tracking-wide">
                <ShieldCheck size={10} />
                Admin
              </span>
            )}
          </div>
        </div>

        {/* Right — action icons */}
        <div className="flex items-center gap-1 ml-auto">

          {/* Messages */}
          <div className="relative">
            <button
              onClick={() => navigate('/messages')}
              aria-label={unreadMessageCount > 0 ? `Messages, ${unreadMessageCount} unread` : 'Messages'}
              title="Messages"
              aria-current={isMessagesActive ? 'page' : undefined}
              className={`relative p-1.5 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary/50 ${
                isAdminRoute
                  ? isMessagesActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/50 hover:bg-white/10 hover:text-white/80'
                  : isMessagesActive
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
              className={`relative p-1.5 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary/50 ${
                isAdminRoute
                  ? 'text-white/50 hover:bg-white/10 hover:text-white/80'
                  : 'text-text-secondary hover:bg-surface-hover'
              }`}
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
            className={`p-1.5 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary/50 ${
              isAdminRoute
                ? 'text-white/50 hover:bg-white/10 hover:text-white/80'
                : 'text-text-secondary hover:bg-surface-hover'
            }`}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown((v) => !v)}
              aria-label="Open profile menu"
              className={`flex items-center gap-1 p-1 pr-1 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary/50 ${
                isAdminRoute ? 'hover:bg-white/10' : 'hover:bg-surface-hover'
              }`}
            >
              <Avatar item={user} tone="dash" className="w-7 h-7 text-xs" />
              <ChevronDown
                size={12}
                className={`hidden sm:block ${isAdminRoute ? 'text-white/40' : 'text-text-secondary'}`}
              />
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
