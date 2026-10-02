import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
}

export const supportApi = {
  // User methods
  async createTicket(data) {
    const response = await axios.post(`${API_BASE_URL}/support/tickets`, data, { headers: authHeaders() });
    return response.data;
  },

  async getMyTickets(params = {}) {
    const response = await axios.get(`${API_BASE_URL}/support/tickets`, { params, headers: authHeaders() });
    return response.data;
  },

  async getUnreadCount() {
    const response = await axios.get(`${API_BASE_URL}/support/tickets/unread-count`, { headers: authHeaders() });
    return response.data;
  },

  async getTicket(id) {
    const response = await axios.get(`${API_BASE_URL}/support/tickets/${id}`, { headers: authHeaders() });
    return response.data;
  },

  async sendMessage(id, data) {
    const response = await axios.post(`${API_BASE_URL}/support/tickets/${id}/messages`, data, { headers: authHeaders() });
    return response.data;
  },

  async updateStatus(id, data) {
    const response = await axios.patch(`${API_BASE_URL}/support/tickets/${id}/status`, data, { headers: authHeaders() });
    return response.data;
  },

  // Admin methods
  async getAdminStats() {
    const response = await axios.get(`${API_BASE_URL}/admin/support/stats`, { headers: authHeaders() });
    return response.data;
  },

  async getAdminTickets(params = {}) {
    const response = await axios.get(`${API_BASE_URL}/admin/support/tickets`, { params, headers: authHeaders() });
    return response.data;
  },

  async getAdminTicket(id) {
    const response = await axios.get(`${API_BASE_URL}/admin/support/tickets/${id}`, { headers: authHeaders() });
    return response.data;
  },

  async sendAdminMessage(id, data) {
    const response = await axios.post(`${API_BASE_URL}/admin/support/tickets/${id}/messages`, data, { headers: authHeaders() });
    return response.data;
  },

  async updateAdminTicket(id, data) {
    const response = await axios.patch(`${API_BASE_URL}/admin/support/tickets/${id}`, data, { headers: authHeaders() });
    return response.data;
  },
};
