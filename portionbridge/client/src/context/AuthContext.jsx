import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Enable sending and receiving cookies in cross-origin requests
axios.defaults.withCredentials = true;

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const DEV_DONOR_USER = {
  id: 2,
  name: 'Rahim Uddin',
  email: 'rahim.donor@example.com',
  role: 'donor',
  phone: '01700000002',
  address: 'Gulshan, Dhaka',
  profile_photo: null,
  provider: null,
  google_id: null,
  profile_picture: null,
  is_banned: 0,
  is_deleted: 0,
  email_verified: 1,
  phone_verified: 1,
  failed_login_attempts: 0,
  lock_until: null,
  last_login_at: null,
  last_login_ip: null,
  last_user_agent: null,
  date_of_birth: null,
  gender: null,
  created_at: null,
  updated_at: null,
};

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
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      }
    }

    if (!token && !storedUser && import.meta.env.MODE === 'development') {
      localStorage.setItem('accessToken', 'dev-bypass-token');
      localStorage.setItem('user', JSON.stringify(DEV_DONOR_USER));
      setUser(DEV_DONOR_USER);
    }

    setLoading(false);
  }, []);

  /**
   * Login using existing backend API, trying roles sequentially if needed
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} initialRole - Preferred login role
   */
  const login = async (email, password, initialRole) => {
    const rolesToTry = initialRole ? [initialRole] : [];
    const allRoles = ['volunteer', 'donor', 'admin'];
    
    allRoles.forEach(r => {
      if (!rolesToTry.includes(r)) {
        rolesToTry.push(r);
      }
    });

    let lastError = "Login failed. Please try again.";
    let lastErrorsArray = null;

    for (const r of rolesToTry) {
      try {
        const res = await axios.post(`${API_BASE}/auth/login`, {
          email,
          password,
          role: r,
        });

        const { accessToken, user: userData } = res.data.data;
        
        // Store token and user data
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        return { success: true, user: userData };
      } catch (error) {
        lastError = error.response?.data?.message || "Login failed. Please try again.";
        lastErrorsArray = error.response?.data?.errors || null;

        // Terminate early for validation errors (422) or lockouts/banned/unverified (403)
        if (error.response?.status === 422 || error.response?.status === 403) {
          return { success: false, error: lastError, errors: lastErrorsArray };
        }
      }
    }

    return { success: false, error: lastError, errors: lastErrorsArray };
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
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
