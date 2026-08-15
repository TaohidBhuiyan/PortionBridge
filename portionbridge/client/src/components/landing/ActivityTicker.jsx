import { useState, useEffect } from "react";
import { Icon } from "../common/Icon";
import { useSocket } from "../../context/SocketContext";

const PRIMARY_DEEP = "var(--color-primary-deep)";
const PRIMARY_TINT = "var(--color-primary-tint)";

const ICON_MAP = {
  donation_created: "food",
  donation_completed: "food",
  pickup_completed: "shirt",
  volunteer_registered: "bolt",
  food: "food",
  shirt: "shirt",
  bolt: "bolt",
  pin: "pin",
};

/**
 * ActivityTicker component - Scrolling horizontal marquee showing recent
 * real activity from the platform (donations, pickups, new volunteers).
 *
 * AUDIT FIX: previously shipped a hardcoded list of fabricated activity
 * events (fictional names like "Rafiul from Agrabad", specific fake
 * donation amounts) shown by default on every load and used again as a
 * fallback whenever the real socket feed came back empty. Removed
 * entirely — the ticker now only renders once real activity arrives from
 * the backend's get_activity_feed handler (a real audit_logs query), and
 * simply doesn't render at all if there's no real activity yet, rather
 * than inventing any.
 */
export function ActivityTicker() {
  const { socket, connected } = useSocket();
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!socket || !connected) return;

    // Request initial activity feed
    socket.emit('get_activity_feed', {}, (response) => {
      if (response?.success && response.data?.activities?.length > 0) {
        const formattedActivities = response.data.activities.map(a => ({
          text: a.text,
          icon: ICON_MAP[a.type] || "bolt",
        }));
        setActivities(formattedActivities);
      }
    });

    // Listen for new activities as they happen
    const handleNewActivity = (activity) => {
      setActivities(prev => {
        const icon = ICON_MAP[activity.type] || "bolt";
        const newActivity = {
          text: activity.text,
          icon,
        };
        return [newActivity, ...prev].slice(0, 20);
      });
    };

    socket.on('new_activity', handleNewActivity);

    return () => {
      socket.off('new_activity', handleNewActivity);
    };
  }, [socket, connected]);

  if (activities.length === 0) return null;

  const items = [...activities, ...activities];

  return (
    <div className="relative overflow-hidden border-y" style={{ borderColor: PRIMARY_TINT, background: PRIMARY_TINT }}>
      {/* Premium Side Fades */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-primary-tint to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-primary-tint to-transparent pointer-events-none z-10" />

      <div 
        className="flex gap-10 py-2.5 whitespace-nowrap" 
        style={{ width: "max-content", animation: "scrollx-rtl 22s linear infinite" }}
      >
        {items.map((t, i) => (
          <span key={i} className="text-xs font-semibold tracking-wide flex items-center gap-2" style={{ color: PRIMARY_DEEP }}>
            <Icon name={t.icon} className="w-3.5 h-3.5 shrink-0" />
            {t.text}
          </span>
        ))}
      </div>
    </div>
  );
}
