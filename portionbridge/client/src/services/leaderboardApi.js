import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
}

/**
 * Leaderboard API Service
 * Handles API calls for leaderboard endpoints
 */
const leaderboardApi = {
  /**
   * Get top donors leaderboard
   * @param {Object} params - Query parameters (page, limit, sortBy, sortOrder)
   * @returns {Promise<Object>} API response with donors data and pagination meta
   */
  getTopDonors: async (params = {}) => {
    const response = await axios.get(`${API_BASE_URL}/leaderboard/donors`, {
      params,
      withCredentials: true,
      headers: authHeaders(),
    });
    return response.data;
  },

  /**
   * Get top volunteers leaderboard
   * @param {Object} params - Query parameters (page, limit, sortBy, sortOrder)
   * @returns {Promise<Object>} API response with volunteers data and pagination meta
   */
  getTopVolunteers: async (params = {}) => {
    const response = await axios.get(`${API_BASE_URL}/leaderboard/volunteers`, {
      params,
      withCredentials: true,
      headers: authHeaders(),
    });
    return response.data;
  },
};

export default leaderboardApi;
