import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem('accessToken');
};

/**
 * Volunteer Discovery API Service
 * Handles all location-based volunteer discovery API calls
 */
export const volunteerDiscoveryApi = {
  /**
   * Find nearby volunteers based on location
   * @param {Object} params - Query parameters
   * @param {number} params.latitude - Donor's latitude
   * @param {number} params.longitude - Donor's longitude
   * @param {number} params.radius - Search radius in km (default: 10)
   * @param {boolean} params.availableOnly - Filter only available volunteers
   * @param {boolean} params.onlineOnly - Filter only online volunteers
   * @param {string} params.specialty - Filter by specialty (food/clothes)
   * @param {string} params.search - Search by name or team
   * @param {string} params.sortBy - Sort by distance/rating/pickups
   * @param {string} params.sortOrder - Sort direction asc/desc
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @returns {Promise<Object>} Nearby volunteers with pagination
   */
  findNearbyVolunteers: async (params = {}) => {
    try {
      const token = getAuthToken();
      
      const queryParams = new URLSearchParams();
      if (params.latitude) queryParams.append('latitude', params.latitude);
      if (params.longitude) queryParams.append('longitude', params.longitude);
      if (params.radius) queryParams.append('radius', params.radius);
      if (params.availableOnly !== undefined) queryParams.append('availableOnly', params.availableOnly);
      if (params.onlineOnly !== undefined) queryParams.append('onlineOnly', params.onlineOnly);
      if (params.specialty) queryParams.append('specialty', params.specialty);
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const response = await axios.get(
        `${API_BASE}/volunteer-discovery/nearby${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return { success: true, data: response.data.data, meta: response.data.meta };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to find nearby volunteers';
      return { success: false, error: message };
    }
  },

  /**
   * Find nearby teams based on location
   * @param {Object} params - Query parameters
   * @param {number} params.latitude - Donor's latitude
   * @param {number} params.longitude - Donor's longitude
   * @param {number} params.radius - Search radius in km (default: 15)
   * @param {string} params.search - Search by team name
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @returns {Promise<Object>} Nearby teams with pagination
   */
  findNearbyTeams: async (params = {}) => {
    try {
      const token = getAuthToken();
      
      const queryParams = new URLSearchParams();
      if (params.latitude) queryParams.append('latitude', params.latitude);
      if (params.longitude) queryParams.append('longitude', params.longitude);
      if (params.radius) queryParams.append('radius', params.radius);
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const response = await axios.get(
        `${API_BASE}/volunteer-discovery/nearby-teams${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return { success: true, data: response.data.data, meta: response.data.meta };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to find nearby teams';
      return { success: false, error: message };
    }
  },

  /**
   * Update volunteer's current location (volunteer only)
   * @param {Object} locationData - Location data
   * @param {number} locationData.latitude - Latitude
   * @param {number} locationData.longitude - Longitude
   * @param {boolean} locationData.isOnline - Online status
   * @returns {Promise<Object>} Update result
   */
  updateVolunteerLocation: async (locationData) => {
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      
      const response = await axios.put(
        `${API_BASE}/volunteer-discovery/my-location`,
        locationData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-csrf-token': csrfToken,
          },
        }
      );
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update location';
      return { success: false, error: message };
    }
  },

  /**
   * Update team's base location (team leader only)
   * @param {number} teamId - Team ID
   * @param {Object} locationData - Location data
   * @param {number} locationData.latitude - Latitude
   * @param {number} locationData.longitude - Longitude
   * @param {number} locationData.coverageRadius - Coverage radius in km
   * @returns {Promise<Object>} Update result
   */
  updateTeamLocation: async (teamId, locationData) => {
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      
      const response = await axios.put(
        `${API_BASE}/volunteer-discovery/teams/${teamId}/location`,
        locationData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-csrf-token': csrfToken,
          },
        }
      );
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update team location';
      return { success: false, error: message };
    }
  },

  /**
   * Get the recommended volunteer for a pickup location
   * @param {Object} params - Query parameters
   * @param {number} params.latitude - Donor latitude
   * @param {number} params.longitude - Donor longitude
   * @param {string} [params.pickupTime] - Pickup time
   * @param {string} [params.category] - Donation category
   * @returns {Promise<Object>} Recommended volunteer data
   */
  getRecommendedVolunteer: async (params = {}) => {
    try {
      const token = getAuthToken();
      const queryParams = new URLSearchParams();
      if (params.latitude !== undefined) queryParams.append('latitude', params.latitude);
      if (params.longitude !== undefined) queryParams.append('longitude', params.longitude);
      if (params.pickupTime) queryParams.append('pickupTime', params.pickupTime);
      if (params.category) queryParams.append('category', params.category);

      const response = await axios.get(
        `${API_BASE}/volunteer-discovery/recommend${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch recommended volunteer';
      return { success: false, error: message };
    }
  },

  /**
   * Get volunteer statistics for discovery
   * @param {number} volunteerId - Volunteer ID
   * @returns {Promise<Object>} Volunteer statistics
   */
  getVolunteerStats: async (volunteerId) => {
    try {
      const token = getAuthToken();
      
      const response = await axios.get(
        `${API_BASE}/volunteer-discovery/volunteer/${volunteerId}/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch volunteer stats';
      return { success: false, error: message };
    }
  },
};

// Helper to get CSRF token
const getCsrfToken = () => {
  const name = 'csrfToken=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
};
