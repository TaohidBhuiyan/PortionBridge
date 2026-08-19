import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthSocket } from '../context/SocketContext';

// Client-side throttle floor. The server (tracking.handler.js) enforces
// its own 4000ms floor independently — this just avoids calling
// socket.emit at all between updates, since watchPosition can fire far
// more often than that (sometimes every second or two depending on the
// device/GPS chip). Two layers because the client one saves bandwidth and
// battery; the server one is the actual security/abuse boundary and
// can't be bypassed by a modified client.
const MIN_EMIT_INTERVAL_MS = 5000;

const TRACKABLE_STATUSES = new Set(['accepted', 'scheduled', 'on_the_way', 'picked_up']);

/**
 * useLiveLocationSharing — starts/stops sharing the volunteer's real GPS
 * position for one donation's mission room, over the existing
 * authenticated Socket.io connection (no new socket — reuses the same
 * `donation_${id}` room/AuthSocketProvider that useDonationTracking.js
 * and TrackingPanel.jsx already use donor-side).
 *
 * Room membership (join_donation_tracking/leave_donation_tracking) is
 * intentionally NOT this hook's job — callers are expected to already be
 * using useDonationTracking.js for that (its join/leave lifecycle is
 * reused as-is), so this hook only owns the geolocation watch and the
 * throttled emit on top of it.
 *
 * Automatically starts when `active` is true AND `status` is one of the
 * trackable statuses, and stops (clearing the geolocation watch) the
 * moment either becomes false — this is what satisfies "start sharing
 * during an active mission" / "stop sharing when mission is completed/
 * cancelled" from real status changes, not a manual toggle the volunteer
 * could forget to turn off.
 *
 * @param {number|string} donationId - Donation to share location for
 * @param {string} status - Current donation status (should reflect real-time
 *   'donation_status_updated' events, not stale initial-load state)
 * @param {boolean} active - Whether this mission is the one currently open
 *   (e.g. false while the map is off-screen) — an extra opt-in on top of
 *   status, so a volunteer merely viewing history doesn't get tracked
 * @returns {{
 *   sharing: boolean,
 *   permission: 'unknown'|'granted'|'denied'|'unsupported',
 *   error: string|null,
 *   currentPosition: {latitude:number, longitude:number, accuracy:number}|null,
 *   requestPermissionAndStart: () => void,
 * }}
 */
export function useLiveLocationSharing(donationId, status, active) {
  const { socket, connected } = useAuthSocket();

  const [sharing, setSharing] = useState(false);
  const [permission, setPermission] = useState('unknown');
  const [error, setError] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);

  const watchIdRef = useRef(null);
  const lastEmitRef = useRef(0);

  const isTrackable = active && TRACKABLE_STATUSES.has(status);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setPermission('unsupported');
      return;
    }
    if (watchIdRef.current !== null) return; // already watching

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setCurrentPosition(coords);
        setPermission('granted');
        setSharing(true);
        setError(null);

        const now = Date.now();
        if (now - lastEmitRef.current < MIN_EMIT_INTERVAL_MS) return;
        if (!socket || !connected || !donationId) return;

        lastEmitRef.current = now;
        socket.emit('share_volunteer_location', {
          donationId,
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setPermission('denied');
        } else {
          setError(geoError.message || 'Unable to get your location.');
        }
        setSharing(false);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
  }, [socket, connected, donationId]);

  const requestPermissionAndStart = useCallback(() => {
    if (!navigator.geolocation) {
      setPermission('unsupported');
      return;
    }
    setError(null);
    startWatch();
  }, [startWatch]);

  // Stop sharing the instant the mission stops being trackable (status
  // moved to completed/cancelled, or the map was closed) — this is the
  // actual enforcement point for "stop sharing when mission is
  // completed/cancelled", independent of whether the volunteer remembers
  // to do anything. isTrackable flipping to false runs this effect's
  // cleanup (React calls the previous effect's cleanup before running a
  // new one, and on unmount), which is where the geolocation watch is
  // actually torn down — not synchronously in the effect body.
  useEffect(() => {
    if (!isTrackable) return undefined;
    return () => {
      stopWatch();
      setSharing(false);
    };
  }, [isTrackable, stopWatch]);

  return {
    sharing,
    permission,
    error,
    currentPosition,
    requestPermissionAndStart: isTrackable ? requestPermissionAndStart : () => {},
  };
}