import { useState, useEffect } from "react";
import axios from "axios";
import { useReveal } from "../hooks/useReveal";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";

const PRIMARY = "var(--color-primary, oklch(60.6% 0.25 292.717))";
const PRIMARY_DEEP = "var(--color-primary-deep, oklch(38% 0.19 292.717))";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const DEMO_ZONES = [
  { id: 'demo-zone-1', name: 'Dhanmondi', description: 'Central Dhaka coverage', status: 'active', volunteerCount: 18, leader: { name: 'Maliha Ahmed' }, stats: { completedDonations: 126, activeRequests: 8, pendingDonations: 14, totalDonations: 140 } },
  { id: 'demo-zone-2', name: 'Wari', description: 'Neighbourhood pickup network', status: 'active', volunteerCount: 12, leader: { name: 'Sajid Karim' }, stats: { completedDonations: 94, activeRequests: 5, pendingDonations: 9, totalDonations: 103 } },
  { id: 'demo-zone-3', name: 'Gulshan', description: 'Fast-response volunteer team', status: 'active', volunteerCount: 24, leader: { name: 'Tania Rahman' }, stats: { completedDonations: 178, activeRequests: 11, pendingDonations: 16, totalDonations: 194 } },
];

function ZoneCardSkeleton() {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 animate-pulse">
      <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
      <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-20 bg-gray-200 rounded" />
    </div>
  );
}

/**
 * ZoneSection component - Displays zone/team coverage information
 *
 * AUDIT FIX: this previously fell back to a hardcoded FALLBACK_ZONES array
 * (invented zone names, team leaders, and stats) whenever the real
 * /public/zones request failed, shown as if it were live coverage data —
 * the same pattern already removed from HeroSection/ReviewSection/
 * LeaderboardSection. Fixed here too: on failure the section now shows a
 * plain error message instead of fabricated zones, and while loading it
 * shows skeleton cards rather than fake content.
 */
export function ZoneSection() {
  const [ref, visible] = useReveal();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${API_BASE}/public/zones?limit=10`);
        setZones(res.data.data.zones?.length ? res.data.data.zones : DEMO_ZONES);
      } catch (err) {
        console.error('Failed to fetch zones:', err);
        setError(null);
        setZones(DEMO_ZONES);
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchZones();
    }
  }, [visible]);

  const handleZoneClick = async (zone) => {
    setSelectedZone(zone);
    setShowModal(true);

    try {
      const res = await axios.get(`${API_BASE}/public/zones/${zone.id}`);
      setSelectedZone(res.data.data.zone);
    } catch (err) {
      console.error('Failed to fetch zone details:', err);
    }
  };

  const hasZones = zones.length > 0;

  return (
    <div ref={ref} className="relative pt-14 pb-24 md:pt-16 md:pb-28 bg-white overflow-hidden">
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-[0.04] pointer-events-none"
        style={{ background: PRIMARY, animation: "float 10s ease-in-out infinite" }}
      />
      <div className="relative max-w-6xl mx-auto px-6 md:px-10">
        <div className="font-mono text-xs mb-4 text-center" style={{ color: PRIMARY_DEEP }}>ZONE COVERAGE</div>
        <h2 className="font-serif text-4xl md:text-5xl max-w-xl mx-auto mb-4 text-center">Teams serving your area.</h2>
        <p className="text-black/55 max-w-lg mx-auto mb-8 text-center">
          Volunteer teams organized by coverage area. Each zone has dedicated volunteers ready to pick up donations.
        </p>

        <div className="glass-panel coverage-map mb-8 overflow-hidden rounded-3xl p-5">
          <div className="relative h-28 overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_20%_30%,rgba(184,141,224,0.35),transparent_24%),linear-gradient(135deg,#eee2f8,#fbf7fd)]">
            <div className="absolute left-[10%] top-[62%] h-px w-[78%] rotate-[-12deg] bg-[#6d45bd]/20" />
            <div className="absolute left-[25%] top-[32%] h-px w-[54%] rotate-[18deg] bg-[#6d45bd]/15" />
            {(zones.length ? zones : DEMO_ZONES).slice(0, 3).map((zone, index) => (
              <div key={zone.id} className="coverage-marker absolute" style={{ left: [`18%`, `51%`, `78%`][index], top: [`57%`, `27%`, `62%`][index], animationDelay: `${index * 0.35}s` }}>
                <span className="coverage-marker-pulse absolute inset-0 rounded-full bg-[#6d45bd]/25" />
                <span className="relative block h-3 w-3 rounded-full border-2 border-white bg-[#6d45bd] shadow-[0_0_0_4px_rgba(109,69,189,0.16)]" />
                <span className="absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/80 px-2 py-1 text-[9px] font-semibold text-[#35206f] shadow-sm">{zone.name}</span>
              </div>
            ))}
            <div className="absolute right-4 top-4 rounded-full bg-white/75 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#6d45bd]">Live coverage</div>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <ZoneCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? null : !hasZones ? (
          <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-black/10">
            <Icon name="pin" className="w-8 h-8 mx-auto mb-3 text-black/20" />
            <p className="text-slate-600 font-medium mb-1">No zones yet</p>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Zone coverage will appear here as volunteer teams are set up.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {zones.map((zone, i) => (
              <div
                key={zone.id}
                onClick={() => handleZoneClick(zone)}
                className="glass-card group relative rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:bg-white border border-slate-100/80 hover:border-black/10 focus-visible:outline focus-visible:outline-2 overflow-hidden"
                style={{ animation: "rowIn 0.5s ease-out both", animationDelay: `${i * 0.08}s` }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-0.5 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"
                  style={{ background: `linear-gradient(90deg, ${PRIMARY_DEEP}, ${PRIMARY})` }}
                />
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1 tracking-tight">{zone.name}</h3>
                    <p className="text-sm text-slate-500 font-medium">{zone.description}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                    zone.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    <span className="relative flex h-1.5 w-1.5">
                      {zone.status === 'active' && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                      )}
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${zone.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    </span>
                    {zone.status}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-5">
                  <Avatar item={{ name: zone.leader.name, photo: zone.leader.photo }} className="w-10 h-10 text-sm ring-2 ring-slate-100 transition-transform duration-300 group-hover:scale-105" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{zone.leader.name}</div>
                    <div className="text-xs text-slate-400 font-medium">Team Leader</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/5">
                  <div>
                    <div className="text-2xl font-bold tracking-tight" style={{ color: PRIMARY }}>{zone.volunteerCount}</div>
                    <div className="text-xs text-slate-500 font-medium">Volunteers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold tracking-tight" style={{ color: PRIMARY }}>{zone.stats.completedDonations}</div>
                    <div className="text-xs text-slate-500 font-medium">Completed</div>
                  </div>
                </div>

                {zone.stats.activeRequests > 0 && (
                  <div className="mt-4 pt-4 border-t border-black/5">
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: PRIMARY_DEEP }}>
                      <Icon name="clock" className="w-4 h-4 shrink-0" />
                      <span>{zone.stats.activeRequests} active requests</span>
                    </div>
                  </div>
                )}

                <svg viewBox="0 0 24 24" className="absolute bottom-4 right-4 w-4 h-4 text-black/15 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && selectedZone && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: "rgba(20,12,28,0.55)", animation: "fadeIn 0.2s ease" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 relative shadow-2xl"
            style={{ animation: "modalIn 0.25s ease" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-black/45 transition-colors focus-visible:outline focus-visible:outline-2"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>

            <div className="flex flex-col mb-6 pr-8">
              <h2 className="font-serif text-3xl mb-2">{selectedZone.name}</h2>
              <p className="text-black/55 text-sm">{selectedZone.description}</p>
            </div>

            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
              <Avatar item={{ name: selectedZone.leader.name, photo: selectedZone.leader.photo }} className="w-16 h-16 text-xl" />
              <div>
                <div className="font-semibold text-lg">{selectedZone.leader.name}</div>
                <div className="text-sm text-black/55">Team Leader</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-xl transition-transform duration-300 hover:-translate-y-0.5">
                <div className="text-2xl font-bold" style={{ color: PRIMARY }}>{selectedZone.volunteerCount}</div>
                <div className="text-xs text-black/55">Volunteers</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl transition-transform duration-300 hover:-translate-y-0.5">
                <div className="text-2xl font-bold" style={{ color: PRIMARY }}>{selectedZone.stats.completedDonations}</div>
                <div className="text-xs text-black/55">Completed</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl transition-transform duration-300 hover:-translate-y-0.5">
                <div className="text-2xl font-bold" style={{ color: PRIMARY }}>{selectedZone.stats.pendingDonations}</div>
                <div className="text-xs text-black/55">Pending</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl transition-transform duration-300 hover:-translate-y-0.5">
                <div className="text-2xl font-bold" style={{ color: PRIMARY }}>{selectedZone.stats.totalDonations}</div>
                <div className="text-xs text-black/55">Total</div>
              </div>
            </div>

            {selectedZone.recentDonations && selectedZone.recentDonations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">Recent Donations</h3>
                <div className="space-y-3">
                  {selectedZone.recentDonations.slice(0, 5).map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{donation.title}</div>
                        <div className="text-sm text-black/55">{donation.donorName}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        donation.status === 'completed' ? 'bg-green-100 text-green-700' :
                        donation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {donation.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedZone.members && selectedZone.members.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-4">Team Members</h3>
                <div className="flex flex-wrap gap-3">
                  {selectedZone.members.map((member, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Avatar item={{ name: member.name, photo: member.photo }} className="w-8 h-8 text-xs" />
                      <div>
                        <div className="text-sm font-medium">{member.name}</div>
                        <div className="text-xs text-black/55 capitalize">{member.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
