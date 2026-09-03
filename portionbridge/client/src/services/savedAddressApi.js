import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
}

/**
 * Saved Address API — the backend (server/routes/v1/savedAddress.routes.js)
 * has full CRUD + set-default support; this is the first frontend client
 * for it. Previously the only saved-address UI anywhere was the read-only
 * dropdown inside donation creation (components/donation/Step3PickupInfo.jsx)
 * — there was no way for a donor to add, edit, delete, or manage a default
 * address outside of that flow.
 */
export const savedAddressApi = {
  async getAll() {
    const response = await axios.get(`${API_BASE}/saved-addresses`, { headers: authHeaders() });
    return response.data;
  },

  async create(data) {
    const response = await axios.post(`${API_BASE}/saved-addresses`, data, { headers: authHeaders() });
    return response.data;
  },

  async update(id, data) {
    const response = await axios.patch(`${API_BASE}/saved-addresses/${id}`, data, { headers: authHeaders() });
    return response.data;
  },

  async remove(id) {
    const response = await axios.delete(`${API_BASE}/saved-addresses/${id}`, { headers: authHeaders() });
    return response.data;
  },

  async setDefault(id) {
    const response = await axios.patch(`${API_BASE}/saved-addresses/${id}/set-default`, {}, { headers: authHeaders() });
    return response.data;
  },
};
