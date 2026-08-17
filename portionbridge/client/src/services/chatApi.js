import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

function getAuthToken() {
  return localStorage.getItem('accessToken');
}

/**
 * Chat API service for donor-volunteer messaging
 */
export const chatApi = {
  /**
   * Get chat messages for a donation
   * @param {number} donationId - Donation ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 50)
   */
  async getMessages(donationId, params = {}) {
    const response = await axios.get(`${API_BASE_URL}/chat/${donationId}/messages`, {
      params,
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      withCredentials: true,
    });
    return response.data;
  },

  /**
   * Get latest message for a donation
   * @param {number} donationId - Donation ID
   */
  async getLatestMessage(donationId) {
    const response = await axios.get(`${API_BASE_URL}/chat/${donationId}/latest`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      withCredentials: true,
    });
    return response.data;
  },

  /**
   * Get unread message count for a donation
   * @param {number} donationId - Donation ID
   */
  async getUnreadCount(donationId) {
    const response = await axios.get(`${API_BASE_URL}/chat/${donationId}/unread-count`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      withCredentials: true,
    });
    return response.data;
  },

  /**
   * Get total unread message count across all donations
   */
  async getUnreadCountForUser() {
    const response = await axios.get(`${API_BASE_URL}/chat/unread-count`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      withCredentials: true,
    });
    return response.data;
  },
};
