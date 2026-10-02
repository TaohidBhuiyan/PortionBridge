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
        {/* Gradient Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 dark:from-amber-800 dark:via-orange-900 dark:to-red-950 shadow-pb-elevated p-6 md:p-8 text-white">
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-yellow-300/20 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-md shadow-inner shrink-0">
                <ShieldAlert size={28} className="text-white drop-shadow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Attention Center</h1>
                </div>
                <p className="text-amber-100/90 text-sm mt-1 max-w-xl">
                  Real-time operational alerts, delayed deliveries, reported items, and idle resources.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              {generatedAt && (
                <span className="text-xs text-white/80 font-medium">Updated {timeAgo(generatedAt)}</span>
              )}
              <button
                onClick={() => setRefreshTrigger((t) => t + 1)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 border border-white/25 backdrop-blur-md text-white text-xs font-semibold hover:bg-white/25 transition-all shadow-sm active:scale-95"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Priority Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface rounded-2xl border border-rose-200 dark:border-rose-900/50 p-5 shadow-pb-card flex items-center justify-between transition-all hover:scale-[1.01]">
            <div>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">High Priority</p>
              <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">{counts.high}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-amber-200 dark:border-amber-900/50 p-5 shadow-pb-card flex items-center justify-between transition-all hover:scale-[1.01]">
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Medium Priority</p>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{counts.medium}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-blue-200 dark:border-blue-900/50 p-5 shadow-pb-card flex items-center justify-between transition-all hover:scale-[1.01]">
            <div>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Low Priority</p>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">{counts.low}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
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
                <div key={type} className="bg-surface rounded-2xl border border-border p-5 shadow-pb-card">
                  <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900 flex items-center justify-center">
                      <Icon size={16} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="text-base font-bold text-text-primary">{label}</h2>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-page text-text-secondary border border-border">
                      {typeItems.length}
                    </span>
                  </div>
                  <ul className="divide-y divide-border/60">
                    {typeItems.map((item) => {
                      const severityBadges = {
                        high: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-900',
                        medium: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-900',
                        low: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-900',
                      };
                      return (
                        <li
                          key={item.id}
                          onClick={() => navigate(item.link)}
                          className="py-3 px-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-surface-hover/80 rounded-xl transition-all group"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-text-primary group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                              {item.description}
                            </p>
                            <p className="text-xs text-text-secondary mt-0.5">{timeAgo(item.detectedAt)}</p>
                          </div>
                          <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold capitalize border ${severityBadges[item.severity] || 'bg-gray-100 text-gray-700'}`}>
                            {item.severity}
                          </span>
                        </li>
                      );
                    })}
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