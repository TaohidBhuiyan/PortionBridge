import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Utensils,
  Shirt,
  Package,
  MapPin,
  Trophy,
  Bell,
  MessageSquare,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  BarChart3,
  Compass,
  Users,
  History,
  Navigation,
  ListChecks,
  HandHeart,
  Activity,
  AlertTriangle,
  FileText,
  ScrollText,
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
      className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl mb-1 text-xs font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary/40 ${
        active
          ? 'bg-dash-primary-soft text-dash-primary font-semibold shadow-xs'
          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
      } ${isCollapsed ? 'justify-center px-0' : ''}`}
    >
      {active && !isCollapsed && (
        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-dash-primary" />
      )}
      <item.icon
        size={16}
        className={`shrink-0 transition-colors ${
          active
            ? 'text-dash-primary'
            : 'text-text-secondary group-hover:text-text-primary'
        }`}
      />
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{item.title}</span>
          {item.badge ? (
            <span className="bg-rose-500 text-white text-[9px] font-bold leading-none px-1.5 py-0.5 rounded-full shadow-xs">
              {item.badge}
            </span>
          ) : null}
        </>
      )}
    </Link>
  );
}

/**
 * Sidebar component with collapsible desktop and drawer mobile functionality
 * Supports nested menus and active route highlighting
 */
export function Sidebar({ collapsed, open, onToggle, onMobileToggle, userRole, currentPath, currentSearch = '', onLogout }) {
  const { user } = useAuth();
  const { unreadCount, unreadMessageCount } = useAuthSocket();

  const mainItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: userRole === 'admin' ? '/admin/dashboard' : (userRole === 'volunteer' ? '/volunteer/dashboard' : '/donor/dashboard'),
    },
  ];

  if (userRole === 'donor') {
    mainItems.push(
      { title: 'Donate Food', icon: Utensils, path: '/donation/create?category=food' },
      { title: 'Donate Clothes', icon: Shirt, path: '/donation/create?category=clothes' },
      { title: 'My Donations', icon: Package, path: '/donor/my-donations' },
      { title: 'Discover Volunteers', icon: Compass, path: '/donor/discover-volunteers' }
    );
  } else if (userRole === 'volunteer') {
    mainItems.push(
      { title: 'Find Opportunities', icon: Compass, path: '/volunteer/opportunities' },
      { title: 'My Mission', icon: Navigation, path: '/volunteer/mission' },
      { title: 'Active Missions', icon: ListChecks, path: '/volunteer/active-missions' },
      { title: 'My Team', icon: Users, path: '/volunteer/team' },
      { title: 'Mission History', icon: History, path: '/volunteer/history' }
    );
  }

  const operationsItems = [];
  const moderationItems = [];
  if (userRole === 'admin') {
    operationsItems.push(
      { title: 'Users', icon: Users, path: '/admin/users' },
      { title: 'Donations', icon: Package, path: '/admin/donations' },
      { title: 'Volunteers & Teams', icon: HandHeart, path: '/admin/volunteers-teams' },
      { title: 'Live Operations', icon: Activity, path: '/admin/live-operations' }
    );
    moderationItems.push(
      { title: 'Attention Center', icon: AlertTriangle, path: '/admin/attention-center' },
      { title: 'Reports', icon: FileText, path: '/admin/reports' }
    );
  }

  const insightItems = [];
  if (userRole === 'admin') {
    insightItems.push({ title: 'Analytics', icon: BarChart3, path: '/admin/analytics' });
  } else {
    insightItems.push({ title: 'Leaderboard', icon: Trophy, path: '/#leaderboard' });
    if (userRole === 'donor') {
      insightItems.push({ title: 'Analytics', icon: BarChart3, path: '/donor/analytics' });
    }
  }

  const supportItems = userRole === 'admin'
    ? [
        { title: 'Audit Logs', icon: ScrollText, path: '/admin/audit-logs' },
        { title: 'Notifications', icon: Bell, path: '/admin/notifications', badge: unreadCount > 0 ? unreadCount : null },
        { title: 'Settings', icon: Settings, path: '/admin/settings' },
      ]
    : [
        { title: 'Messages', icon: MessageSquare, path: '/messages', badge: unreadMessageCount > 0 ? (unreadMessageCount > 99 ? '99+' : unreadMessageCount) : null },
        { title: 'Notifications', icon: Bell, path: '/notifications', badge: unreadCount > 0 ? unreadCount : null },
        { title: 'Help', icon: HelpCircle, path: '/#roles' },
      ];

  const accountItems = [];
  if (userRole === 'donor') {
    accountItems.push(
      { title: 'Profile', icon: User, path: '/donor/profile' },
      { title: 'Saved Addresses', icon: MapPin, path: '/donor/addresses' },
      { title: 'Settings', icon: Settings, path: '/donor/settings' }
    );
  } else if (userRole === 'volunteer') {
    accountItems.push(
      { title: 'Profile', icon: User, path: user?.id ? `/volunteers/${user.id}` : '/volunteer/dashboard' }
    );
  }

  const groups = userRole === 'admin'
    ? [
        { id: 'overview', items: mainItems },
        { id: 'operations', items: operationsItems },
        { id: 'moderation', items: moderationItems },
        { id: 'insights', items: insightItems },
        { id: 'system', items: supportItems },
      ]
    : [
        { id: 'main', items: mainItems },
        { id: 'insights', items: insightItems },
        { id: 'support', items: supportItems },
      ];

  // Check if menu item is active
  const isActive = (path) => {
    const fullCurrent = currentPath + (currentSearch || '');
    if (path.includes('?')) {
      if (fullCurrent === path) return true;
      // If user is on /donation/create without query params, default highlight to food
      if (currentPath === '/donation/create' && !currentSearch && path === '/donation/create?category=food') {
        return true;
      }
      return false;
    }
    // If the path doesn't have query params, but user is on /donation/create, don't match
    if (currentPath === '/donation/create') {
      return false;
    }
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  // Handle logout
  const handleLogout = () => {
    onLogout();
  };

  const profilePath =
    userRole === 'donor'
      ? '/donor/profile'
      : userRole === 'volunteer'
      ? (user?.id ? `/volunteers/${user.id}` : '/volunteer/dashboard')
      : '/admin/settings';

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-full bg-surface border-r border-border/50 shadow-pb-subtle transition-all duration-200 z-30 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Logo Header */}
        <div className={`flex items-center h-16 px-4 border-b border-border/40 ${collapsed ? 'justify-center px-0' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-dash-primary/10 border border-dash-primary/20 flex items-center justify-center shrink-0">
                <span className="w-2 h-2 bg-dash-primary rounded-full" />
              </div>
              <span className="font-bold text-text-primary tracking-tight truncate text-sm">PortionBridge</span>
            </div>
          )}
          <button
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary/50"
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Menu Items (Clean, without noisy group headers) */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border/60 [&::-webkit-scrollbar-thumb]:rounded-full">
          {groups
            .filter((group) => group.items.length > 0)
            .map((group, groupIdx) => (
              <div key={group.id}>
                {groupIdx > 0 && <div className="my-2.5 mx-1 border-t border-border/40" />}
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink key={item.title} item={item} active={isActive(item.path)} isCollapsed={collapsed} />
                  ))}
                </div>
              </div>
            ))}
        </nav>

        {/* Account section (Profile / Settings) + Logout */}
        <div className="px-3 py-2 border-t border-border/40">
          {accountItems.map((item) => (
            <NavLink key={item.title} item={item} active={isActive(item.path)} isCollapsed={collapsed} />
          ))}
          <button
            onClick={handleLogout}
            aria-label="Logout"
            title={collapsed ? 'Logout' : undefined}
            className={`group flex items-center gap-3 px-3 py-2 rounded-xl mt-1 w-full text-xs font-medium transition-colors text-danger/80 hover:text-danger hover:bg-danger-soft/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/50 ${
              collapsed ? 'justify-center px-0' : ''
            }`}
          >
            <LogOut size={16} className="shrink-0 transition-transform group-hover:-translate-x-0.5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* User Profile Card at Bottom */}
        {!collapsed && (
          <div className="p-3 border-t border-border/40 bg-surface-hover/20">
            <Link
              to={profilePath}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-surface-hover transition-all group"
            >
              <div className="relative shrink-0">
                <Avatar item={user} tone="dash" className="w-8 h-8 text-xs ring-2 ring-surface shadow-xs" />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-surface" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-text-primary truncate group-hover:text-dash-primary transition-colors">
                  {user?.name || (userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User')}
                </p>
                <p className="text-[10px] text-text-secondary capitalize truncate">
                  {userRole} Account
                </p>
              </div>
            </Link>
          </div>
        )}
      </aside>

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full bg-surface border-r border-border transition-transform duration-300 z-50 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } w-64 flex flex-col justify-between`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-dash-primary/10 border border-dash-primary/20 flex items-center justify-center">
              <span className="w-2 h-2 bg-dash-primary rounded-full" />
            </div>
            <span className="font-bold text-text-primary text-sm">PortionBridge</span>
          </div>
          <button
            onClick={onMobileToggle}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mobile Menu Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {[...mainItems, ...operationsItems, ...moderationItems, ...insightItems, ...supportItems, ...accountItems].map((item) => (
            <Link
              key={item.title}
              to={item.path}
              onClick={onMobileToggle}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary ${
                isActive(item.path)
                  ? 'bg-dash-primary-soft text-dash-primary font-semibold'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <item.icon size={17} className="shrink-0" />
              <span className="flex-1 truncate">{item.title}</span>
              {item.badge && (
                <span className="bg-rose-500 text-white text-[9px] font-bold leading-none px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl mt-2 w-full text-xs font-medium transition-colors text-danger hover:bg-danger-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          >
            <LogOut size={17} className="shrink-0" />
            <span>Logout</span>
          </button>
        </nav>

        {/* Mobile User Card */}
        <div className="p-3 border-t border-border">
          <Link
            to={profilePath}
            onClick={onMobileToggle}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-surface-hover transition-colors"
          >
            <div className="relative shrink-0">
              <Avatar item={user} tone="dash" className="w-8 h-8 text-xs ring-1 ring-border" />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-surface" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-text-primary truncate">
                {user?.name || (userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User')}
              </p>
              <p className="text-[10px] text-text-secondary capitalize truncate">
                {userRole} Account
              </p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}