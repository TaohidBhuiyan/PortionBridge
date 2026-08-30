import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Enable sending and receiving cookies in cross-origin requests
axios.defaults.withCredentials = true;

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const AuthContext = createContext(null);

// Helper to retrieve the CSRF token from document.cookie
function getCsrfToken() {
  const name = 'csrfToken=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}

/**
 * AuthProvider - Manages authentication state across the application
 * Integrates with existing backend auth API
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser && mounted) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
        }
      }

      if (mounted) {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // PRODUCTION AUDIT FIX: access tokens expire after 15 minutes
  // (JWT_ACCESS_EXPIRES_IN=15m) and the backend already has a working
  // POST /auth/refresh-token endpoint (httpOnly refresh cookie + CSRF),
  // but nothing on the frontend ever called it — grepped the whole
  // client for any interceptor or refresh-token usage and found none.
  // In practice this meant every session silently started failing all
  // API calls with 401s after 15 minutes, with no recovery short of a
  // full manual re-login. This registers a single global axios response
  // interceptor that transparently refreshes once on a 401 and retries
  // the original request; if the refresh itself fails (refresh cookie
  // also expired/invalid), it logs out and sends the person to /login,
  // same as an explicit logout would.
  useEffect(() => {
    let refreshInFlight = null;

    const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/google-login'];
    const DEV_BYPASS_TOKEN = 'dev-bypass-token';

    const performRefresh = async () => {
      if (!refreshInFlight) {
        refreshInFlight = axios
          .post(`${API_BASE}/auth/refresh-token`, {}, {
            headers: { 'x-csrf-token': getCsrfToken() },
          })
          .then((res) => {
            const { accessToken, user: refreshedUser } = res.data.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('user', JSON.stringify(refreshedUser));
            setUser(refreshedUser);
            return accessToken;
          })
          .finally(() => {
            refreshInFlight = null;
          });
      }
      return refreshInFlight;
    };

    // Request interceptor to add dev role header for dev bypass token
    const requestInterceptorId = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      if (token === DEV_BYPASS_TOKEN && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          config.headers['x-dev-role'] = userData.role;
        } catch (e) {
          console.error('Failed to parse stored user for dev role:', e);
        }
      }
      return config;
    });

    const responseInterceptorId = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const isAuthEndpoint = originalRequest?.url && NO_REFRESH_PATHS.some((p) => originalRequest.url.includes(p));

        if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retried) {
          originalRequest._retried = true;
          try {
            const newAccessToken = await performRefresh();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setUser(null);
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptorId);
      axios.interceptors.response.eject(responseInterceptorId);
    };
  }, []);

  /**
   * Login using the existing backend API.
   *
   * PRODUCTION AUDIT FIX: this previously tried up to 3 separate login
   * requests in sequence (volunteer, then donor, then admin) to work
   * around the backend requiring a `role` field — a pattern that made
   * every legitimate login by a donor or admin count as 2-3 requests
   * against the login rate limiter (which was also found disabled and
   * re-enabled as part of this audit), and generally isn't necessary:
   * email is globally unique per user account, so the backend can now
   * determine the role itself. `role` is optional here and, if provided,
   * is still enforced as a sanity check server-side (see
   * auth.service.js#login) — but the normal login flow no longer guesses.
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} [role] - Optional role to assert (rarely needed)
   */
  const login = async (email, password, role) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password,
        ...(role ? { role } : {}),
      });

      const { accessToken, user: userData } = res.data.data;

      // Store token and user data
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed. Please try again.";
      const errors = error.response?.data?.errors || null;
      return { success: false, error: message, errors };
    }
  };

  /**
   * Logout using existing backend API
   */
  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const csrfToken = getCsrfToken();
      if (token) {
        await axios.post(`${API_BASE}/auth/logout`, {}, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'x-csrf-token': csrfToken
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call result
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  /**
   * Register using existing backend API
   * @param {Object} userData - User registration data
   */
  const register = async (userData) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, userData);
      return { success: true, data: res.data.data };
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed. Please try again.";
      const errors = error.response?.data?.errors || null;
      return { success: false, error: message, errors };
    }
  };

  const googleLogin = async (idToken, initialRole) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/google-login`, {
        idToken,
        role: initialRole,
      });
      const { accessToken, user: userData } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || "Google login failed.";
      return { success: false, error: message };
    }
  };

  /**
   * Verify email using existing backend API
   * @param {string} token - Verification token
   */
  const verifyEmail = async (token) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/verify-email`, { token });
      return { success: true, message: res.data.message };
    } catch (error) {
      const message = error.response?.data?.message || "Email verification failed.";
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    googleLogin,
    verifyEmail,
    isAuthenticated: !!user,
    userRole: user?.role,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth - Hook to access auth context
 * @returns {Object} Auth context value
 */
// eslint-disable-next-line react-refresh/only-export-components -- standard Context+hook co-location pattern; splitting would only help dev-mode Fast Refresh, at the cost of touching every import site in the app
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
