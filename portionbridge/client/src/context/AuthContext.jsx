import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const AuthContext = createContext(null);

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
    setLoading(false);
  }, []);

  /**
   * Login using existing backend API
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} role - User role (donor, volunteer, leader, admin)
   */
  const login = async (email, password, role = 'volunteer') => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password,
        role,
      });

      const { accessToken, user: userData } = res.data.data;
      
      // Store token and user data
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed. Please try again.";
      return { success: false, error: message };
    }
  };

  /**
   * Logout using existing backend API
   */
  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await axios.post(`${API_BASE}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
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
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
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
