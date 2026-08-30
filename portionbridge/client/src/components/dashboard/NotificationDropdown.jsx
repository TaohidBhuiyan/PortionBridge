import { useState, useEffect } from 'react';
import { Bell, X, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthSocket } from '../../context/SocketContext';
import { getNotificationMeta, getNotificationRoute, formatNotificationTimestamp } from '../../utils/notificationMeta';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * NotificationDropdown — compact preview of the 5 most recent notifications,
 * with real-time updates via the shared AuthSocketProvider.
 */
export function NotificationDropdown({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { socket, connected, unreadCount } = useAuthSocket();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE}/notifications?limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        setNotifications(response.data.data.notifications || []);
      } else {
        setError('Failed to load notifications');
      }
    } catch {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    // Listen for real-time notifications — same events the navbar badge and
    // the full notifications page listen for, so all three stay in sync.
    if (socket) {
      const handleNotification = (notification) => {
        setNotifications(prev => [notification, ...prev].slice(0, 5));
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
  }, [socket]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('accessToken');
      // The server also emits 'notification_read' back over the socket,
      // which the listener above uses to update local state — no need to
      // optimistically update here too.
      await axios.patch(`${API_BASE}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {
      // Non-critical — the notification just stays marked unread until the
      // next successful attempt or a real-time update arrives.
    }
  };

  const handleViewAll = () => {
    navigate('/notifications');
    onClose();
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    const route = getNotificationRoute(notification);
    if (route) {
      navigate(route);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-96 glass-overlay rounded-xl shadow-lg z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-danger text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close notifications"
          className="p-1 rounded hover:bg-surface-hover text-text-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary"
        >
          <X size={15} />
        </button>
      </div>

      {/* Connection Status */}
      {!connected && (
        <div className="px-4 py-2 bg-warning-soft border-b border-warning/20">
          <p className="text-xs text-warning">Real-time updates disconnected</p>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-8 text-center">
            <Loader2 className="w-5 h-5 animate-spin text-text-secondary mx-auto" />
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center">
            <AlertCircle size={22} className="mx-auto text-danger mb-2" />
            <p className="text-sm text-text-secondary mb-2">{error}</p>
            <button
              onClick={fetchNotifications}
              className="text-xs font-medium text-dash-primary hover:text-dash-primary-hover focus:outline-none focus-visible:underline"
            >
              Try Again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell size={22} className="mx-auto text-text-secondary opacity-50 mb-2" />
            <p className="text-sm text-text-secondary">You're all caught up</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const { Icon, toneClass } = getNotificationMeta(notification.type);
            return (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full px-4 py-2.5 text-left hover:bg-surface-hover transition-colors border-b border-border last:border-b-0 ${
                  !notification.is_read ? 'bg-dash-primary-soft' : ''
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${toneClass}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm line-clamp-1 ${!notification.is_read ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>
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
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer - View All */}
      {notifications.length > 0 && (
        <div className="px-3 py-2 border-t border-border">
          <button
            onClick={handleViewAll}
            className="w-full py-2 text-sm font-medium text-dash-primary hover:bg-dash-primary-soft rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary"
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
}
