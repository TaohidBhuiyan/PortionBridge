import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute - Component to protect routes that require authentication
 * Redirects to login page if user is not authenticated
 * 
 * DEVELOPMENT MODE: In local development (import.meta.env.DEV), allows dashboard
 * access for UI development purposes. This does NOT bypass backend authentication -
 * API calls will still fail unless properly authenticated. This is purely for
 * UI/UX development convenience.
 */
export function ProtectedRoute({ children, requiredRole = null }) {
  const { user, isAuthenticated, loading, devModeDashboardAccess, setDevUser } = useAuth();

  // Set mock user in development mode when accessing a dashboard
  useEffect(() => {
    if (devModeDashboardAccess && import.meta.env.DEV && requiredRole) {
      if (!user || user.role !== requiredRole) {
        setDevUser(requiredRole);
      }
    }
  }, [devModeDashboardAccess, requiredRole, user, setDevUser]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // DEVELOPMENT MODE: Allow dashboard access for UI development
  // This does NOT authenticate with backend - API calls will still require real auth
  if (devModeDashboardAccess && import.meta.env.DEV && requiredRole) {
    // In development mode, show a warning banner but allow access for UI work
    return (
      <>
        <div className="bg-yellow-500 text-black px-4 py-2 text-center text-sm font-medium">
          ⚠️ Development Mode: Dashboard UI only - Backend API calls require real authentication
        </div>
        {children}
      </>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user's role
    const roleRedirects = {
      donor: '/donor/dashboard',
      volunteer: '/volunteer/dashboard',
      admin: '/admin/dashboard',
    };
    const redirectPath = roleRedirects[user?.role] || '/';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
