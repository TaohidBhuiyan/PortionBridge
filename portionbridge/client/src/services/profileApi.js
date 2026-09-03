import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * PHASE — Profile Picture Audit: every method in this file was calling
 * the backend with only `withCredentials: true` and no Authorization
 * header at all. The `protect` auth middleware only ever reads
 * `req.headers.authorization` (confirmed by reading it directly, and by
 * a live request against a real running instance: the exact same request
 * this file was making returned 401 "Authentication required. No token
 * provided."). That means the entire Profile page, Settings page, and
 * preferences/notification-settings flows were unauthenticated and
 * broken for every user, for every role — not something specific to
 * profile photos, but it fully blocked verifying (or using) that feature
 * at all. Fixed once here via a shared header helper, matching the
 * pattern already used correctly in donationApi.js/chatApi.js.
 */
function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}`, };
}

/**
 * Profile API service for user profile and account management
 */
export const profileApi = {
  /**
   * Get current user's complete profile
   */
  async getProfile() {
    const response = await axios.get(`${API_BASE_URL}/profile`, {
      withCredentials: true,
      headers: authHeaders(),
    });
    return response.data;
  },

  /**
   * Update profile information
   * @param {Object} data - Profile data
   * @param {string} data.name - Full name
   * @param {string} data.phone - Phone number
   * @param {string} data.address - Address
   * @param {string} data.dateOfBirth - Date of birth
   * @param {string} data.gender - Gender
   */
  async updateProfile(data) {
    const response = await axios.patch(`${API_BASE_URL}/profile`, data, {
      withCredentials: true,
      headers: authHeaders(),
    });
    return response.data;
  },

  /**
   * Upload a new profile photo for the authenticated user.
   * Backend: POST /uploads/profile/photo (server/routes/v1/upload.routes.js),
   * already implemented with magic-byte validation and multer size/type
   * limits (server/middleware/upload.middleware.js) — this was simply
   * never called from anywhere in the frontend before now.
   * @param {File} file - Image file selected by the user
   */
  async uploadPhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await axios.post(`${API_BASE_URL}/uploads/profile/photo`, formData, {
      withCredentials: true,
      headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Change password
   * @param {Object} data - Password data
   * @param {string} data.currentPassword - Current password
   * @param {string} data.newPassword - New password
   * @param {string} data.confirmPassword - Confirm new password
   */
  async changePassword(data) {
    const response = await axios.post(`${API_BASE_URL}/profile/change-password`, data, {
      withCredentials: true,
      headers: authHeaders(),
    });
    return response.data;
  },

  /**
   * Update email address
   * @param {Object} data - Email data
   * @param {string} data.newEmail - New email address
   * @param {string} data.password - Current password for verification
   */
  async updateEmail(data) {
    const response = await axios.post(`${API_BASE_URL}/profile/update-email`, data, {
      withCredentials: true,
      headers: authHeaders(),
    });
    return response.data;
  },

  /**
   * Update phone number
   * @param {Object} data - Phone data
   * @param {string} data.newPhone - New phone number
   * @param {string} data.password - Current password for verification
   */
  async updatePhone(data) {
    const response = await axios.post(`${API_BASE_URL}/profile/update-phone`, data, {
      withCredentials: true,
      headers: authHeaders(),
    });
    return response.data;
  },

  /**
   * Update donor preferences
   * @param {Object} data - Preferences data
   * @param {string} data.preferredPickupTimeSlot - Preferred pickup time slot
   * @param {string} data.preferredContactMethod - Preferred contact method
   */
  async updatePreferences(data) {
    const response = await axios.patch(`${API_BASE_URL}/profile/preferences`, data, {
      withCredentials: true,
      headers: authHeaders(),
    });
    return response.data;
  },

  /**
   * Get notification settings
   */
  async getNotificationSettings() {
    const response = await axios.get(`${API_BASE_URL}/profile/notifications`, {
      withCredentials: true,
      headers: authHeaders(),
    });
    return response.data;
  },

  /**
   * Update notification settings
   * @param {Object} data - Notification settings
   * @param {boolean} data.emailNotifications - Email notifications enabled
   * @param {boolean} data.smsNotifications - SMS notifications enabled
   * @param {boolean} data.pushNotifications - Push notifications enabled
   * @param {boolean} data.donationUpdates - Donation updates enabled
   * @param {boolean} data.pickupUpdates - Pickup updates enabled
   * @param {boolean} data.chatNotifications - Chat notifications enabled
   */
  async updateNotificationSettings(data) {
    const response = await axios.patch(`${API_BASE_URL}/profile/notifications`, data, {
      withCredentials: true,
      headers: authHeaders(),
    });
    return response.data;
  },
};
