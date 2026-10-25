import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const authHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const request = async (method, path, { params, data, responseType } = {}) => {
  const res = await axios.request({ method, url: `${API_BASE_URL}${path}`, params, data, responseType, withCredentials: true, headers: authHeaders() });
  return responseType ? res : res.data;
};
const ops = (method, path, opts) => request(method, `/admin/ops${path}`, opts);

/** Drops empty filter values so only real, validated filters reach the server. */
export function cleanParams(obj = {}) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v !== null && v !== undefined));
}

/**
 * Admin disaster-operations API (/api/v1/admin/ops) plus the EXISTING relief endpoints for the actions that
 * already existed in earlier phases (incident / request status, delivery verification). Every number shown
 * in the UI comes from these responses; nothing is computed or cached on the client.
 */
const adminOpsApi = {
  dashboard: (params) => ops('get', '/dashboard', { params: cleanParams(params) }),
  incidents: (params) => ops('get', '/incidents', { params: cleanParams(params) }),
  incidentDetail: (id) => ops('get', `/incidents/${id}`),
  requests: (params) => ops('get', '/requests', { params: cleanParams(params) }),
  tasks: (params) => ops('get', '/tasks', { params: cleanParams(params) }),
  exceptions: (params) => ops('get', '/exceptions', { params: cleanParams(params) }),
  volunteers: (params) => ops('get', '/volunteers', { params: cleanParams(params) }),
  reports: (params) => ops('get', '/reports', { params: cleanParams(params) }),
  quantityHistory: (requestId) => ops('get', `/requests/${requestId}/quantity-history`),
  assignmentHistory: (pledgeId) => ops('get', `/tasks/${pledgeId}/assignments`),
  exportCsv: (dataset, params) => ops('get', '/export', { params: cleanParams({ ...params, dataset }), responseType: 'blob' }),

  requestInfo: (id, note) => ops('post', `/incidents/${id}/request-info`, { data: { note } }),
  mergeIncident: (id, targetIncidentId, reason) => ops('post', `/incidents/${id}/merge`, { data: { targetIncidentId: Number(targetIncidentId), reason } }),
  reopenIncident: (id, reason) => ops('post', `/incidents/${id}/reopen`, { data: { reason } }),
  requestCorrection: (id, note) => ops('post', `/requests/${id}/request-correction`, { data: { note } }),
  flagReassessment: (id, reason) => ops('post', `/requests/${id}/reassessment`, { data: { reason } }),
  clearReassessment: (id) => ops('delete', `/requests/${id}/reassessment`, { data: {} }),
  assignTask: (pledgeId, volunteerId, reason) => ops('post', `/tasks/${pledgeId}/assign`, { data: { volunteerId, reason } }),
  reassignTask: (pledgeId, volunteerId, reason) => ops('post', `/tasks/${pledgeId}/reassign`, { data: { volunteerId, reason } }),
  releaseTask: (pledgeId, reason) => ops('post', `/tasks/${pledgeId}/release`, { data: { reason } }),
  cancelTask: (pledgeId, reason) => ops('post', `/tasks/${pledgeId}/cancel`, { data: { reason } }),
  correctDelivery: (reportId, verifiedQuantity, reason) => ops('post', `/deliveries/${reportId}/correct`, { data: { verifiedQuantity, reason } }),

  // existing Phase 2/3 endpoints (verification rules live on the server)
  setIncidentStatus: (id, status, notes) => request('patch', `/relief/incidents/${id}/status`, { data: notes ? { status, notes } : { status } }),
  updateIncident: (id, data) => request('patch', `/relief/incidents/${id}`, { data }),
  setRequestStatus: (id, status, notes) => request('patch', `/relief/requests/${id}/status`, { data: notes ? { status, notes } : { status } }),
  verifyReport: (reportId, body) => request('post', `/relief/admin/reports/${reportId}/verify`, { data: body }),
  rejectReport: (reportId, notes) => request('post', `/relief/admin/reports/${reportId}/reject`, { data: { notes } }),
  resolveReport: (reportId, body) => request('post', `/relief/admin/reports/${reportId}/resolve`, { data: body }),
};

export default adminOpsApi;
