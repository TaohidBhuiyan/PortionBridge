import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * Volunteer Profile API Service
 * Handles all volunteer profile-related API calls (public endpoints)
 */
export const volunteerProfileApi = {
  /**
   * Get volunteer profile by ID (public endpoint)
   * @param {number} volunteerId - Volunteer ID
   * @returns {Promise<Object>} Volunteer profile data
   */
  getVolunteerProfile: async (volunteerId) => {
    try {
      const response = await axios.get(
        `${API_BASE}/public/volunteers/${volunteerId}`
      );
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch volunteer profile';
      return { success: false, error: message };
    }
  },

  /**
   * Get volunteer reviews by ID (public endpoint)
   * @param {number} volunteerId - Volunteer ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @returns {Promise<Object>} Volunteer reviews with pagination
   */
  getVolunteerReviews: async (volunteerId, params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const response = await axios.get(
        `${API_BASE}/public/volunteers/${volunteerId}/reviews${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      );
      
      return { success: true, data: response.data.data, meta: response.data.meta };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch volunteer reviews';
      return { success: false, error: message };
    }
  },
};
