import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === 'true';
const DEV_BYPASS_TOKEN = 'dev-bypass-token';

/**
 * ProtectedRoute - Component to protect routes that require authentication
 * Redirects to login page if user is not authenticated
 * In development mode, allows direct access to dashboards without login
 */
export function ProtectedRoute({ children, requiredRole = null }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Development mode: Auto-login based on URL path
  useEffect(() => {
    if (isDevelopment && !isAuthenticated && !loading) {
      const path = location.pathname;
      let role = null;

      if (path.includes('/donor/dashboard')) {
        role = 'donor';
      } else if (path.includes('/volunteer/dashboard')) {
        role = 'volunteer';
      } else if (path.includes('/admin/dashboard')) {
        role = 'admin';
      }

      if (role) {
        // Auto-login with dev bypass token
        const devUser = {
          id: `dev-${role}`,
          role: role,
          email: `dev-${role}@portionbridge.dev`,
          name: `Dev ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        };
        
        localStorage.setItem('accessToken', DEV_BYPASS_TOKEN);
        localStorage.setItem('user', JSON.stringify(devUser));
        
        // Force page reload to update auth state
        window.location.reload();
      }
    }
  }, [isDevelopment, isAuthenticated, loading, location.pathname]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated (only in production)
  if (!isAuthenticated && !isDevelopment) {
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
