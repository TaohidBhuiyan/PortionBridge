import { Navigate } from 'react-router-dom';

/**
 * VolunteerLiveMap — "Live Map" (Phase 1 placeholder; Phase 5 implements
 * the real live mission map).
 *
 * Rather than duplicate the active-mission fetch + MissionMap rendering
 * that now lives on "My Mission" (VolunteerMission.jsx), this route
 * redirects there — the two sidebar destinations describe the same real
 * feature (this donation's live location tracking), and a volunteer only
 * ever has one active mission at a time, so there's nothing distinct for
 * a separate "Live Map" page to show.
 */
export function VolunteerLiveMap() {
  return <Navigate to="/volunteer/mission" replace />;
}