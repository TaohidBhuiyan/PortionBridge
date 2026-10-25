import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const request = async (method, path, { params, data } = {}) => {
  const response = await axios.request({
    method,
    url: `${API_BASE_URL}/alerts${path}`,
    params,
    data,
    withCredentials: true,
    headers: authHeaders(),
  });
  return response.data;
};

/**
 * Disaster alert API (/api/v1/alerts). Severity, status, counts and recipient numbers always
 * come from the server; the client never decides what is verified, critical or delivered.
 */
const alertApi = {
  // any signed-in user
  getPreferences: () => request('get', '/preferences'),
  savePreferences: (data) => request('put', '/preferences', { data }),
  listActive: (params = {}) => request('get', '/active', { params }),

  // admin only (also enforced server-side)
  preview: (data) => request('post', '/preview', { data }),
  list: (params = {}) => request('get', '/', { params }),
  get: (id) => request('get', `/${id}`),
  issue: (data) => request('post', '/', { data }),
  update: (id, data) => request('patch', `/${id}`, { data }),
  correct: (id, note) => request('post', `/${id}/correction`, { data: { note } }),
  resolve: (id, note) => request('post', `/${id}/resolve`, { data: note ? { note } : {} }),
  cancel: (id, reason) => request('post', `/${id}/cancel`, { data: { reason } }),
  retryEvent: (id, eventId) => request('post', `/${id}/events/${eventId}/retry`, { data: {} }),
};

export default alertApi;
