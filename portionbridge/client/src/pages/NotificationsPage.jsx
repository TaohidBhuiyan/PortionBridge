import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthSocket } from '../context/SocketContext';
import { getNotificationMeta, getNotificationRoute, formatNotificationTimestamp } from '../utils/notificationMeta';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * NotificationsPage - Full notification center.
 *
 * Filtering is intentionally limited to All / Unread — the backend's
 * `type` query param only accepts a single exact type, so a "Donation"
 * or "Volunteer" filter built on top of it would silently hide most
 * donation-related notifications (there are a dozen+ donation-related
 * types). All / Unread is backed by the real `status=unread` filter and
 * matches what the backend actually supports well.
 */
export function NotificationsPage() {
  const navigate = useNavigate();
  const { socket, connected, unreadCount } = useAuthSocket();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({ page, limit: 20 });
      if (filter === 'unread') params.append('status', 'unread');

      const response = await axios.get(`${API_BASE}/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        const newNotifications = response.data.data.notifications || [];
        setNotifications(prev => (page === 1 ? newNotifications : [...prev, ...newNotifications]));
        setHasMore(newNotifications.length === 20);
      } else {
        setError(response.data?.message || 'Failed to load notifications');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page]);

  useEffect(() => {
    if (socket) {
      const handleNotification = (notification) => {
        if (page === 1) {
          setNotifications(prev => [notification, ...prev]);
        }
      };

      const handleNotificationRead = ({ notificationId }) => {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n)
        );
      };

      const handleNotificationsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
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
  }, [socket, page]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(`${API_BASE}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {
      // Non-critical — falls back to next real-time sync or refetch.
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(`${API_BASE}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {
      // Non-critical — falls back to next real-time sync or refetch.
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    const route = getNotificationRoute(notification);
    if (route) {
      navigate(route);
    }
  };

  const groupNotificationsByDate = (list) => {
    const groups = { today: [], yesterday: [], earlier: [] };
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    list.forEach((notification) => {
      const notificationDate = new Date(notification.created_at);
      if (notificationDate.toDateString() === now.toDateString()) {
        groups.today.push(notification);
      } else if (notificationDate.toDateString() === yesterday.toDateString()) {
        groups.yesterday.push(notification);
      } else {
        groups.earlier.push(notification);
      }
    });

    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(notifications);
  const groupLabels = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'earlier', label: 'Earlier' },
  ];

  if (loading && page === 1) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="h-7 w-40 bg-surface-hover rounded animate-pulse mb-6" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface rounded-lg border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Notifications</h1>
            <p className="text-sm text-text-secondary">Stay updated on your donations and activity.</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-2 px-3.5 py-2 text-sm bg-dash-primary hover:bg-dash-primary-hover text-white rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2"
            >
              {markingAll ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
              Mark All as Read
            </button>
          )}
        </div>

        {/* Connection Status */}
        {!connected && (
          <div className="flex items-center gap-2 text-warning text-xs mb-3">
            <AlertCircle size={14} />
            <span>Real-time updates disconnected</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2" role="group" aria-label="Filter notifications">
          {['all', 'unread'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-dash-primary text-white'
                  : 'bg-page border border-border text-text-secondary hover:bg-surface-hover'
              } focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2`}
              aria-pressed={filter === f}
            >
              {f === 'all' ? 'All' : 'Unread'}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-danger-soft border border-danger/20 rounded-lg p-4 mb-6" role="alert" aria-live="assertive">
          <div className="flex items-center gap-3 text-danger text-sm">
            <AlertCircle size={18} aria-hidden="true" />
            <p>{error}</p>
            <button
              onClick={fetchNotifications}
              className="ml-auto text-sm underline font-medium focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2 rounded px-2 py-1"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      {notifications.length === 0 && !loading ? (
        <div className="bg-surface border border-border rounded-xl p-10 text-center">
          <Bell size={28} className="mx-auto text-text-secondary opacity-50 mb-3" />
          <h3 className="text-base font-medium text-text-primary mb-1">
            {filter === 'unread' ? "You're all caught up" : 'No notifications yet'}
          </h3>
          <p className="text-sm text-text-secondary">
            {filter === 'unread'
              ? 'No unread notifications right now.'
              : 'New updates about your donations will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupLabels.map(({ key, label }) =>
            groupedNotifications[key].length > 0 ? (
              <div key={key}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">{label}</h3>
                <div className="space-y-1.5">
                  {groupedNotifications[key].map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              </div>
            ) : null
          )}

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-1">
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={loading}
                className="px-5 py-2 text-sm bg-surface border border-border hover:bg-surface-hover text-text-primary rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin inline" /> : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * NotificationRow - compact list row (not a heavy card)
 */
function NotificationRow({ notification, onClick }) {
  const { Icon, toneClass } = getNotificationMeta(notification.type);

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg border text-left transition-colors flex items-start gap-3 ${
        notification.is_read
          ? 'bg-surface border-border hover:bg-surface-hover'
          : 'bg-dash-primary-soft border-dash-primary/20 hover:border-dash-primary/40'
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toneClass}`}>
        <Icon size={16} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm ${notification.is_read ? 'text-text-primary' : 'font-medium text-text-primary'}`}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <div className="w-1.5 h-1.5 bg-dash-primary rounded-full shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-[11px] text-text-secondary mt-1">
          {formatNotificationTimestamp(notification.created_at)}
        </p>
      </div>
    </button>
  );
}
