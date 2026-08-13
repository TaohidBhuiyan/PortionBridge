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

  // ==========================================================================
  // PHASE 3 — Volunteer opportunity discovery + mission actions.
  // These call the same existing backend endpoints audited in Phase 0/1/3
  // (GET /donations, PATCH /:id/accept|schedule|on-the-way|picked-up) —
  // no new backend routes. Kept in this same service object rather than a
  // separate volunteerApi.js, since they operate on the same `donations`
  // resource as everything above.
  // ==========================================================================

  /**
   * Browse available (pending) donation opportunities for volunteers.
   * Backed by the existing GET /donations endpoint (donationService.browseDonations),
   * which already supports category/location/search/sort/pagination — reused
   * as-is, no new discovery API.
   * @param {Object} filters - category, location, search, sortBy, sortOrder, page, limit
   * @returns {Promise<Object>} { success, data: { donations, meta } }
   */
  browseDonations: async (filters = {}) => {
    try {
      const token = getAuthToken();

      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await axios.get(
        `${API_BASE}/donations${params.toString() ? '?' + params.toString() : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return { success: true, data: response.data.data, meta: response.data.meta };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch donation opportunities';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /**
   * Accept a pending donation as the current volunteer.
   * PATCH /donations/:id/accept — row-lock guarded server-side, so a 409
   * response here means another volunteer accepted it first. The caller
   * is expected to surface `status === 409` distinctly (see
   * VolunteerOpportunities.jsx and DonationDetailsPage.jsx) rather than
   * treating it as a generic failure.
   * @param {number} donationId
   * @returns {Promise<Object>} { success, data: { donation } } or { success:false, error, status }
   */
  acceptDonation: async (donationId) => {
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();

      const response = await axios.patch(
        `${API_BASE}/donations/${donationId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-csrf-token': csrfToken,
          },
        }
      );

      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to accept donation';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /**
   * Schedule a pickup time for a donation the volunteer has already accepted.
   * PATCH /donations/:id/schedule, body: { scheduledAt: ISO 8601 string }.
   * @param {number} donationId
   * @param {string} scheduledAt - ISO 8601 datetime, must be in the future
   * @returns {Promise<Object>}
   */
  schedulePickup: async (donationId, scheduledAt) => {
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();

      const response = await axios.patch(
        `${API_BASE}/donations/${donationId}/schedule`,
        { scheduledAt },
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
      const message = error.response?.data?.message || 'Failed to schedule pickup';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /**
   * Mark a scheduled donation as on the way. PATCH /donations/:id/on-the-way.
   * @param {number} donationId
   * @returns {Promise<Object>}
   */
  markOnTheWay: async (donationId) => {
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();

      const response = await axios.patch(
        `${API_BASE}/donations/${donationId}/on-the-way`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-csrf-token': csrfToken,
          },
        }
      );

      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update status';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /**
   * Mark an on-the-way donation as picked up. PATCH /donations/:id/picked-up.
   * Note: there is deliberately no `completeDonation` here — the existing
   * backend authorizes /complete to the DONOR only (restrictToDonationOwner),
   * so the volunteer-side UI stops at "picked up" and never shows a
   * volunteer-facing "Complete" action.
   * @param {number} donationId
   * @returns {Promise<Object>}
   */
  markPickedUp: async (donationId) => {
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();

      const response = await axios.patch(
        `${API_BASE}/donations/${donationId}/picked-up`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-csrf-token': csrfToken,
          },
        }
      );

      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update status';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /**
   * PHASE 5 — Volunteer Mission History. Uses the same endpoints Phase 1
   * re-enabled (GET /donations/assigned-history[/summary]), already
   * volunteer-role-protected and paginated server-side — no new backend
   * routes for this.
   * @param {Object} filters - status, category, search, sortBy, sortOrder, page, limit
   */
  getVolunteerHistory: async (filters = {}) => {
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
        `${API_BASE}/donations/assigned-history${params.toString() ? '?' + params.toString() : ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return { success: true, data: response.data.data, meta: response.data.meta };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch mission history';
      return { success: false, error: message, status: error.response?.status || null };
    }
  },

  /**
   * PHASE 5 — Mission History summary counts (total/accepted/scheduled/completed).
   */
  getVolunteerHistorySummary: async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE}/donations/assigned-history/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch mission history summary';
      return { success: false, error: message, status: error.response?.status || null };
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

  // Assignment fields
  if (formData.assignmentMode) {
    apiData.assignmentMode = formData.assignmentMode;
  }
  if (formData.volunteerId) {
    apiData.volunteerId = formData.volunteerId;
  }

  return apiData;
};
