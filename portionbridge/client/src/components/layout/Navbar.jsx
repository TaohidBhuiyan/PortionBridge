import { useState } from "react";
import { Logo } from "../common/Logo";
import { Avatar } from "../common/Avatar";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PRIMARY = "var(--color-primary, oklch(60.6% 0.25 292.717))";

/**
 * Navbar component - Main navigation header
 */
export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowProfileMenu(false);
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    // AUDIT FIX: removed a dead 'leader' case — users.role is only ever
    // donor/volunteer/admin (see schema); team leadership is a per-team
    // attribute (team_members.role), not a top-level account role.
    switch (user.role) {
      case 'donor': return '/donor/dashboard';
      case 'volunteer': return '/volunteer/dashboard';
      case 'admin': return '/admin/dashboard';
      default: return '/';
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-4 pt-4 md:px-6">
      <div className="glass-panel max-w-5xl mx-auto flex items-center justify-between px-4 md:px-5 h-12 rounded-2xl">
        <Link to="/" className="flex items-center gap-2 font-serif text-sm md:text-base font-semibold text-[#35206f]">
          <Logo className="w-7 h-7" />
          PortionBridge
        </Link>
        <nav className="hidden md:flex items-center gap-7 font-mono text-[10px] text-[#35206f]/70">
          <Link to="/#roles" className="hover:opacity-70">Roles</Link>
          <Link to="/#leaderboard" className="hover:opacity-70">Leaderboard</Link>
        </nav>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardPath()}
                className="hidden sm:inline-block text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-[#35206f]/15 text-[#35206f] hover:border-[#35206f]/35 transition-colors"
              >
                Dashboard
              </Link>
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2"
                >
                  <Avatar item={{ name: user?.name || 'User', photo: user?.profile_photo }} className="w-8 h-8 text-xs" />
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-black/5 py-2">
                    <div className="px-4 py-2 border-b border-black/5">
                      <div className="text-sm font-medium">{user?.name}</div>
                      <div className="text-xs text-black/50 capitalize">{user?.role}</div>
                    </div>
                    <Link
                      to={getDashboardPath()}
                      className="block px-4 py-2 text-sm text-black/70 hover:bg-gray-50"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-block text-xs font-semibold px-3.5 py-2 rounded-xl border border-[#35206f]/15 text-[#35206f] hover:border-[#35206f]/35 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-white text-xs font-semibold px-4 py-2 rounded-xl transition-transform hover:scale-105 shadow-sm"
                style={{ background: `linear-gradient(135deg, var(--color-primary-deeper), ${PRIMARY})` }}
              >
                Donate now
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
