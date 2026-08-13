import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Same helpers as donationApi.js — duplicated rather than extracted into a
// shared util, matching this project's existing per-service style (each
// service file owns its own copy; see donationApi.js/profileApi.js etc).
const getAuthToken = () => {
  return localStorage.getItem('accessToken');
};

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
 * Team API Service — PHASE 4.
 *
 * All calls hit the existing /teams/* endpoints (mounted in
 * routes/v1/index.js as router.use('/teams', teamRoutes)) — no new
 * backend routes were added for this service. The one backend change this
 * phase made was fixing a pre-existing route-ordering bug in
 * team.routes.js that made GET /teams/my and GET /teams/my/invitations
 * unreachable (see the PHASE 4 FIX comment in that file) — the endpoints
 * and their contracts are unchanged, just reachable now.
 */
export const teamApi = {
  /**
   * Get the current user's team (overview + members), or null if not on a team.
   * GET /teams/my
   */
  getMyTeam: async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE}/teams/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch team information';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /**
   * Get the current user's pending team invitations.
   * GET /teams/my/invitations
   */
  getMyInvitations: async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE}/teams/my/invitations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch invitations';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /**
   * Accept a pending team invitation.
   * POST /teams/invitations/:id/accept
   */
  acceptInvitation: async (invitationId) => {
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      const response = await axios.post(
        `${API_BASE}/teams/invitations/${invitationId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken } }
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to accept invitation';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /**
   * Decline a pending team invitation.
   * POST /teams/invitations/:id/decline
   */
  declineInvitation: async (invitationId) => {
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      const response = await axios.post(
        `${API_BASE}/teams/invitations/${invitationId}/decline`,
        {},
        { headers: { Authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken } }
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to decline invitation';
      const status = error.response?.status || null;
      return { success: false, error: message, status };
    }
  },

  /**
   * Get donations currently assigned to a team (Team Activity / missions).
   * GET /donations/team/:teamId — lives in donationApi's domain but kept
   * here since it's consumed exclusively by the Team page; avoids a
   * cross-import between the two services for a single call.
   * PHASE 4 backend fix: this endpoint previously had no membership check
   * at all (see donation.service.js) — now returns 403 for non-members,
   * which this function surfaces like any other error.
   */
  getTeamDonations: async (teamId, status) => {
    try {
      const token = getAuthToken();
      const params = status ? `?status=${encodeURIComponent(status)}` : '';
      const response = await axios.get(`${API_BASE}/donations/team/${teamId}${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch team activity';
      const status2 = error.response?.status || null;
      return { success: false, error: message, status: status2 };
    }
  },

  // ==========================================================================
  // PHASE 5 — Team management actions (leader-only, backend-enforced).
  // All hit existing /teams/:id/* endpoints from team.routes.js — no new
  // backend routes. promoteMember and transferLeadership are two separate
  // existing endpoints that turned out, on inspection, to do the exact
  // same thing server-side (both fully swap leader<->member roles) — this
  // service only exposes one (transferLeadership) rather than two
  // functionally-identical UI actions; see the Phase 5 report for details.
  // ==========================================================================

  /**
   * Invite a volunteer to the team by email.
   * POST /teams/:id/invite, body: { invitedEmail }
   */
  inviteMember: async (teamId, invitedEmail) => {
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      const response = await axios.post(
        `${API_BASE}/teams/${teamId}/invite`,
        { invitedEmail },
        { headers: { Authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken, 'Content-Type': 'application/json' } }
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send invitation';
      return { success: false, error: message, status: error.response?.status || null };
    }
  },

  /**
   * Remove a member from the team (leader only).
   * DELETE /teams/:id/members/:memberId — :memberId here is the target
   * user's ID (confirmed by reading team.service.js#removeMember, which
   * looks the row up via findByTeamAndUser(teamId, memberId)), not a
   * team_members table row ID.
   */
  removeMember: async (teamId, memberUserId) => {
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      const response = await axios.delete(
        `${API_BASE}/teams/${teamId}/members/${memberUserId}`,
        { headers: { Authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken } }
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove member';
      return { success: false, error: message, status: error.response?.status || null };
    }
  },

  /**
   * Transfer team leadership to another member (leader only).
   * PATCH /teams/:id/members/:memberId/transfer
   */
  transferLeadership: async (teamId, memberUserId) => {
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      const response = await axios.patch(
        `${API_BASE}/teams/${teamId}/members/${memberUserId}/transfer`,
        {},
        { headers: { Authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken } }
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to transfer leadership';
      return { success: false, error: message, status: error.response?.status || null };
    }
  },

  /**
   * Leave the current team (non-leader members only — the backend
   * rejects this for a leader with a clear "transfer leadership first"
   * message, which is surfaced as-is).
   * DELETE /teams/my/leave
   */
  leaveTeam: async () => {
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      const response = await axios.delete(`${API_BASE}/teams/my/leave`, {
        headers: { Authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken },
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to leave team';
      return { success: false, error: message, status: error.response?.status || null };
    }
  },
};