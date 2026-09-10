import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  AlertCircle,
  Loader2,
  Search,
  X,
  SlidersHorizontal,
  RefreshCw,
  Package,
  MessageSquare,
  Shield,
  Clock,
  Radio,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthSocket } from '../context/SocketContext';
import { DashboardLayout } from '../components/dashboard';
import {
  getNotificationMeta,
  getNotificationRoute,
  formatNotificationTimestamp,
} from '../utils/notificationMeta';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const DONATION_TYPES = new Set([
  'donation_created',
  'donation_accepted',
  'volunteer_assigned',
  'pickup_scheduled',
  'volunteer_on_the_way',
  'pickup_completed',
  'donation_cancelled',
  'assignment_changed',
  'team_donation_assigned',
  'team_donation_completed',
]);

const MESSAGE_TYPES = new Set(['new_message']);

/**
 * NotificationsPage — High-End Notification & Mission Activity Center.
 * Encapsulated in DashboardLayout with real-time Socket.io synchronization,
 * rich filtering, instant search, grouped timeline, and inline actions.
 */
export function NotificationsPage() {
  const navigate = useNavigate();
  const { socket, connected, unreadCount } = useAuthSocket();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, donations, messages, system
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  const fetchNotifications = useCallback(async (isRefresh = false, pageNum = 1) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (pageNum === 1) {
      setLoading(true);
    }
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({ page: pageNum, limit: 25 });
      if (filter === 'unread') {
        params.append('status', 'unread');
      }

      const response = await axios.get(`${API_BASE}/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        const newNotifications = response.data.data.notifications || [];
        setNotifications((prev) => (pageNum === 1 ? newNotifications : [...prev, ...newNotifications]));
        setHasMore(newNotifications.length === 25);
      } else {
        setError(response.data?.message || 'Failed to load notifications');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications(false, page);
  }, [fetchNotifications, page]);

  // Real-time socket sync
  useEffect(() => {
    if (socket) {
      const handleNotification = (notification) => {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notification.id)) return prev;
          return [notification, ...prev];
        });
      };

      const handleNotificationRead = ({ notificationId }) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_read: 1 } : n))
        );
      };

      const handleNotificationsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      };

      socket.on('notification', handleNotification);
      socket.on('notification_read', handleNotificationRead);
      socket.on('notifications_read', handleNotificationsRead);

      return () => {
        socket.off('notification', handleNotification);
        socket.off('notification_read', handleNotificationRead);
        socket.off('notifications_read', handleNotificationsRead);
      };
    }
  }, [socket]);

  // Handle marking individual notification as read
  const handleMarkAsRead = async (notificationId, e) => {
    if (e) e.stopPropagation();
    setMarkingId(notificationId);
    try {
      const token = localStorage.getItem('accessToken');
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: 1 } : n))
      );
      await axios.patch(`${API_BASE}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Marked as read', { id: `read-${notificationId}`, duration: 2000 });
    } catch {
      toast.error('Could not update notification status');
    } finally {
      setMarkingId(null);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const token = localStorage.getItem('accessToken');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      await axios.patch(`${API_BASE}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('All notifications marked as read', { icon: '✨' });
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  // Click card to navigate and auto-mark as read
  const handleCardClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    const route = getNotificationRoute(notification);
    if (route) {
      navigate(route);
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    setPage(1);
    fetchNotifications(true, 1);
  };

  // Filter & Search computation
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // 1. Category tab filter
      if (filter === 'unread' && item.is_read) return false;
      if (filter === 'donations' && !DONATION_TYPES.has(item.type)) return false;
      if (filter === 'messages' && !MESSAGE_TYPES.has(item.type)) return false;
      if (filter === 'system' && (DONATION_TYPES.has(item.type) || MESSAGE_TYPES.has(item.type))) {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(query);
        const messageMatch = item.message?.toLowerCase().includes(query);
        const typeMatch = item.type?.toLowerCase().replace(/_/g, ' ').includes(query);
        return titleMatch || messageMatch || typeMatch;
      }

      return true;
    });
  }, [notifications, filter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.is_read).length;
    const donations = notifications.filter((n) => DONATION_TYPES.has(n.type)).length;
    return { total, unread, donations };
  }, [notifications]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups = { today: [], yesterday: [], thisWeek: [], earlier: [] };
    const now = new Date();
    const todayStr = now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    filteredNotifications.forEach((notification) => {
      const date = new Date(notification.created_at);
      const dateStr = date.toDateString();

      if (dateStr === todayStr) {
        groups.today.push(notification);
      } else if (dateStr === yesterdayStr) {
        groups.yesterday.push(notification);
      } else if (date > weekAgo) {
        groups.thisWeek.push(notification);
      } else {
        groups.earlier.push(notification);
      }
    });

    return groups;
  }, [filteredNotifications]);

  const groupSections = [
    { key: 'today', label: 'Today', items: groupedNotifications.today },
    { key: 'yesterday', label: 'Yesterday', items: groupedNotifications.yesterday },
    { key: 'thisWeek', label: 'This Week', items: groupedNotifications.thisWeek },
    { key: 'earlier', label: 'Earlier', items: groupedNotifications.earlier },
  ].filter((g) => g.items.length > 0);

  const filterTabs = [
    { id: 'all', label: 'All', count: stats.total },
    { id: 'unread', label: 'Unread', count: stats.unread, highlight: stats.unread > 0 },
    { id: 'donations', label: 'Donations & Pickups', icon: Package },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'system', label: 'System & Notices', icon: Shield },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Hero Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-dash-primary/10 via-surface to-surface border border-border/80 p-6 md:p-8 shadow-pb-card">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-dash-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-dash-primary to-dash-primary-hover flex items-center justify-center text-white shadow-lg shadow-dash-primary/25 shrink-0">
                <Bell className="w-7 h-7" />
                {stats.unread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 ring-4 ring-surface animate-pulse" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
                    Notification Center
                  </h1>
                  {stats.unread > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      {stats.unread} unread {stats.unread === 1 ? 'alert' : 'alerts'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-success-soft text-success border border-success/20">
                      <CheckCircle2 size={12} />
                      All caught up
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary mt-1 max-w-xl">
                  Real-time updates, food rescue missions, volunteer dispatches, and activity reports tailored for your account.
                </p>

                {/* Live Socket Status */}
                <div className="flex items-center gap-2 mt-3 text-xs font-medium">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${
                      connected
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    }`}
                  >
                    <Radio size={12} className={connected ? 'animate-pulse text-emerald-500' : 'text-amber-500'} />
                    {connected ? 'Live Sync Active' : 'Sync Reconnecting...'}
                  </span>
                  <span className="text-text-muted text-[11px] hidden sm:inline">
                    • Instant delivery over WebSocket
                  </span>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                title="Refresh notifications"
                className="p-2.5 bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary rounded-xl border border-border transition-all shadow-pb-subtle disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-dash-primary cursor-pointer"
                aria-label="Refresh notifications"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin text-dash-primary' : ''} />
              </button>

              <button
                onClick={() => navigate('/donor/settings?tab=notifications')}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs md:text-sm font-medium bg-surface hover:bg-surface-hover text-text-primary rounded-xl border border-border transition-all shadow-pb-subtle focus:outline-none focus:ring-2 focus:ring-dash-primary cursor-pointer"
              >
                <SlidersHorizontal size={15} className="text-dash-primary" />
                <span className="hidden sm:inline">Preferences</span>
              </button>

              {stats.unread > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-semibold bg-dash-primary hover:bg-dash-primary-hover text-white rounded-xl shadow-md shadow-dash-primary/20 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2 cursor-pointer"
                >
                  {markingAll ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCheck size={16} />
                  )}
                  <span>Mark All as Read</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick KPI Stat Strips */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-surface rounded-2xl border border-border/70 p-4 transition-all hover:border-dash-primary/40 shadow-pb-subtle flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-dash-primary-soft flex items-center justify-center text-dash-primary shrink-0">
              <Bell size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-secondary font-medium">Total Updates</p>
              <p className="text-lg font-bold text-text-primary">{stats.total}</p>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-border/70 p-4 transition-all hover:border-dash-primary/40 shadow-pb-subtle flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              stats.unread > 0 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-success-soft text-success'
            }`}>
              <Clock size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-secondary font-medium">Unread Alerts</p>
              <p className="text-lg font-bold text-text-primary">{stats.unread}</p>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-border/70 p-4 transition-all hover:border-dash-primary/40 shadow-pb-subtle flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Package size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-secondary font-medium">Donation Milestones</p>
              <p className="text-lg font-bold text-text-primary">{stats.donations}</p>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-border/70 p-4 transition-all hover:border-dash-primary/40 shadow-pb-subtle flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              connected ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
            }`}>
              <Radio size={18} className={connected ? 'animate-pulse' : ''} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-secondary font-medium">Real-time Stream</p>
              <p className="text-sm font-bold text-text-primary">
                {connected ? 'Active & Synced' : 'Reconnecting'}
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar: Category Filter Tabs & Live Search */}
        <div className="bg-surface rounded-2xl border border-border/70 p-3 md:p-4 shadow-pb-subtle space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none" role="tablist">
              {filterTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setFilter(tab.id);
                      setPage(1);
                    }}
                    role="tab"
                    aria-selected={isActive}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-dash-primary text-white shadow-sm shadow-dash-primary/30'
                        : 'bg-page hover:bg-surface-hover text-text-secondary border border-border/60 hover:text-text-primary'
                    }`}
                  >
                    {Icon && <Icon size={14} />}
                    <span>{tab.label}</span>
                    {typeof tab.count === 'number' && (
                      <span
                        className={`text-[11px] font-semibold px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : tab.highlight
                            ? 'bg-rose-500 text-white'
                            : 'bg-surface text-text-muted border border-border/50'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Instant Search Bar */}
            <div className="relative w-full md:w-72 shrink-0">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-page border border-border rounded-xl text-xs md:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 rounded transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Active Filter / Search Info Bar */}
          {(searchQuery || filter !== 'all') && (
            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-dash-primary" />
                Showing {filteredNotifications.length} matching{' '}
                {filteredNotifications.length === 1 ? 'notification' : 'notifications'}
                {searchQuery && ` for "${searchQuery}"`}
              </span>
              <button
                onClick={() => {
                  setFilter('all');
                  setSearchQuery('');
                }}
                className="text-dash-primary hover:text-dash-primary-hover font-medium underline cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-danger-soft border border-danger/25 rounded-2xl p-4 text-danger flex items-center justify-between gap-3 shadow-pb-subtle">
            <div className="flex items-center gap-3 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchNotifications(false, 1)}
              className="text-xs font-semibold underline hover:opacity-80 px-2 py-1 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Content Area */}
        {loading && page === 1 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-24 bg-surface rounded-2xl border border-border/60 animate-pulse p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-border/40 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-border/40 rounded" />
                  <div className="h-3 w-3/4 bg-border/30 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-surface border border-border/70 rounded-3xl p-12 text-center shadow-pb-card">
            <div className="w-16 h-16 rounded-3xl bg-dash-primary-soft text-dash-primary mx-auto flex items-center justify-center mb-4 shadow-sm">
              {searchQuery ? <Search size={28} /> : <CheckCircle2 size={28} />}
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-1">
              {searchQuery
                ? `No notifications found for "${searchQuery}"`
                : filter === 'unread'
                ? "You're completely caught up!"
                : 'No notifications in this view'}
            </h3>
            <p className="text-sm text-text-secondary max-w-md mx-auto mb-5">
              {searchQuery
                ? 'Try adjusting your search terms or clearing your filter to view other alerts.'
                : filter === 'unread'
                ? 'There are no pending unread notifications for your account right now.'
                : 'Updates about donation pickups, assignments, and volunteer communication will appear here.'}
            </p>
            {(searchQuery || filter !== 'all') && (
              <button
                onClick={() => {
                  setFilter('all');
                  setSearchQuery('');
                }}
                className="px-5 py-2 text-xs md:text-sm font-semibold bg-dash-primary hover:bg-dash-primary-hover text-white rounded-xl transition-all shadow-sm shadow-dash-primary/20 cursor-pointer"
              >
                View All Notifications
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {groupSections.map((group) => (
              <div key={group.key} className="space-y-2.5">
                {/* Section Header */}
                <div className="flex items-center gap-2 px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    {group.label}
                  </h3>
                  <span className="text-[11px] font-semibold text-text-secondary bg-surface px-2 py-0.5 rounded-full border border-border/60">
                    {group.items.length}
                  </span>
                  <div className="flex-1 h-px bg-border/50 ml-2" />
                </div>

                {/* Notifications List */}
                <div className="space-y-2.5">
                  <AnimatePresence>
                    {group.items.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onCardClick={() => handleCardClick(notification)}
                        onMarkAsRead={(e) => handleMarkAsRead(notification.id, e)}
                        isMarking={markingId === notification.id}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-surface hover:bg-surface-hover text-text-primary rounded-xl border border-border transition-all shadow-pb-subtle disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-dash-primary cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-dash-primary" />
                      <span>Loading updates...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Notifications</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/**
 * NotificationCard — Premium, responsive notification card with semantic accent,
 * dynamic badges, direct route action, and inline mark-as-read.
 */
function NotificationCard({ notification, onCardClick, onMarkAsRead, isMarking }) {
  const isUnread = !notification.is_read;
  const { Icon, toneClass } = getNotificationMeta(notification.type);
  const route = getNotificationRoute(notification);

  // Category Tag Helper
  const getCategoryBadge = (type) => {
    if (DONATION_TYPES.has(type)) {
      if (type.includes('completed')) return { label: 'Completed', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' };
      if (type.includes('on_the_way') || type.includes('scheduled')) return { label: 'Pickup Active', color: 'text-sky-600 bg-sky-500/10 border-sky-500/20' };
      if (type.includes('cancelled')) return { label: 'Cancelled', color: 'text-rose-600 bg-rose-500/10 border-rose-500/20' };
      return { label: 'Donation', color: 'text-dash-primary bg-dash-primary-soft border-dash-primary/20' };
    }
    if (MESSAGE_TYPES.has(type)) {
      return { label: 'New Message', color: 'text-violet-600 bg-violet-500/10 border-violet-500/20' };
    }
    return { label: 'Notice', color: 'text-text-secondary bg-page border-border/60' };
  };

  const badge = getCategoryBadge(notification.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      onClick={onCardClick}
      className={`group relative w-full p-4 md:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 md:gap-4 ${
        isUnread
          ? 'bg-surface hover:bg-surface-hover border-dash-primary/35 shadow-pb-card border-l-4 border-l-dash-primary'
          : 'bg-surface/80 hover:bg-surface border-border/70 hover:border-border hover:shadow-pb-subtle'
      }`}
    >
      {/* Icon Badge */}
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105 ${toneClass}`}
      >
        <Icon size={20} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.color}`}
            >
              {badge.label}
            </span>
            <span className="text-[11px] text-text-muted flex items-center gap-1">
              <Clock size={11} />
              {formatNotificationTimestamp(notification.created_at)}
            </span>
          </div>

          {/* Quick Actions (Unread Indicator & Mark Read Button) */}
          <div className="flex items-center gap-2">
            {isUnread && (
              <button
                onClick={onMarkAsRead}
                disabled={isMarking}
                title="Mark as read"
                className="opacity-90 group-hover:opacity-100 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-dash-primary hover:text-white hover:bg-dash-primary rounded-lg border border-dash-primary/30 transition-all focus:outline-none cursor-pointer"
              >
                {isMarking ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <CheckCheck size={12} />
                )}
                <span className="hidden sm:inline">Mark read</span>
              </button>
            )}

            {isUnread && (
              <span className="w-2.5 h-2.5 rounded-full bg-dash-primary shadow-xs shadow-dash-primary shrink-0" />
            )}
          </div>
        </div>

        {/* Title */}
        <h4
          className={`text-sm md:text-base leading-snug ${
            isUnread
              ? 'font-bold text-text-primary'
              : 'font-semibold text-text-primary/90'
          }`}
        >
          {notification.title}
        </h4>

        {/* Message Body */}
        <p className="text-xs md:text-sm text-text-secondary mt-1 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>

        {/* Action Link Footer */}
        {route && (
          <div className="mt-2.5 flex items-center gap-1 text-xs font-semibold text-dash-primary group-hover:text-dash-primary-hover group-hover:translate-x-0.5 transition-all">
            <span>
              {notification.type.includes('message')
                ? 'Open conversation'
                : 'View donation details'}
            </span>
            <ArrowRight size={13} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

