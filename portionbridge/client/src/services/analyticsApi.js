import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
}

/**
 * Analytics API service for donor analytics
 *
 * PHASE — Donor UI/UX pass: same missing-Authorization-header bug found
 * across several service files during the profile picture audit — fixed
 * here too. DonorAnalyticsPage was silently unable to load real statistics.
 */
export const analyticsApi = {
  /**
   * Get donor statistics with optional time range filter
   * @param {Object} params - Query parameters
   * @param {string} [params.timeRange] - Time range filter (this_month, last_3_months, last_6_months, all_time)
   */
  async getDonationStatistics(params = {}) {
    const response = await axios.get(`${API_BASE_URL}/profile/donor/statistics`, {
      params,
      withCredentials: true,
      headers: authHeaders(),
    });
    return response.data;
  },
};
