import React, { useState } from "react";
import { Logo } from "../common/Logo";
import { Avatar } from "../common/Avatar";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PRIMARY = "oklch(60.6% 0.25 292.717)";

/**
 * Navbar component - Main navigation header
 * @param {Function} onGoToRole - Callback when role button is clicked
 */
export function Navbar({ onGoToRole }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setShowProfileMenu(false);
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'donor': return '/donor/dashboard';
      case 'volunteer': return '/volunteer/dashboard';
      case 'leader': return '/leader/dashboard';
      case 'admin': return '/admin/dashboard';
      default: return '/';
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-sm border-b border-black/5">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 md:px-10 h-16">
        <Link to="/" className="flex items-center gap-2 font-serif text-lg font-medium">
          <Logo className="w-7 h-7" />
          PortionBridge
        </Link>
        <nav className="hidden md:flex items-center gap-7 font-mono text-[11px] text-black/60">
          <Link to="/#roles" className="hover:opacity-70">Roles</Link>
          <Link to="/#leaderboard" className="hover:opacity-70">Leaderboard</Link>
        </nav>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardPath()}
                className="hidden sm:inline-block text-sm font-medium px-4 py-2 rounded-full border border-black/10 hover:border-black/30 transition-colors"
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
                className="hidden sm:inline-block text-sm font-medium px-4 py-2 rounded-full border border-black/10 hover:border-black/30 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-white text-sm font-medium px-5 py-2 rounded-full transition-transform hover:scale-105"
                style={{ background: PRIMARY }}
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
