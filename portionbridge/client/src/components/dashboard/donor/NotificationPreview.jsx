import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard } from '../skeletons';
import { Bell, ArrowRight, CheckCheck } from 'lucide-react';
import { useAuthSocket } from '../../../context/SocketContext';
import { getNotificationMeta, formatNotificationTimestamp } from '../../../utils/notificationMeta';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * NotificationPreview — Live Notification Feed
 * Real-time notification drawer preview with socket connectivity indicator and unread counters.
 */
export function NotificationPreview() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, connected, unreadCount: socketUnreadCount } = useAuthSocket();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE}/notifications?limit=5`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data?.success) {
          setNotifications(response.data.data.notifications || []);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="bg-surface rounded-3xl border border-border/50 p-5 shadow-pb-card h-full flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-28 bg-border/40 rounded-md animate-pulse" />
          <div className="h-4 w-12 bg-border/30 rounded-md animate-pulse" />
        </div>
        <div className="space-y-2">
          <SkeletonCard count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-3xl border border-border/50 p-5 sm:p-6 shadow-pb-card h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-xl bg-dash-primary-soft flex items-center justify-center text-dash-primary">
              <Bell size={16} />
              {socketUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-surface animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary">Notifications</h3>
                {socketUnreadCount > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                    {socketUnreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                <span>{connected ? 'Live Sync Active' : 'Connecting...'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/notifications')}
            className="text-xs font-semibold text-dash-primary hover:text-dash-primary-hover inline-flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="text-center py-7 text-text-secondary">
            <div className="w-10 h-10 rounded-2xl bg-dash-primary-soft text-dash-primary mx-auto flex items-center justify-center mb-2">
              <CheckCheck size={20} />
            </div>
            <p className="text-xs font-semibold text-text-primary">All caught up!</p>
            <p className="text-[11px] text-text-muted mt-0.5">No unread notifications at this time.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 4).map((notification) => {
              const { Icon, toneClass } = getNotificationMeta(notification.type);
              const isUnread = !notification.is_read;

              return (
                <div
                  key={notification.id}
                  onClick={() => navigate('/notifications')}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                    isUnread
                      ? 'bg-surface hover:bg-surface-hover border-dash-primary/30 shadow-2xs border-l-3 border-l-dash-primary'
                      : 'bg-surface/70 hover:bg-surface border-border/50 hover:border-border'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${toneClass}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs line-clamp-1 ${isUnread ? 'font-bold text-text-primary' : 'font-medium text-text-primary/90'}`}>
                        {notification.title || 'Notification'}
                      </p>
                      {isUnread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-dash-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                      {notification.message}
                    </p>
                    <span className="text-[10px] text-text-muted mt-1 block">
                      {formatNotificationTimestamp(notification.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-border/40 text-center">
        <button
          onClick={() => navigate('/notifications')}
          className="text-xs font-medium text-text-secondary hover:text-dash-primary transition-colors"
        >
          Notification Center & Preferences
        </button>
      </div>
    </div>
  );
}