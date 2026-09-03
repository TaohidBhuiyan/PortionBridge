import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flag, Clock, Truck, UserX, WifiOff, MapPinOff, ShieldAlert, RefreshCw, CheckCircle2,
} from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { SkeletonCard } from '../components/dashboard/skeletons';
import { adminApi } from '../services/adminApi';

const AUTO_REFRESH_MS = 60000;

// Display order + icon/label per item type — mirrors
// admin.service.js#ATTENTION_ITEM_META on the backend (severity/title come
// from there; this is just presentation).
const TYPE_META = {
  reported_donation: { label: 'Reported Donations', icon: Flag },
  pending_moderation: { label: 'Pending Moderation', icon: ShieldAlert },
  delayed_pickup: { label: 'Delayed Pickups', icon: Clock },
  delayed_delivery: { label: 'Delayed Deliveries', icon: Truck },
  unassigned_donation: { label: 'Unassigned Donations', icon: UserX },
  inactive_volunteer: { label: 'Inactive Volunteers', icon: WifiOff },
  stale_location: { label: 'Stale Locations', icon: MapPinOff },
};
const TYPE_ORDER = Object.keys(TYPE_META);

const SEVERITY_TONE = {
  high: 'bg-danger-soft text-danger',
  medium: 'bg-warning-soft text-warning',
  low: 'bg-info-soft text-info',
};

function timeAgo(value) {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * AdminAttentionCenter — "Attention Center" (Phase 7: Admin Attention
 * Center + Smart Monitoring).
 *
 * A single flat list from the backend (admin.service.js#getAttentionCenter)
 * doubles as both "What Needs Attention" (grouped by category below) and
 * "Alerts" — there's deliberately no separate alerts endpoint/table, so
 * there's nothing that can drift into a duplicate or contradictory signal
 * for the same real condition. Auto-refreshes every 60s (on top of a
 * manual refresh button) since this is meant to be a monitoring view, not
 * a one-time report — but it's still a plain REST poll, not a new
 * socket/notification mechanism.
 */
export function AdminAttentionCenter() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setError(null);
      const result = await adminApi.getAttentionCenter();
      if (cancelled) return;
      if (result.success) {
        setItems(result.data?.items || []);
        setGeneratedAt(result.data?.generatedAt || null);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };

    load();
    const interval = setInterval(() => setRefreshTrigger((t) => t + 1), AUTO_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refreshTrigger]);

  const grouped = useMemo(() => {
    const map = {};
    for (const item of items) {
      if (!map[item.type]) map[item.type] = [];
      map[item.type].push(item);
    }
    return map;
  }, [items]);

  const counts = useMemo(() => ({
    high: items.filter((i) => i.severity === 'high').length,
    medium: items.filter((i) => i.severity === 'medium').length,
    low: items.filter((i) => i.severity === 'low').length,
  }), [items]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <SkeletonCard count={1} />
          <SkeletonCard count={4} />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorState title="Failed to load attention center" message={error} onRetry={() => setRefreshTrigger((t) => t + 1)} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Attention Center</h1>
            <p className="text-text-secondary text-sm">
              Real donations, reports, and volunteers that need a look right now.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {generatedAt && (
              <span className="text-xs text-text-secondary">Updated {timeAgo(generatedAt)}</span>
            )}
            <button
              onClick={() => setRefreshTrigger((t) => t + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-text-secondary text-xs font-medium hover:bg-surface-hover transition-colors"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface rounded-lg border border-border/50 p-4 text-center transition-[box-shadow,transform] duration-150 hover:shadow-pb-card hover:-translate-y-0.5">
            <p className="text-2xl font-bold text-danger">{counts.high}</p>
            <p className="text-xs text-text-secondary">High Priority</p>
          </div>
          <div className="bg-surface rounded-lg border border-border/50 p-4 text-center transition-[box-shadow,transform] duration-150 hover:shadow-pb-card hover:-translate-y-0.5">
            <p className="text-2xl font-bold text-warning">{counts.medium}</p>
            <p className="text-xs text-text-secondary">Medium Priority</p>
          </div>
          <div className="bg-surface rounded-lg border border-border/50 p-4 text-center transition-[box-shadow,transform] duration-150 hover:shadow-pb-card hover:-translate-y-0.5">
            <p className="text-2xl font-bold text-info">{counts.low}</p>
            <p className="text-xs text-text-secondary">Low Priority</p>
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Nothing needs attention right now"
            description="Reported donations, delays, unassigned pickups, and offline volunteers will show up here."
            showAction={false}
          />
        ) : (
          <div className="space-y-4">
            {TYPE_ORDER.filter((type) => grouped[type]?.length).map((type) => {
              const { label, icon: Icon } = TYPE_META[type];
              const typeItems = grouped[type];
              return (
                <div key={type} className="bg-surface rounded-lg border border-border/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={15} className="text-dash-primary" />
                    <h2 className="text-sm font-semibold text-text-primary">{label}</h2>
                    <span className="text-xs text-text-secondary">({typeItems.length})</span>
                  </div>
                  <ul className="divide-y divide-border/50">
                    {typeItems.map((item) => (
                      <li
                        key={item.id}
                        onClick={() => navigate(item.link)}
                        className="py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-hover rounded-md px-2 -mx-2 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs text-text-primary truncate">{item.description}</p>
                          <p className="text-[11px] text-text-secondary">{timeAgo(item.detectedAt)}</p>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium ${SEVERITY_TONE[item.severity]}`}>
                          {item.severity}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}