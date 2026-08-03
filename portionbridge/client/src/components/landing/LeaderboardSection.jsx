import React, { useState, useEffect } from "react";
import axios from "axios";
import { Avatar } from "../common/Avatar";
import { Stars } from "../common/Stars";
import { Reveal } from "../common/Reveal";
import { useReveal } from "../hooks/useReveal";
import { useSocket } from "../../context/SocketContext";

const PRIMARY = "var(--color-primary, oklch(60.6% 0.25 292.717))";
const PRIMARY_DEEP = "var(--color-primary-deep, oklch(38% 0.19 292.717))";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const FALLBACK_DONORS = [
  { name: "Rafiul Islam", area: "Various areas", donations: 128, kind: "Mixed donations", items: 34, photo: null },
  { name: "Nusrat Jahan", area: "Various areas", donations: 96, kind: "Mixed donations", items: 28, photo: null },
  { name: "Karim Uddin", area: "Various areas", donations: 84, kind: "Mixed donations", items: 45, photo: null },
  { name: "Fatima Begum", area: "Various areas", donations: 72, kind: "Mixed donations", items: 31, photo: null },
  { name: "Ahmed Ali", area: "Various areas", donations: 64, kind: "Mixed donations", items: 22, photo: null },
];

const FALLBACK_VOLUNTEERS = [
  { name: "Team Nurul", area: "Various zones", pickups: 312, kind: "Mixed pickups", photo: null },
  { name: "Team Rahim", area: "Various zones", pickups: 284, kind: "Mixed pickups", photo: null },
  { name: "Karim Ahmed", area: "Various zones", pickups: 256, kind: "Mixed pickups", photo: null },
  { name: "Fatima Group", area: "Various zones", pickups: 198, kind: "Mixed pickups", photo: null },
  { name: "Ali Squad", area: "Various zones", pickups: 172, kind: "Mixed pickups", photo: null },
];

const PODIUM_STYLES = [
  { order: "order-2", height: "h-28", ring: "#FBBF24", medal: "#FDE68A", medalFg: "#78350F", avatarSize: "w-16 h-16 text-base", crown: true },
  { order: "order-1", height: "h-20", ring: "#CBD5E1", medal: "#E5E7EB", medalFg: "#374151", avatarSize: "w-12 h-12 text-sm", crown: false },
  { order: "order-3", height: "h-16", ring: "#FDBA74", medal: "#FED7AA", medalFg: "#7C2D12", avatarSize: "w-12 h-12 text-sm", crown: false },
];

function RankBadge({ rank }) {
  const styles = [
    { bg: "#FDE68A", fg: "#78350F" },
    { bg: "#E5E7EB", fg: "#374151" },
    { bg: "#FDBA74", fg: "#7C2D12" },
  ];
  const s = styles[rank] || { bg: PRIMARY, fg: PRIMARY_DEEP };
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold shrink-0"
      style={{ background: s.bg, color: s.fg }}
    >
      {rank + 1}
    </div>
  );
}

function PodiumCard({ item, rank, value, valueLabel, unit }) {
  const style = PODIUM_STYLES[rank];
  return (
    <div className={`flex flex-col items-center ${style.order}`}>
      <div className="relative mb-2">
        {style.crown && (
          <svg viewBox="0 0 24 24" className="w-6 h-6 absolute -top-4 left-1/2 -translate-x-1/2" fill="#FBBF24">
            <path d="M3 8l4 3 5-6 5 6 4-3-2 10H5L3 8z" />
          </svg>
        )}
        <div
          className="rounded-full transition-all duration-500"
          style={{ boxShadow: `0 0 0 3px white, 0 0 0 4px ${style.ring}` }}
        >
          <Avatar item={item} className={style.avatarSize} />
        </div>
      </div>
      <span className="text-sm font-medium text-center leading-tight max-w-[110px] truncate">{item.name}</span>
      <span className="font-mono text-sm font-semibold mt-1" style={{ color: PRIMARY_DEEP }}>
        {valueLabel}
      </span>
      <span className="text-[10px] text-black/40 uppercase tracking-wide">{unit}</span>
      <span className="mb-3" />
      <div
        className={`w-full ${style.height} rounded-t-xl flex items-start justify-center pt-2 transition-all duration-500`}
        style={{ background: style.medal }}
      >
        <span className="font-mono text-xs font-bold" style={{ color: style.medalFg }}>
          #{rank + 1}
        </span>
      </div>
    </div>
  );
}

function ListRow({ item, rank, value, max, valueLabel, unit, subLabel }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-500 border border-black/5">
      <RankBadge rank={rank} />
      <Avatar item={item} className="w-8 h-8 text-[11px]" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate">{item.name}</span>
          <span className="font-mono text-xs font-semibold shrink-0" style={{ color: PRIMARY_DEEP }}>
            {valueLabel}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="text-xs text-gray-500 truncate">
            {item.area} · {item.kind}
            {subLabel ? ` · ${subLabel}` : ""}
          </span>
          <span className="text-[10px] text-black/35 uppercase tracking-wide shrink-0">{unit}</span>
        </div>
        <div className="h-1 rounded-full bg-gray-100 mt-1.5 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: PRIMARY }} />
        </div>
      </div>
    </div>
  );
}

function LeaderPanel({ title, items, valueKey, valueLabelFn, unit, subLabelFn, loading }) {
  const top3 = items.slice(0, 3);
  const rest = items.slice(3);
  const max = items.length > 0 ? Math.max(...items.map((i) => i[valueKey])) : 0;

  if (loading && items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 md:p-7">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-xl">{title}</h3>
          <div className="animate-pulse h-4 w-20 bg-gray-200 rounded" />
        </div>
        <div className="flex items-end justify-center gap-3 mb-6 pt-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center animate-pulse">
              <div className="w-16 h-16 rounded-full bg-gray-200 mb-2" />
              <div className="h-4 w-20 bg-gray-200 rounded mb-1" />
              <div className="h-3 w-12 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1.5 border-t border-black/5 pt-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl animate-pulse">
              <div className="w-7 h-7 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 md:p-7">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-xl">{title}</h3>
      </div>
      <div className="flex items-end justify-center gap-3 mb-6 pt-4">
        {top3.map((item, i) => (
          <PodiumCard
            key={item.name || i}
            item={item}
            rank={i}
            value={item[valueKey]}
            valueLabel={valueLabelFn(item)}
            unit={unit}
          />
        ))}
      </div>
      <div className="flex flex-col gap-1.5 border-t border-black/5 pt-4">
        {rest.map((item, i) => {
          const rank = i + 3;
          return (
            <ListRow
              key={item.name || i}
              item={item}
              rank={rank}
              value={item[valueKey]}
              max={max}
              valueLabel={valueLabelFn(item)}
              unit={unit}
              subLabel={subLabelFn ? subLabelFn(item) : null}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * LeaderboardSection component - Displays donor and volunteer leaderboards
 */
export function LeaderboardSection() {
  const [ref, visible] = useReveal();
  const [donors, setDonors] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket, connected } = useSocket();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [donorsRes, volunteersRes] = await Promise.all([
          axios.get(`${API_BASE}/public/leaderboard/donors?limit=10`),
          axios.get(`${API_BASE}/public/leaderboard/volunteers?limit=10`),
        ]);

        setDonors(donorsRes.data.data.donors || []);
        setVolunteers(volunteersRes.data.data.volunteers || []);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError('Failed to load leaderboard');
        // Use fallback data on error
        setDonors(FALLBACK_DONORS);
        setVolunteers(FALLBACK_VOLUNTEERS);
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchLeaderboard();
    }
  }, [visible]);

  // Real-time leaderboard updates via socket
  useEffect(() => {
    if (!socket || !connected) return;

    // Listen for leaderboard updates
    const handleLeaderboardUpdate = (data) => {
      if (data.donors) {
        const donorsWithKind = data.donors.map(d => ({
          ...d,
          area: 'Various areas',
          kind: 'Mixed donations',
        }));
        setDonors(donorsWithKind);
      }
      if (data.volunteers) {
        const volunteersWithKind = data.volunteers.map(v => ({
          ...v,
          area: 'Various zones',
          kind: 'Mixed pickups',
        }));
        setVolunteers(volunteersWithKind);
      }
    };

    socket.on('leaderboard_updated', handleLeaderboardUpdate);

    return () => {
      socket.off('leaderboard_updated', handleLeaderboardUpdate);
    };
  }, [socket, connected]);

  const displayDonors = loading ? FALLBACK_DONORS : donors;
  const displayVolunteers = loading ? FALLBACK_VOLUNTEERS : volunteers;

  return (
    <div ref={ref} className="grid md:grid-cols-2 gap-6">
      <LeaderPanel
        title="Top donors"
        items={displayDonors}
        valueKey="donations"
        valueLabelFn={(d) => `${d.donations}`}
        unit="Donations"
        loading={loading}
      />
      <LeaderPanel
        title="Top volunteers"
        items={displayVolunteers}
        valueKey="pickups"
        valueLabelFn={(v) => `${v.pickups}`}
        unit="Pickups"
        loading={loading}
      />
    </div>
  );
}
