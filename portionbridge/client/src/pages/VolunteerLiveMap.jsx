import { Map } from 'lucide-react';
import { DashboardLayout, ComingSoon } from '../components/dashboard';

/**
 * VolunteerLiveMap — "Live Map" (Phase 1: Dashboard Foundation).
 *
 * Structural placeholder only. Live volunteer location tracking needs new
 * backend work (a location-update socket event + DB support, gated to
 * only broadcast while a mission is active, per the security rule on
 * exposing volunteer location) — none of that exists yet, so this page
 * intentionally shows no map and no data rather than fake coordinates.
 * The existing donor-side VolunteerMap (Leaflet loaded via CDN) is the
 * pattern to reuse once the backend support lands.
 */
export function VolunteerLiveMap() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Live Map</h1>
          <p className="text-text-secondary text-sm">
            Track your active mission's pickup and drop-off locations in real time.
          </p>
        </div>

        <ComingSoon
          icon={Map}
          title="Live tracking is coming soon"
          description="Real-time mission location tracking is being built. Check back soon."
        />
      </div>
    </DashboardLayout>
  );
}
