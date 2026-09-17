import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
}

/**
 * Saved Address API Client
 */
export const savedAddressApi = {
  async getAll() {
    try {
      const response = await axios.get(`${API_BASE}/saved-addresses`, { headers: authHeaders() });
      return response.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to fetch saved addresses',
      };
    }
  },

  async create(data) {
    try {
      const response = await axios.post(`${API_BASE}/saved-addresses`, data, { headers: authHeaders() });
      return response.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create address',
      };
    }
  },

  async update(id, data) {
    try {
      const response = await axios.patch(`${API_BASE}/saved-addresses/${id}`, data, { headers: authHeaders() });
      return response.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to update address',
      };
    }
  },

  async remove(id) {
    try {
      const response = await axios.delete(`${API_BASE}/saved-addresses/${id}`, { headers: authHeaders() });
      return response.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to delete address',
      };
    }
  },

  async setDefault(id) {
    try {
      const response = await axios.patch(`${API_BASE}/saved-addresses/${id}/set-default`, {}, { headers: authHeaders() });
      return response.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to set default address',
      };
    }
  },
};
