import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem('accessToken');
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

/**
 * Donation API Service
 * Handles all donation-related API calls
 */
export const donationApi = {
  /**
   * Create a new donation
   * @param {Object} donationData - Donation form data
   * @returns {Promise<Object>} Created donation data
   */
  createDonation: async (donationData) => {
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      
      const response = await axios.post(
        `${API_BASE}/donations`,
        donationData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-csrf-token': csrfToken,
          },
        }
      );
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create donation';
      const errors = error.response?.data?.errors || null;
      return { success: false, error: message, errors };
    }
  },

  /**
   * Upload an image for a donation
   * @param {number} donationId - Donation ID
   * @param {File} imageFile - Image file to upload
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload result
   */
  uploadDonationImage: async (donationId, imageFile, onProgress) => {
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await axios.post(
        `${API_BASE}/uploads/donation/${donationId}/image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-csrf-token': csrfToken,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(percentCompleted);
            }
          },
        }
      );
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to upload image';
      return { success: false, error: message };
    }
  },

  /**
   * Get donation details by ID
   * @param {number} donationId - Donation ID
   * @returns {Promise<Object>} Donation data
   */
  getDonationDetails: async (donationId) => {
    try {
      const token = getAuthToken();
      
      const response = await axios.get(
        `${API_BASE}/donations/${donationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch donation details';
      return { success: false, error: message };
    }
  },

  /**
   * Get master data for dropdowns
   * @returns {Promise<Object>} Master data
   */
  getMasterData: async () => {
    try {
      const response = await axios.get(`${API_BASE}/master/all`);
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch master data';
      return { success: false, error: message };
    }
  },

  /**
   * Get user's saved addresses
   * @returns {Promise<Object>} Saved addresses
   */
  getSavedAddresses: async () => {
    try {
      const token = getAuthToken();
      
      const response = await axios.get(
        `${API_BASE}/addresses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return { success: true, data: response.data.data };
    } catch (error) {
      // If endpoint doesn't exist, return empty array
      if (error.response?.status === 404) {
        return { success: true, data: { addresses: [] } };
      }
      const message = error.response?.data?.message || 'Failed to fetch saved addresses';
      return { success: false, error: message };
    }
  },

  /**
   * Get donor's donation history
   * @param {Object} filters - Query filters (status, category, search, sortBy, sortOrder, page, limit)
   * @returns {Promise<Object>} Donations list with pagination
   */
  getDonorHistory: async (filters = {}) => {
    try {
      const token = getAuthToken();
      
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await axios.get(
        `${API_BASE}/donations/my-history${params.toString() ? '?' + params.toString() : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch donation history';
      return { success: false, error: message };
    }
  },

  /**
   * Get donor's donation history summary
   * @returns {Promise<Object>} Donation statistics
   */
  getDonorHistorySummary: async () => {
    try {
      const token = getAuthToken();
      
      const response = await axios.get(
        `${API_BASE}/donations/my-history/summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch donation summary';
      return { success: false, error: message };
    }
  },

  /**
   * Cancel a donation
   * @param {number} donationId - Donation ID
   * @returns {Promise<Object>} Cancellation result
   */
  cancelDonation: async (donationId) => {
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      
      const response = await axios.delete(
        `${API_BASE}/donations/${donationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-csrf-token': csrfToken,
          },
        }
      );
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to cancel donation';
      return { success: false, error: message };
    }
  },

  /**
   * Update a donation
   * @param {number} donationId - Donation ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Update result
   */
  updateDonation: async (donationId, updates) => {
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      
      const response = await axios.patch(
        `${API_BASE}/donations/${donationId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-csrf-token': csrfToken,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update donation';
      return { success: false, error: message };
    }
  },
};

/**
 * Transform form data to API request format
 * @param {Object} formData - Form data from DonationFormPage
 * @returns {Object} API request body
 */
export const transformFormDataToApi = (formData) => {
  const apiData = {
    title: formData.title,
    category: formData.category,
    description: formData.description,
    quantity: formData.quantity,
    quantityUnit: formData.quantityUnit,
    contactPhone: formData.contactPhone,
    pickupDate: formData.pickupDate,
    pickupTimeSlot: formData.pickupTimeSlot,
    specialInstructions: formData.specialInstructions,
  };

  // Category-specific fields
  if (formData.category === 'food') {
    apiData.foodType = formData.foodType;
    apiData.foodName = formData.foodName;
    apiData.numberOfServings = formData.numberOfServings;
    apiData.ingredients = formData.ingredients;
    apiData.allergens = formData.allergens;
    apiData.storageRequirement = formData.storageRequirement;
    apiData.isVegetarian = formData.isVegetarian;
    apiData.isHalal = formData.isHalal;
    apiData.expiryDate = formData.expiryDate;
  } else if (formData.category === 'clothes') {
    apiData.clothingCategory = formData.clothingCategory;
    apiData.gender = formData.gender;
    apiData.ageGroup = formData.ageGroup;
    apiData.itemCondition = formData.itemCondition;
    apiData.brand = formData.brand;
    apiData.size = formData.size;
    apiData.color = formData.color;
    apiData.season = formData.season;
  }

  // Address fields
  if (formData.savedAddressId) {
    apiData.savedAddressId = formData.savedAddressId;
  } else if (formData.pickupAddress) {
    apiData.pickupAddress = formData.pickupAddress;
  }

  return apiData;
};
