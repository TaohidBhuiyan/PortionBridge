import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Same helper pattern as teamApi.js / donationApi.js — each service file
// owns its own copy rather than importing a shared util.
const getAuthToken = () => localStorage.getItem('accessToken');

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
 * Admin API service.
 *
 * Phase 1 wired up GET /admin/dashboard. Phase 3 adds User Management
 * (list/detail/ban/unban/activity) and Donation Management
 * (list/detail/status history) — all against endpoints that already
 * existed on the backend (admin.routes.js); no new routes were needed,
 * only richer query params (`reported`) and richer response shapes
 * (donor/volunteer names, a `reports` array on donation detail).
 */
export const adminApi = {
  /**
   * Get platform-wide overview stats + recent donations.
   * GET /admin/dashboard
   */
  getDashboard: async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data.data?.dashboard };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch admin dashboard data';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /* ============================================================
   * User management
   * ============================================================ */

  /**
   * List users with search/role/status filters + pagination.
   * GET /admin/users
   * @param {Object} params - { page, limit, search, role, status, sortBy, sortOrder }
   */
  listUsers: async (params = {}) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE}/admin/users`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data.data?.users, meta: response.data.meta };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch users';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /**
   * Get a single user's full admin-facing profile.
   * GET /admin/users/:id
   */
  getUser: async (userId) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data.data?.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch user';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /**
   * Ban (disable) a user.
   * PATCH /admin/users/:id/disable
   */
  disableUser: async (userId) => {
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      const response = await axios.patch(
        `${API_BASE}/admin/users/${userId}/disable`,
        {},
        { headers: { Authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken } }
      );
      return { success: true, data: response.data.data?.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to disable user';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /**
   * Unban (re-enable) a user.
   * PATCH /admin/users/:id/enable
   */
  enableUser: async (userId) => {
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      const response = await axios.patch(
        `${API_BASE}/admin/users/${userId}/enable`,
        {},
        { headers: { Authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken } }
      );
      return { success: true, data: response.data.data?.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to enable user';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /**
   * Get a user's paginated activity log + per-action summary.
   * GET /admin/users/:id/activity
   */
  getUserActivity: async (userId, params = {}) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE}/admin/users/${userId}/activity`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data.data, meta: response.data.meta };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch user activity';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /* ============================================================
   * Donation oversight
   * ============================================================ */

  /**
   * List donations with full admin filtering + pagination.
   * GET /admin/donations
   * @param {Object} params - { page, limit, status, category, donorId,
   *   volunteerId, deleted, reported, dateFrom, dateTo, sortBy, sortOrder }
   */
  listDonations: async (params = {}) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE}/admin/donations`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data.data?.donations, meta: response.data.meta };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch donations';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /**
   * Get full details for a single donation (any status, including
   * cancelled), including any reports filed against it.
   * GET /admin/donations/:id
   */
  getDonation: async (donationId) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE}/admin/donations/${donationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data.data?.donation };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch donation';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /**
   * Get a donation's full status history (Donor → Volunteer → Status →
   * History), populated by DB triggers on donation_requests.
   * GET /admin/donations/:id/history
   */
  getDonationHistory: async (donationId) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE}/admin/donations/${donationId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch donation history';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /* ============================================================
   * Volunteer monitoring (Phase 4)
   * ============================================================ */

  /**
   * List volunteers with search + pagination and derived performance stats.
   * GET /admin/volunteers
   * @param {Object} params - { page, limit, search }
   */
  listVolunteers: async (params = {}) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE}/admin/volunteers`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data.data?.volunteers, meta: response.data.meta };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch volunteers';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /**
   * Get a single volunteer's profile, stats, availability, team, and
   * current assignments.
   * GET /admin/volunteers/:id
   */
  getVolunteer: async (volunteerId) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE}/admin/volunteers/${volunteerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch volunteer';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /* ============================================================
   * Team monitoring (Phase 4)
   * ============================================================ */

  /**
   * List teams with leader, member count, and mission counts.
   * GET /admin/teams
   * @param {Object} params - { page, limit, search }
   */
  listTeams: async (params = {}) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE}/admin/teams`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data.data?.teams, meta: response.data.meta };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch teams';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /**
   * Get a single team's leader, members, active/completed missions, and
   * recent activity (member changes + announcements).
   * GET /admin/teams/:id
   */
  getTeam: async (teamId) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE}/admin/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch team';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },
};
