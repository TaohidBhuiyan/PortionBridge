import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

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
    });
    return response.data;
  },

  /**
   * Get notification settings
   */
  async getNotificationSettings() {
    const response = await axios.get(`${API_BASE_URL}/profile/notifications`, {
      withCredentials: true,
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
    });
    return response.data;
  },
};
