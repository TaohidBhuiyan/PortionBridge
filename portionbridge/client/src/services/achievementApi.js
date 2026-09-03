import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// PHASE — Donor UI/UX pass: this file (and ratingApi.js, analyticsApi.js)
// had the same bug found and fixed in profileApi.js during the profile
// picture audit — every call relied only on `withCredentials: true` with
// no Authorization header, but the backend's `protect` middleware only
// ever reads `req.headers.authorization`. Confirmed live: these endpoints
// were silently 401-ing for every user, meaning achievements (used by the
// AchievementsPanel on the redesigned Donor Dashboard) never actually loaded.
function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
}

/**
 * Achievement API service for user achievements
 */
export const achievementApi = {
  /**
   * Get current user's achievements
   */
  async getUserAchievements() {
    const response = await axios.get(`${API_BASE_URL}/achievements`, {
      withCredentials: true,
      headers: authHeaders(),
    });
    return response.data;
  },

  /**
   * Get all available achievement definitions
   * @param {Object} params - Query parameters
   * @param {string} params.role - Filter by role (donor, volunteer, both)
   */
  async getAchievementDefinitions(params = {}) {
    const response = await axios.get(`${API_BASE_URL}/achievements/definitions`, {
      params,
      withCredentials: true,
      headers: authHeaders(),
    });
    return response.data;
  },

  /**
   * Check and unlock achievements for current user
   */
  async checkAchievements() {
    const response = await axios.post(`${API_BASE_URL}/achievements/check`, {}, {
      withCredentials: true,
      headers: authHeaders(),
    });
    return response.data;
  },
};
