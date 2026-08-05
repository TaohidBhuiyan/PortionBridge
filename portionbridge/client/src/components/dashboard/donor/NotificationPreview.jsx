import { useState, useEffect } from 'react';
import { SkeletonCard } from '../skeletons';
import { Bell, Check, ArrowRight } from 'lucide-react';
import { useAuthSocket } from '../../../context/SocketContext';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * NotificationPreview widget showing latest 5 notifications with real-time updates
 */
export function NotificationPreview() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, connected, unreadCount: socketUnreadCount } = useAuthSocket();

  useEffect(() => {
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

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now - notificationTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
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
      <div className="bg-white dark:bg-[#120721] rounded-xl border border-gray-200 dark:border-purple-950/30 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Notifications</h2>
        <SkeletonCard count={3} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#120721] rounded-xl border border-gray-200 dark:border-purple-950/30 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Bell size={20} className="text-purple-600 dark:text-purple-400" />
          Notifications
          {socketUnreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
              {socketUnreadCount}
            </span>
          )}
        </h2>
        <button 
          onClick={() => window.location.href = '/notifications'}
          className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1"
        >
          View All
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Connection Status */}
      {!connected && (
        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-xs mb-3">
          <span>⚠️ Real-time updates disconnected</span>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <Bell size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                notification.is_read
                  ? 'bg-gray-50 dark:bg-purple-950/10 border-gray-200 dark:border-purple-950/30'
                  : 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-950/50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                notification.is_read
                  ? 'bg-gray-200 dark:bg-purple-950/30 text-gray-400'
                  : 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400'
              }`}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm mb-1 ${
                  notification.is_read
                    ? 'text-gray-600 dark:text-gray-400'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {notification.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {formatTimestamp(notification.created_at)}
                </p>
              </div>
              {!notification.is_read && (
                <div className="w-2 h-2 bg-purple-500 rounded-full shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
