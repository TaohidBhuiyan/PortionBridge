import React, { useState, useEffect } from "react";
import axios from "axios";
import { useReveal } from "../hooks/useReveal";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";

const PRIMARY = "var(--color-primary, oklch(60.6% 0.25 292.717))";
const PRIMARY_DEEP = "var(--color-primary-deep, oklch(38% 0.19 292.717))";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const FALLBACK_ZONES = [
  { 
    id: 1, 
    name: "Agrabad Zone", 
    description: "Central coverage area",
    leader: { name: "Team Nurul", photo: null },
    volunteerCount: 12,
    stats: { completedDonations: 45, pendingDonations: 8, totalDonations: 53, completedFood: 30, completedClothes: 15, activeRequests: 8 },
    status: "active"
  },
  { 
    id: 2, 
    name: "GEC Circle Zone", 
    description: "Educational hub coverage",
    leader: { name: "Team Rahim", photo: null },
    volunteerCount: 8,
    stats: { completedDonations: 32, pendingDonations: 5, totalDonations: 37, completedFood: 20, completedClothes: 12, activeRequests: 5 },
    status: "active"
  },
  { 
    id: 3, 
    name: "Halishahar Zone", 
    description: "Residential area coverage",
    leader: { name: "Team Karim", photo: null },
    volunteerCount: 6,
    stats: { completedDonations: 28, pendingDonations: 3, totalDonations: 31, completedFood: 18, completedClothes: 10, activeRequests: 3 },
    status: "idle"
  },
];

/**
 * ZoneSection component - Displays zone/team coverage information
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
        setZones(res.data.data.zones || []);
      } catch (err) {
        console.error('Failed to fetch zones:', err);
        setError('Failed to load zones');
        setZones(FALLBACK_ZONES);
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

  const displayZones = loading ? FALLBACK_ZONES : zones;

  if (loading && displayZones.length === 0) {
    return (
      <div ref={ref} className="py-24 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="font-mono text-xs mb-4" style={{ color: PRIMARY_DEEP }}>ZONE COVERAGE</div>
          <h2 className="font-serif text-4xl md:text-5xl max-w-xl mb-4">Loading zones...</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 animate-pulse">
                <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
                <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="py-24 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <div className="font-mono text-xs mb-4" style={{ color: PRIMARY_DEEP }}>ZONE COVERAGE</div>
        <h2 className="font-serif text-4xl md:text-5xl max-w-xl mb-4">Teams serving your area.</h2>
        <p className="text-black/55 max-w-lg mb-12">
          Volunteer teams organized by coverage area. Each zone has dedicated volunteers ready to pick up donations.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {displayZones.map((zone) => (
            <div
              key={zone.id}
              onClick={() => handleZoneClick(zone)}
              className="bg-slate-50/60 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:bg-white border border-slate-100/80 hover:border-black/10 focus-visible:outline focus-visible:outline-2"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1 tracking-tight">{zone.name}</h3>
                  <p className="text-sm text-slate-500 font-medium">{zone.description}</p>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                  zone.status === 'active' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {zone.status}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <Avatar item={{ name: zone.leader.name, photo: zone.leader.photo }} className="w-10 h-10 text-sm ring-2 ring-slate-100" />
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
            </div>
          ))}
        </div>
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
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold" style={{ color: PRIMARY }}>{selectedZone.volunteerCount}</div>
                <div className="text-xs text-black/55">Volunteers</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold" style={{ color: PRIMARY }}>{selectedZone.stats.completedDonations}</div>
                <div className="text-xs text-black/55">Completed</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold" style={{ color: PRIMARY }}>{selectedZone.stats.pendingDonations}</div>
                <div className="text-xs text-black/55">Pending</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
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
