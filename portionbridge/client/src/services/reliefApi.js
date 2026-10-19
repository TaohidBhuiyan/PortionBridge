import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const request = async (method, path, { params, data, headers } = {}) => {
  const response = await axios.request({
    method,
    url: `${API_BASE_URL}/relief${path}`,
    params,
    data,
    withCredentials: true,
    headers: { ...authHeaders(), ...headers },
  });
  return response.data;
};
const get = (path, params) => request('get', path, { params });
const post = (path, data, headers) => request('post', path, { data: data ?? {}, headers });

/**
 * Disaster Relief API service. Wraps the /api/v1/relief endpoints and returns the standard
 * envelope { success, message, data, meta }. Quantities, remaining amounts and statuses are
 * ALWAYS taken from these server responses — the client never computes or submits totals.
 */
const reliefApi = {
  // ---- discovery (Phase 2) ----
  /** GET /relief/incidents — params: page, limit, status (comma list), disasterType, severity, district, search, sort, mine */
  listIncidents: (params = {}) => get('/incidents', params),
  getIncident: (id) => get(`/incidents/${id}`),
  listIncidentRequests: (incidentId, params = {}) => get(`/incidents/${incidentId}/requests`, params),
  getRequest: (id) => get(`/requests/${id}`),

  // ---- donor pledges (Phase 3) ----
  /** POST /relief/items/:itemId/pledges — pickup details create the pickup task; Idempotency-Key makes retries safe. */
  createPledge: (itemId, body, idempotencyKey) =>
    post(`/items/${itemId}/pledges`, body, idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined),
  listMyPledges: (params = {}) => get('/pledges/mine', params),
  getPledge: (id) => get(`/pledges/${id}`),
  updatePledge: (id, body) => request('patch', `/pledges/${id}`, { data: body }),
  cancelPledge: (id, reason) => post(`/pledges/${id}/cancel`, reason ? { reason } : {}),
  getPledgeTimeline: (id) => get(`/pledges/${id}/timeline`),

  // ---- volunteer tasks ----
  listAvailableTasks: (params = {}) => get('/tasks/available', params),
  listMyTasks: (params = {}) => get('/tasks/mine', params),
  getTask: (pledgeId) => get(`/tasks/${pledgeId}`),
  acceptTask: (pledgeId) => post(`/tasks/${pledgeId}/accept`),
  scheduleTask: (pledgeId, scheduledAt) => post(`/tasks/${pledgeId}/schedule`, { scheduledAt }),
  markTaskOnTheWay: (pledgeId) => post(`/tasks/${pledgeId}/on-the-way`),
  reportPickup: (pledgeId, body) => post(`/tasks/${pledgeId}/pickup`, body),
  reportDelivery: (pledgeId, body) => post(`/tasks/${pledgeId}/delivery`, body),
  reportFailure: (pledgeId, notes) => post(`/tasks/${pledgeId}/failure`, { notes }),
  reportProblem: (pledgeId, notes) => post(`/tasks/${pledgeId}/problem`, { notes }),
  releaseTask: (pledgeId, reason) => post(`/tasks/${pledgeId}/release`, reason ? { reason } : {}),

  // ---- admin review ----
  listReports: (params = {}) => get('/admin/reports', params),
  listAdminTasks: (params = {}) => get('/admin/tasks', params),
  verifyReport: (reportId, body) => post(`/admin/reports/${reportId}/verify`, body),
  rejectReport: (reportId, notes) => post(`/admin/reports/${reportId}/reject`, { notes }),
  resolveReport: (reportId, body) => post(`/admin/reports/${reportId}/resolve`, body),
};

export default reliefApi;
