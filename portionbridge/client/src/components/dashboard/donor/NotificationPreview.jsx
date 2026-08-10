import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard } from '../skeletons';
import { Bell, ArrowRight } from 'lucide-react';
import { useAuthSocket } from '../../../context/SocketContext';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * NotificationPreview widget showing latest 5 notifications with real-time updates.
 * This is a dashboard preview only — the full notification experience is Phase 6.
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
    // Listen for real-time notifications
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

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now - notificationTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notificationTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'donation_created':
      case 'donation_accepted':
      case 'volunteer_assigned':
      case 'pickup_scheduled':
      case 'pickup_completed':
        return '📦';
      case 'volunteer_on_the_way':
        return '🚗';
      case 'donation_cancelled':
        return '❌';
      case 'assignment_changed':
        return '🔄';
      case 'new_message':
        return '💬';
      case 'rating_received':
        return '⭐';
      default:
        return '🔔';
    }
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-text-primary mb-4">Notifications</h2>
        <div className="space-y-3">
          <SkeletonCard count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-1.5">
          <Bell size={16} className="text-dash-primary" />
          Notifications
          {socketUnreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold text-white bg-danger rounded-full">
              {socketUnreadCount}
            </span>
          )}
        </h2>
        <button
          onClick={() => navigate('/notifications')}
          className="text-xs text-dash-primary hover:text-dash-primary-hover font-medium flex items-center gap-1 focus:outline-none focus-visible:underline"
        >
          View All
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Connection Status */}
      {!connected && (
        <div className="flex items-center gap-1.5 text-warning text-xs mb-2.5">
          <span>⚠️ Real-time updates disconnected</span>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-6">
          <Bell size={24} className="mx-auto text-text-secondary opacity-50 mb-2" />
          <p className="text-sm text-text-secondary">You're all caught up.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-2.5 p-2.5 rounded-lg transition-colors ${
                notification.is_read ? '' : 'bg-dash-primary-soft'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                notification.is_read ? 'bg-page text-text-secondary' : 'bg-surface text-text-primary'
              }`}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm mb-0.5 truncate ${
                  notification.is_read ? 'font-normal text-text-secondary' : 'font-medium text-text-primary'
                }`}>
                  {notification.title}
                </p>
                <p className="text-xs text-text-secondary line-clamp-1">
                  {notification.message}
                </p>
              </div>
              <span className="text-[10px] text-text-secondary shrink-0">
                {formatTimestamp(notification.created_at)}
              </span>
              {!notification.is_read && (
                <div className="w-1.5 h-1.5 bg-dash-primary rounded-full shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}