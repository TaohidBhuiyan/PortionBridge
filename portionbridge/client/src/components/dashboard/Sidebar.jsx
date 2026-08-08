import { Link } from 'react-router-dom';
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
  Menu,
  X,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAuthSocket } from '../../context/SocketContext';
import { Avatar } from '../common/Avatar';

function NavLink({ item, active, isCollapsed, onNavigate }) {
  return (
    <Link
      to={item.path}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      aria-label={isCollapsed ? item.title : undefined}
      title={isCollapsed ? item.title : undefined}
      className={`relative flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary ${
        active
          ? 'bg-dash-primary-soft text-dash-primary font-medium'
          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
      } ${isCollapsed ? 'justify-center px-0' : ''}`}
    >
      {active && !isCollapsed && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-dash-primary" />
      )}
      <item.icon size={18} className="shrink-0" />
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{item.title}</span>
          {item.badge ? (
            <span className="bg-danger text-white text-[10px] leading-none px-1.5 py-1 rounded-full">
              {item.badge}
            </span>
          ) : null}
        </>
      )}
    </Link>
  );
}

function GroupLabel({ children, collapsed }) {
  return !collapsed ? (
    <p className="px-3 mt-4 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary first:mt-0">
      {children}
    </p>
  ) : (
    <div className="my-3 border-t border-border" />
  );
}

/**
 * Sidebar component with collapsible desktop and drawer mobile functionality
 * Supports nested menus and active route highlighting
 */
export function Sidebar({ collapsed, open, onToggle, onMobileToggle, userRole, currentPath, onLogout }) {
  const { user } = useAuth();
  const { unreadCount } = useAuthSocket();

  // Menu configuration based on role, organized into visual groups.
  // Routes/badges are unchanged from the previous implementation — only the
  // grouping and presentation are new.
  const mainItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: userRole === 'admin' ? '/admin/dashboard' : (userRole === 'volunteer' ? '/volunteer/dashboard' : '/donor/dashboard'),
    },
  ];

  if (userRole === 'donor') {
    mainItems.push(
      { title: 'Donate Food', icon: Utensils, path: '/donation/create' },
      { title: 'Donate Clothes', icon: Shirt, path: '/donation/create' },
      { title: 'My Donations', icon: Package, path: '/donor/my-donations' },
      { title: 'Track Donation', icon: MapPin, path: '/donor/my-donations' },
      { title: 'Discover Volunteers', icon: MapPin, path: '/donor/discover-volunteers' }
    );
  }

  const insightItems = [
    { title: 'Leaderboard', icon: Trophy, path: '/#leaderboard' },
  ];
  if (userRole === 'donor') {
    // Route already exists and is already linked to from QuickActions on the
    // donor dashboard — surfacing it here too, not a new feature.
    insightItems.push({ title: 'Analytics', icon: BarChart3, path: '/donor/analytics' });
  }

  const supportItems = [
    { title: 'Notifications', icon: Bell, path: '/notifications', badge: unreadCount > 0 ? unreadCount : null },
    { title: 'Help', icon: HelpCircle, path: '/#roles' },
  ];

  const accountItems = [];
  if (userRole === 'donor') {
    accountItems.push(
      { title: 'Profile', icon: User, path: '/donor/profile' },
      { title: 'Settings', icon: Settings, path: '/donor/settings' }
    );
  } else if (userRole === 'volunteer') {
    accountItems.push(
      { title: 'Profile', icon: User, path: user?.id ? `/volunteers/${user.id}` : '/volunteer/dashboard' }
    );
  }

  const groups = [
    { label: 'Main', items: mainItems },
    { label: 'Insights', items: insightItems },
    { label: 'Support', items: supportItems },
  ];

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
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-full bg-surface border-r border-border transition-all duration-200 z-30 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-border ${collapsed ? 'justify-center px-0' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full border-2 border-dash-primary flex items-center justify-center shrink-0">
                <span className="w-2 h-2 bg-dash-primary rounded-full" />
              </div>
              <span className="font-semibold text-text-primary truncate">PortionBridge</span>
            </div>
          )}
          <button
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {groups.map((group) =>
            group.items.length ? (
              <div key={group.label}>
                <GroupLabel collapsed={collapsed}>{group.label}</GroupLabel>
                {group.items.map((item) => (
                  <NavLink key={item.title} item={item} active={isActive(item.path)} isCollapsed={collapsed} />
                ))}
              </div>
            ) : null
          )}
        </nav>

        {/* Account section (Profile / Settings) + Logout */}
        <div className="px-2 py-2 border-t border-border">
          {accountItems.map((item) => (
            <NavLink key={item.title} item={item} active={isActive(item.path)} isCollapsed={collapsed} />
          ))}
          <button
            onClick={handleLogout}
            aria-label="Logout"
            title={collapsed ? 'Logout' : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg mt-0.5 w-full text-sm transition-colors text-danger hover:bg-danger-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-danger ${
              collapsed ? 'justify-center px-0' : ''
            }`}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2.5">
              <Avatar item={user} tone="dash" className="w-9 h-9 text-sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {user?.name || (userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User')}
                </p>
                <p className="text-xs text-text-secondary capitalize truncate">
                  {userRole} Account
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Drawer Sidebar (unchanged functionality — mobile polish is a later phase) */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full bg-surface border-r border-border transition-transform duration-300 z-50 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } w-64`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-dash-primary flex items-center justify-center">
              <span className="w-2 h-2 bg-dash-primary rounded-full" />
            </div>
            <span className="font-semibold text-text-primary">PortionBridge</span>
          </div>
          <button
            onClick={onMobileToggle}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {[...mainItems, ...insightItems, ...supportItems, ...accountItems].map((item) => (
            <Link
              key={item.title}
              to={item.path}
              onClick={onMobileToggle}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary ${
                isActive(item.path)
                  ? 'bg-dash-primary-soft text-dash-primary font-medium'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <item.icon size={18} className="shrink-0" />
              <span className="flex-1 truncate">{item.title}</span>
              {item.badge && (
                <span className="bg-danger text-white text-[10px] leading-none px-1.5 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg mt-2 w-full text-sm transition-colors text-danger hover:bg-danger-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          >
            <LogOut size={18} className="shrink-0" />
            <span>Logout</span>
          </button>
        </nav>

        {/* User Info */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2.5">
            <Avatar item={user} tone="dash" className="w-9 h-9 text-sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user?.name || (userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User')}
              </p>
              <p className="text-xs text-text-secondary capitalize truncate">
                {userRole} Account
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}