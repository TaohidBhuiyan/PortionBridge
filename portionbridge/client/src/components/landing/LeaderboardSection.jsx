import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Avatar } from "../common/Avatar";
import { Icon } from "../common/Icon";
import { useReveal } from "../hooks/useReveal";
import { useSocket } from "../../context/SocketContext";

const PRIMARY = "var(--color-primary, oklch(60.6% 0.25 292.717))";
const PRIMARY_DEEP = "var(--color-primary-deep, oklch(38% 0.19 292.717))";
const PRIMARY_TINT = "var(--color-primary-tint, oklch(94% 0.03 292.717))";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const DEMO_DONORS = [
  { id: 'demo-donor-1', name: 'Prashant Deepak', donations: 89, area: 'Dhanmondi', kind: 'Food & clothes' },
  { id: 'demo-donor-2', name: 'Towshif Rakib', donations: 79, area: 'Wari', kind: 'Food donations' },
  { id: 'demo-donor-3', name: 'Rohit Katariya', donations: 30, area: 'Gulshan', kind: 'Clothes donations' },
  { id: 'demo-donor-4', name: 'Nusrat Jahan', donations: 24, area: 'Banani', kind: 'Food donations' },
  { id: 'demo-donor-5', name: 'Arafat Hossain', donations: 18, area: 'Mirpur', kind: 'Mixed donations' },
];

const DEMO_VOLUNTEERS = [
  { id: 'demo-volunteer-1', name: 'Maliha Ahmed', pickups: 46, area: 'Dhanmondi', kind: 'Food pickups' },
  { id: 'demo-volunteer-2', name: 'Sajid Karim', pickups: 38, area: 'Wari', kind: 'Clothes pickups' },
  { id: 'demo-volunteer-3', name: 'Tania Rahman', pickups: 31, area: 'Gulshan', kind: 'Mixed pickups' },
  { id: 'demo-volunteer-4', name: 'Rafi Chowdhury', pickups: 22, area: 'Banani', kind: 'Food pickups' },
  { id: 'demo-volunteer-5', name: 'Mim Sultana', pickups: 16, area: 'Mirpur', kind: 'Mixed pickups' },
];

const PODIUM_STYLES = [
  { order: "order-2", height: "h-28", ring: "#F6C453", medal: "linear-gradient(180deg, #a77924, #e8bd43 45%, #49311c)", medalFg: "#fff3c4", avatarSize: "w-16 h-16 text-base", crown: true, glow: "rgba(246,196,83,0.42)" },
  { order: "order-1", height: "h-20", ring: "#8fe3c4", medal: "linear-gradient(180deg, #1d5c62, #4ab88f 48%, #182d46)", medalFg: "#d7fff2", avatarSize: "w-12 h-12 text-sm", crown: false, glow: "rgba(74,184,143,0.3)" },
  { order: "order-3", height: "h-16", ring: "#b98fe0", medal: "linear-gradient(180deg, #4a347d, #8e58af 48%, #20203f)", medalFg: "#f3eaff", avatarSize: "w-12 h-12 text-sm", crown: false, glow: "rgba(142,88,175,0.34)" },
];

function RankBadge({ rank }) {
  const styles = [
    { bg: "linear-gradient(135deg, #FDE68A, #F59E0B)", fg: "#78350F" },
    { bg: "linear-gradient(135deg, #F3F4F6, #CBD5E1)", fg: "#374151" },
    { bg: "linear-gradient(135deg, #FED7AA, #FB923C)", fg: "#7C2D12" },
  ];
  const s = styles[rank] || { bg: PRIMARY_TINT, fg: PRIMARY_DEEP };
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold shrink-0 shadow-sm"
      style={{ background: s.bg, color: s.fg }}
    >
      {rank + 1}
    </div>
  );
}

function RingedAvatar({ item, className }) {
  return (
    <div className="rounded-full p-[2px] shrink-0" style={{ background: `conic-gradient(from 90deg, ${PRIMARY}, #F59E0B, ${PRIMARY})` }}>
      <div className="rounded-full p-[2px] bg-white">
        <Avatar item={item} className={className} />
      </div>
    </div>
  );
}

function Sparkle({ delay = 0, style }) {
  return (
    <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 absolute" fill="#F59E0B" style={{ animation: `sparkle 2.2s ease-in-out ${delay}s infinite`, ...style }}>
      <path d="M12 0l1.8 8.2L22 10l-8.2 1.8L12 20l-1.8-8.2L2 10l8.2-1.8L12 0z" />
    </svg>
  );
}

function LivePill({ connected }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded-full"
      style={{ color: "rgba(255,255,255,0.72)", background: `${PRIMARY}35` }}
    >
      <span className="relative flex h-1.5 w-1.5">
        {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: PRIMARY }} />}
        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: connected ? PRIMARY : "#9CA3AF" }} />
      </span>
      {connected ? "LIVE" : "OFFLINE"}
    </div>
  );
}

function PodiumCard({ item, rank, valueLabel, unit, subLabel, flash, delta }) {
  const style = PODIUM_STYLES[rank];
  const isFirst = rank === 0;
  return (
    <div className={`podium-card flex flex-col items-center ${style.order} relative`}>
      {isFirst && (
        <>
          <Sparkle delay={0} style={{ top: -6, left: -4 }} />
          <Sparkle delay={0.7} style={{ top: 10, right: -8 }} />
          <Sparkle delay={1.3} style={{ top: -14, right: 14 }} />
        </>
      )}
      <div className="relative mb-2">
        {delta != null && (
          <span
            key={delta.key}
            className="absolute left-1/2 -translate-x-1/2 -top-7 font-mono text-[10px] font-semibold px-2.5 py-1 rounded-full text-white whitespace-nowrap flex items-center gap-1 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_DEEP})`, animation: "var(--animate-float-up)" }}
          >
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="white"><path d="M12 4l8 10h-5v6h-6v-6H4z" /></svg>
            {delta.text}
          </span>
        )}
        {style.crown && (
          <svg viewBox="0 0 24 24" className="w-7 h-7 absolute -top-5 left-1/2 -translate-x-1/2 drop-shadow-md" fill="#FBBF24" style={{ animation: "var(--animate-float)" }}>
            <path d="M3 8l4 3 5-6 5 6 4-3-2 10H5L3 8z" />
          </svg>
        )}
        <div
          className="rounded-full transition-all duration-500"
          style={{
            boxShadow: flash
              ? `0 0 0 4px white, 0 0 0 6px ${style.ring}, 0 0 20px 4px ${style.glow}`
              : `0 0 0 3px white, 0 0 0 4px ${style.ring}, 0 0 16px 2px ${style.glow}`,
            animation: isFirst ? "pulseGlowGold 2.4s ease-in-out infinite" : "none",
          }}
        >
          {isFirst ? <RingedAvatar item={item} className={style.avatarSize} /> : <Avatar item={item} className={style.avatarSize} />}
        </div>
      </div>
      <span className="text-sm font-semibold text-white/90 text-center leading-tight max-w-[110px] truncate">{item.name}</span>
      <span className="font-mono text-sm font-bold mt-1 bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${PRIMARY_DEEP}, ${PRIMARY})` }}>
        {valueLabel}
      </span>
      <span className="text-[10px] text-white/45 uppercase tracking-wide">{unit}</span>
      {subLabel ? <span className="text-[10px] text-white/35 mb-3">{subLabel}</span> : <span className="mb-3" />}
      <div
        className={`podium-platform relative w-full ${style.height} flex items-start justify-center pt-2 transition-all duration-500 overflow-hidden shadow-inner`}
        style={{ background: style.medal }}
      >
        <div className="absolute inset-0 opacity-40" style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.6) 50%, transparent 70%)", backgroundSize: "220% 220%", animation: "shimmerSweep 3.5s ease-in-out infinite" }} />
        <span className="relative font-mono text-xs font-bold" style={{ color: style.medalFg }}>
          #{rank + 1}
        </span>
      </div>
    </div>
  );
}

function ListRow({ item, rank, value, max, valueLabel, unit, subLabel, flash, delta }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-500 hover:bg-white/10 hover:shadow-md hover:-translate-y-0.5 ${flash ? "bg-white/10 shadow-md -translate-y-0.5" : ""}`}
      style={{ border: flash ? `1px solid ${PRIMARY}55` : "1px solid transparent", animation: "rowIn 0.5s ease-out both", animationDelay: `${rank * 0.05}s` }}
    >
      {delta != null && (
        <span
          key={delta.key}
          className="absolute right-3 -top-2.5 font-mono text-[10px] font-semibold px-2.5 py-1 rounded-full text-white flex items-center gap-1 shadow-lg z-10"
          style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_DEEP})`, animation: "var(--animate-float-up)" }}
        >
          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="white"><path d="M12 4l8 10h-5v6h-6v-6H4z" /></svg>
          {delta.text}
        </span>
      )}
      <RankBadge rank={rank} />
      <Avatar item={item} className="w-8 h-8 text-[11px]" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate">{item.name}</span>
          <span className="font-mono text-xs font-bold shrink-0" style={{ color: "#d9b9ff" }}>
            {valueLabel}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="text-xs text-white/45 truncate">
            {item.area} · {item.kind}
            {subLabel ? ` · ${subLabel}` : ""}
          </span>
          <span className="text-[10px] text-white/35 uppercase tracking-wide shrink-0">{unit}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 mt-1.5 overflow-hidden relative">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${PRIMARY_DEEP}, ${PRIMARY})` }}
          >
            <div className="absolute inset-0" style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.7) 50%, transparent 70%)", backgroundSize: "220% 220%", animation: "shimmerSweep 2.8s ease-in-out infinite" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderPanel({ title, icon, items, valueKey, valueLabelFn, unit, subLabelFn, loading, error, connected, flashIdx, delta }) {
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

  // AUDIT ADDITION: error and empty states were previously unhandled —
  // an API failure silently fell back to fake data (removed above in
  // LeaderboardSection), and zero real entries just rendered a blank
  // podium/list with no explanation. Both now show a clear, honest
  // message instead.
  if (error && items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 md:p-7">
        <h3 className="font-serif text-xl mb-6">{title}</h3>
        <div className="text-center py-10">
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 md:p-7">
        <h3 className="font-serif text-xl mb-6">{title}</h3>
        <div className="text-center py-10">
          <p className="text-slate-500 text-sm">No entries yet. Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel leaderboard-panel relative rounded-3xl p-[1px] overflow-hidden" style={{ background: `linear-gradient(155deg, ${PRIMARY}44, transparent 30%, transparent 70%, ${PRIMARY}33)` }}>
      <div className="relative bg-[linear-gradient(145deg,#22134b_0%,#35206f_48%,#17152f_100%)] text-white/90 backdrop-blur-sm rounded-3xl shadow-[0_18px_50px_rgba(77,43,138,0.25)] p-6 md:p-7 overflow-hidden">
        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-[0.14] pointer-events-none" style={{ background: PRIMARY }} />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#302064]/40 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between mb-6 relative">
          <h3 className="font-serif text-xl flex items-center gap-2 text-white">
            {icon && (
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${PRIMARY}35` }}>
                <Icon name={icon} className="w-4 h-4" style={{ color: PRIMARY_DEEP }} />
              </span>
            )}
            {title}
          </h3>
          <LivePill connected={connected} />
        </div>
        <div className="relative flex items-end justify-center gap-3 mb-6 pt-4">
          {top3.map((item, i) => (
            <PodiumCard
              key={item.id || item.name || i}
              item={item}
              rank={i}
              valueLabel={valueLabelFn(item)}
              unit={unit}
              subLabel={subLabelFn ? subLabelFn(item) : null}
              flash={flashIdx === i}
              delta={delta && delta.idx === i ? delta : null}
            />
          ))}
        </div>
        <div className="relative flex flex-col gap-1.5 border-t border-white/10 pt-4">
          {rest.map((item, i) => {
            const rank = i + 3;
            return (
              <ListRow
                key={item.id || item.name || i}
                item={item}
                rank={rank}
                value={item[valueKey]}
                max={max}
                valueLabel={valueLabelFn(item)}
                unit={unit}
                subLabel={subLabelFn ? subLabelFn(item) : null}
                flash={flashIdx === rank}
                delta={delta && delta.idx === rank ? delta : null}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Diffs a previous vs next leaderboard array on `valueKey` and returns
 * the index (in `next`) of the entry whose value increased the most,
 * along with the delta amount — used to drive the flash + "+N" badge.
 */
function diffLeaderboard(prev, next, valueKey) {
  if (!prev || prev.length === 0) return null;
  const prevMap = new Map(prev.map((p) => [p.id || p.name, p[valueKey]]));
  let bestIdx = -1;
  let bestGain = 0;
  next.forEach((item, idx) => {
    const key = item.id || item.name;
    const before = prevMap.get(key);
    if (before == null) return;
    const gain = item[valueKey] - before;
    if (gain > bestGain) {
      bestGain = gain;
      bestIdx = idx;
    }
  });
  if (bestIdx === -1) return null;
  return { idx: bestIdx, gain: bestGain };
}

/**
 * LeaderboardSection component - Displays donor and volunteer leaderboards
 * Live-updates via socket events; flashes + shows a "+N" badge on whichever
 * row just moved.
 */
export function LeaderboardSection() {
  const [ref, visible] = useReveal();
  const [donors, setDonors] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket, connected } = useSocket();

  const [flashIdx, setFlashIdx] = useState({ d: -1, v: -1 });
  const [deltaD, setDeltaD] = useState(null);
  const [deltaV, setDeltaV] = useState(null);
  const prevDonorsRef = useRef(null);
  const prevVolunteersRef = useRef(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const [donorsRes, volunteersRes] = await Promise.all([
          axios.get(`${API_BASE}/public/leaderboard/donors?limit=10`),
          axios.get(`${API_BASE}/public/leaderboard/volunteers?limit=10`),
        ]);

        setDonors(donorsRes.data.data.donors?.length ? donorsRes.data.data.donors : DEMO_DONORS);
        setVolunteers(volunteersRes.data.data.volunteers?.length ? volunteersRes.data.data.volunteers : DEMO_VOLUNTEERS);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        // AUDIT FIX: previously fell back to hardcoded fake donor/volunteer
        // names and counts here (and unconditionally during every loading
        // phase too — see the old FALLBACK_DONORS/FALLBACK_VOLUNTEERS
        // constants). Now just surfaces a real error state instead of
        // inventing leaderboard entries; the `error` value is passed down
        // to LeaderPanel below so it's actually visible to the person
        // instead of being silently swallowed.
        setDonors(DEMO_DONORS);
        setVolunteers(DEMO_VOLUNTEERS);
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

  // Detect which row moved whenever donors/volunteers change, to drive flash + delta badge
  useEffect(() => {
    if (donors.length === 0) return;
    const diff = diffLeaderboard(prevDonorsRef.current, donors, "donations");
    if (diff) {
      setFlashIdx((f) => ({ ...f, d: diff.idx }));
      setDeltaD({ idx: diff.idx, text: `+${diff.gain}`, key: Date.now() });
    }
    prevDonorsRef.current = donors;
  }, [donors]);

  useEffect(() => {
    if (volunteers.length === 0) return;
    const diff = diffLeaderboard(prevVolunteersRef.current, volunteers, "pickups");
    if (diff) {
      setFlashIdx((f) => ({ ...f, v: diff.idx }));
      setDeltaV({ idx: diff.idx, text: `+${diff.gain}`, key: Date.now() + 1 });
    }
    prevVolunteersRef.current = volunteers;
  }, [volunteers]);

  useEffect(() => {
    if (flashIdx.d === -1 && flashIdx.v === -1) return;
    const t = setTimeout(() => setFlashIdx({ d: -1, v: -1 }), 1000);
    return () => clearTimeout(t);
  }, [flashIdx]);

  useEffect(() => {
    if (!deltaD) return;
    const t = setTimeout(() => setDeltaD(null), 1400);
    return () => clearTimeout(t);
  }, [deltaD]);

  useEffect(() => {
    if (!deltaV) return;
    const t = setTimeout(() => setDeltaV(null), 1400);
    return () => clearTimeout(t);
  }, [deltaV]);

  const displayDonors = donors.length ? donors : DEMO_DONORS;
  const displayVolunteers = volunteers.length ? volunteers : DEMO_VOLUNTEERS;

  return (
    <div ref={ref} className="grid md:grid-cols-2 gap-6">
      <LeaderPanel
        title="Top donors"
        icon="trophy"
        items={displayDonors}
        valueKey="donations"
        valueLabelFn={(d) => `${d.donations}`}
        unit="Donations"
        loading={loading}
        error={error}
        connected={connected}
        flashIdx={flashIdx.d}
        delta={deltaD}
      />
      <LeaderPanel
        title="Top volunteers"
        icon="volunteer"
        items={displayVolunteers}
        valueKey="pickups"
        valueLabelFn={(v) => `${v.pickups}`}
        unit="Pickups"
        loading={loading}
        error={error}
        connected={connected}
        flashIdx={flashIdx.v}
        delta={deltaV}
      />
    </div>
  );
}
