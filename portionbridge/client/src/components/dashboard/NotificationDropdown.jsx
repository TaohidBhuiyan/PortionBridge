import { useState, useEffect } from 'react';
import { Bell, Check, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthSocket } from '../../context/SocketContext';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * NotificationDropdown component with unread count, recent notifications, and view all option
 */
export function NotificationDropdown({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { socket, connected, unreadCount: socketUnreadCount } = useAuthSocket();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

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
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE}/notifications?limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        setNotifications(response.data.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(`${API_BASE}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to mark as read:', err);
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

    // Navigate based on related_id
    if (notification.related_id) {
      navigate(`/donations/${notification.related_id}`);
    }
    onClose();
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now - notificationTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
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

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 z-50 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-primary-600 dark:text-primary-400" />
          <h3 className="font-medium text-slate-900 dark:text-slate-50 text-sm">Notifications</h3>
          {socketUnreadCount > 0 && (
            <span className="bg-danger-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
              {socketUnreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Connection Status */}
      {!connected && (
        <div className="px-4 py-2 bg-warning-50 dark:bg-warning-950/20 border-b border-warning-200 dark:border-warning-800">
          <p className="text-xs text-warning-600 dark:text-warning-400">Real-time updates disconnected</p>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-8 text-center">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400 dark:text-slate-500 mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-b-0 ${
                !notification.is_read ? 'bg-primary-50/50 dark:bg-primary-950/10' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                  !notification.is_read
                    ? 'bg-primary-100 dark:bg-primary-900/50'
                    : 'bg-slate-100 dark:bg-slate-800'
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-xs text-slate-900 dark:text-slate-50 line-clamp-1">
                      {notification.title}
                    </p>
                    {!notification.is_read && (
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    {formatTimestamp(notification.created_at)}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer - View All */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleViewAll}
            className="w-full py-2 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-lg transition-colors"
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
}
