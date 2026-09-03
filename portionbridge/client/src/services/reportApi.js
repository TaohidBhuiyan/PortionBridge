import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
}

/**
 * Report API — the backend (server/routes/v1/report.routes.js) already had
 * a complete POST /reports + GET /reports/my for donors and volunteers to
 * file/view reports about a specific donation, but no frontend ever called
 * it — Admin could only ever view/moderate reports that no one could file.
 */
export const reportApi = {
  /**
   * File a report about a specific donation.
   * @param {Object} data
   * @param {number} data.donationId
   * @param {string} data.reason
   * @param {string} [data.details]
   * @param {number} [data.reportedUserId]
   */
  async createReport(data) {
    const response = await axios.post(`${API_BASE_URL}/reports`, data, { headers: authHeaders() });
    return response.data;
  },

  /**
   * List reports filed by the current user.
   */
  async getMyReports(params = {}) {
    const response = await axios.get(`${API_BASE_URL}/reports/my`, { params, headers: authHeaders() });
    return response.data;
  },
};
