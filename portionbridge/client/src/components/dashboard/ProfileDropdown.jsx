import { User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';

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
    <div className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-xl shadow-lg border border-border py-1.5 z-50">
      {/* User Info */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border">
        <Avatar item={user} tone="dash" className="w-9 h-9 text-sm" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {user?.name || 'User'}
          </p>
          <p className="text-xs text-text-secondary truncate">
            {user?.email || 'user@example.com'}
          </p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        <button
          onClick={handleProfile}
          className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
        >
          <User size={16} />
          <span>Profile</span>
        </button>

        <button
          onClick={handleSettings}
          className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>

        <div className="border-t border-border my-1" />

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-danger hover:bg-danger-soft transition-colors"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
