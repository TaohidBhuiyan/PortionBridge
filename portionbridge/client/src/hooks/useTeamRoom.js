import { useEffect, useRef } from 'react';
import { useAuthSocket } from '../context/SocketContext';

/**
 * useTeamRoom — PHASE 4.
 *
 * Joins/leaves the existing `team_${teamId}` Socket.IO room and listens
 * for the existing `team_announcement` and `team_activity` events. Modeled
 * directly on useDonationTracking.js (same join/leave-on-unmount shape,
 * same reuse of the shared AuthSocketProvider connection via
 * useAuthSocket() rather than opening a second socket) — no new Socket.IO
 * architecture, just a second hook using the same pattern for a different
 * room type, since the backend's `join_team_room`/`leave_team_room`/
 * `send_team_announcement` handlers already exist (sockets/handlers/team.handler.js).
 *
 * Real-time is an enhancement here, not the source of truth — the Team
 * page loads its persisted state via REST (teamApi) regardless of whether
 * the socket is connected, and simply refreshes when a live event arrives.
 *
 * @param {number|null} teamId
 * @param {Object} callbacks
 * @param {Function} [callbacks.onAnnouncement] - (payload) => void
 * @param {Function} [callbacks.onTeamActivity] - (payload) => void
 */
export function useTeamRoom(teamId, callbacks = {}) {
  const { socket, connected } = useAuthSocket();
  const roomJoinedRef = useRef(false);

  useEffect(() => {
    if (!socket || !connected || !teamId) return;

    if (!roomJoinedRef.current) {
      socket.emit('join_team_room', { teamId }, (ack) => {
        // Non-fatal if this fails (e.g. briefly stale membership right
        // after joining a team) — the page still works off REST data,
        // this only affects live updates.
        if (!ack?.success) {
          console.warn('[Team Room] Failed to join team room:', ack?.message);
        }
      });
      roomJoinedRef.current = true;
    }

    const handleAnnouncement = (payload) => {
      callbacks.onAnnouncement?.(payload);
    };

    const handleTeamActivity = (payload) => {
      callbacks.onTeamActivity?.(payload);
    };

    socket.on('team_announcement', handleAnnouncement);
    socket.on('team_activity', handleTeamActivity);

    return () => {
      socket.off('team_announcement', handleAnnouncement);
      socket.off('team_activity', handleTeamActivity);

      if (roomJoinedRef.current) {
        socket.emit('leave_team_room', { teamId });
        roomJoinedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, connected, teamId]);

  return { connected };
}