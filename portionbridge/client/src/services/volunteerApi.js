import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Same helper pattern as adminApi.js/teamApi.js/donationApi.js.
const getAuthToken = () => localStorage.getItem('accessToken');

/**
 * Volunteer API service.
 *
 * Phase 5 adds getAssignmentDetail, wired to the existing (previously
 * frontend-unused) GET /volunteer/assignments/:id endpoint — enriched
 * server-side this phase with donor name/phone, real pickup coordinates
 * (when available), and team roster/online-status for team-mode donations.
 */
export const volunteerApi = {
  /**
   * Get full mission detail for the volunteer's own assignment — donor
   * contact, pickup coordinates (may be null — see server-side docs),
   * status, and team info if applicable.
   * GET /volunteer/assignments/:id
   */
  getAssignmentDetail: async (donationId) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE}/volunteer/assignments/${donationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data.data?.assignment };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch mission details';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },
};