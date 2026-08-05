import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

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
    });
    return response.data;
  },

  /**
   * Check and unlock achievements for current user
   */
  async checkAchievements() {
    const response = await axios.post(`${API_BASE_URL}/achievements/check`, {}, {
      withCredentials: true,
    });
    return response.data;
  },
};
