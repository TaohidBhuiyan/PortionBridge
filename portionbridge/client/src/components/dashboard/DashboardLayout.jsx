import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { PageTransition } from './PageTransition';
import { useAuth } from '../../context/AuthContext';

/**
 * DashboardLayout - Main layout wrapper for all dashboard pages
 * Provides Sidebar, TopNavbar, and Main Content Area
 * Reusable across Donor, Volunteer, and Admin dashboards
 */
export function DashboardLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize dark mode from localStorage, default to light mode
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    // Synchronizing with an external system (localStorage) on mount is a
    // textbook valid effect use case.
    if (savedDarkMode !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDarkMode(JSON.parse(savedDarkMode));
    } else {
      // Default to light mode
      setDarkMode(false);
    }
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Stay in sync if dark mode is changed elsewhere in the same tab (e.g. the
  // theme selector on the Settings page), since the `storage` event only
  // fires in *other* tabs, not this one.
  useEffect(() => {
    const handleExternalChange = (e) => setDarkMode(!!e.detail);
    window.addEventListener('portionbridge:darkmode', handleExternalChange);
    return () => window.removeEventListener('portionbridge:darkmode', handleExternalChange);
  }, []);

  // Handle sidebar collapse on desktop
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Handle sidebar drawer on mobile
  const toggleMobileSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close mobile sidebar when route changes
  useEffect(() => {
    // Synchronizing local UI state with the router's current location is a
    // valid effect use case, not the data-fetching pattern this rule targets.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarOpen(false);
  }, [location.pathname]);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen bg-page transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        open={sidebarOpen}
        onToggle={toggleSidebar}
        onMobileToggle={toggleMobileSidebar}
        userRole={user?.role}
        currentPath={location.pathname}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div
        className={`transition-all duration-200 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'
        }`}
      >
        {/* Top Navbar */}
        <TopNavbar
          onMobileSidebarToggle={toggleMobileSidebar}
          darkMode={darkMode}
          onDarkModeToggle={() => setDarkMode(!darkMode)}
          user={user}
          onLogout={handleLogout}
        />

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-64px)]">
          {/* PHASE 11 PART B — wide-screen QA: nothing previously capped this
              container's width, so on very large/ultrawide monitors, pages
              with no max-width of their own (most Admin pages, the role
              dashboards) stretched edge-to-edge, leaving stat strips/tables
              awkwardly spread out. This cap is generous enough that it
              never fights a page's own inner max-w (e.g. MyDonationsPage's
              max-w-7xl), it only stops truly excessive stretching. */}
          <div className="max-w-screen-2xl mx-auto w-full">
            <PageTransition pageKey={location.pathname}>
              {children || <Outlet />}
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
