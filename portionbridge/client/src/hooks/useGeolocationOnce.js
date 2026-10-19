import { useCallback, useState } from 'react';

/**
 * One-shot browser geolocation for "Nearby" discovery.
 *
 * - Nothing is requested on mount: the browser permission prompt appears only
 *   after `request()` is called by an explicit user action.
 * - Uses getCurrentPosition (a single reading). It never calls watchPosition,
 *   so the donor is not tracked.
 * - The position stays in component state only: it is not stored or sent anywhere.
 *
 * status: 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'error'
 */
export function useGeolocationOnce() {
  const [state, setState] = useState({ status: 'idle', position: null });

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ status: 'unavailable', position: null });
      return;
    }
    setState({ status: 'requesting', position: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos?.coords?.latitude;
        const lng = pos?.coords?.longitude;
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setState({ status: 'granted', position: { lat, lng } });
        } else {
          setState({ status: 'error', position: null });
        }
      },
      (err) => {
        // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        const status = err?.code === 1 ? 'denied' : err?.code === 2 ? 'unavailable' : 'error';
        setState({ status, position: null });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  const reset = useCallback(() => setState({ status: 'idle', position: null }), []);

  return { ...state, request, reset };
}
