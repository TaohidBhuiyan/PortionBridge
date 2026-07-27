import React, { useState, useEffect } from "react";
import { Icon } from "../common/Icon";
import { useSocket } from "../../context/SocketContext";

const PRIMARY = "oklch(60.6% 0.25 292.717)";
const PRIMARY_DEEP = "oklch(38% 0.19 292.717)";
const PRIMARY_TINT = "oklch(94% 0.03 292.717)";

const FALLBACK_TICKER_DATA = [
  { text: "Rafiul from Agrabad just donated 10kg rice", icon: "food" },
  { text: "Team Nurul picked up 8 cloths from Halishahar", icon: "shirt" },
  { text: "Nusrat from GEC Circle donated leftover iftar rice", icon: "food" },
  { text: "Volunteer Karim is on the way to Khulshi", icon: "pin" },
  { text: "New volunteer registration: Rahim from Bayezid", icon: "bolt" },
  { text: "5 meal trays collected from Nasirabad", icon: "food" },
  { text: "12 shirts donated from Kotwali area", icon: "shirt" },
];

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
 * ActivityTicker component - Scrolling horizontal marquee showing recent activities
 */
export function ActivityTicker() {
  const { socket, connected } = useSocket();
  const [activities, setActivities] = useState(FALLBACK_TICKER_DATA);

  useEffect(() => {
    if (!socket || !connected) return;

    // Request initial activity feed
    socket.emit('get_activity_feed', {}, (response) => {
      if (response.success && response.data?.activities) {
        const formattedActivities = response.data.activities.map(a => ({
          text: a.text,
          icon: ICON_MAP[a.type] || "bolt",
        }));
        setActivities(formattedActivities.length > 0 ? formattedActivities : FALLBACK_TICKER_DATA);
      }
    });

    // Listen for new activities (backend would emit this when events occur)
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

  const items = activities.length > 0 ? [...activities, ...activities] : FALLBACK_TICKER_DATA;
  
  if (items.length === 0) return null;

  return (
    <div className="overflow-hidden border-y" style={{ borderColor: PRIMARY_TINT, background: PRIMARY_TINT }}>
      <div 
        className="flex gap-10 py-2.5 whitespace-nowrap" 
        style={{ width: "max-content", animation: "scrollx-rtl 22s linear infinite" }}
      >
        {items.map((t, i) => (
          <span key={i} className="text-xs font-medium flex items-center gap-2" style={{ color: PRIMARY_DEEP }}>
            <Icon name={t.icon} className="w-3.5 h-3.5 shrink-0" />
            {t.text}
          </span>
        ))}
      </div>
    </div>
  );
}
