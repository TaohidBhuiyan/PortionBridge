import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
}

/**
 * Rating API service for donor-volunteer ratings
 *
 * PHASE — Donor UI/UX pass: same missing-Authorization-header bug found
 * across several service files during the profile picture audit — fixed
 * here too. RatingSubmission was silently unable to submit any rating.
 */
export const ratingApi = {
  /**
   * Submit a rating for a completed donation
   * @param {Object} data - Rating data
   * @param {number} data.donationId - Donation ID
   * @param {number} data.rating - Rating value (1-5)
   * @param {string} data.comment - Optional comment
   */
  async createRating(data) {
    const response = await axios.post(`${API_BASE_URL}/ratings`, data, {
      withCredentials: true,
      headers: authHeaders(),
    });
    return response.data;
  },

  /**
   * Get rating for a specific donation
   * @param {number} donationId - Donation ID
   */
  async getRatingByDonation(donationId) {
    const response = await axios.get(`${API_BASE_URL}/ratings/${donationId}`, {
      withCredentials: true,
      headers: authHeaders(),
    });
    return response.data;
  },
};
