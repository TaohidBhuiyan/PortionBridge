import { User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PRIMARY = 'var(--color-primary, oklch(60.6% 0.25 292.717))';

/**
 * ProfileDropdown component with profile, settings, and logout options
 */
export function ProfileDropdown({ user, onLogout, onClose }) {
  const navigate = useNavigate();

  const handleProfile = () => {
    navigate(`/${user?.role}/profile`);
    onClose();
  };

  const handleSettings = () => {
    navigate(`/${user?.role}/settings`);
    onClose();
  };

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#120721] rounded-lg shadow-lg border border-gray-200 dark:border-purple-950/30 py-2 z-50 animate-fade-in">
      {/* User Info */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-purple-950/30">
        <p className="font-medium text-gray-900 dark:text-white truncate">
          {user?.name || 'User'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {user?.email || 'user@example.com'}
        </p>
        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 capitalize">
          {user?.role || 'User'}
        </span>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        <button
          onClick={handleProfile}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-purple-950/10 transition-colors"
        >
          <User size={16} />
          <span>Profile</span>
        </button>

        <button
          onClick={handleSettings}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-purple-950/10 transition-colors"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>

        <div className="border-t border-gray-200 dark:border-purple-950/30 my-1" />

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
