import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Filter, X, Loader2, AlertCircle } from 'lucide-react';
import { useAuthSocket } from '../context/SocketContext';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * NotificationsPage - Full notification center with filters and real-time updates
 */
export function NotificationsPage() {
  const navigate = useNavigate();
  const { socket, connected, unreadCount } = useAuthSocket();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, donation, volunteer, system
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [filter, page]);

  useEffect(() => {
    // Listen for real-time notifications
    if (socket) {
      const handleNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
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
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page,
        limit: 20,
      });

      if (filter === 'unread') params.append('status', 'unread');
      if (filter === 'donation') params.append('type', 'donation_accepted');
      if (filter === 'volunteer') params.append('type', 'volunteer_assigned');
      if (filter === 'system') params.append('type', 'status_updated');

      const response = await axios.get(`${API_BASE}/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        const newNotifications = response.data.data.notifications || [];
        if (page === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }
        setHasMore(newNotifications.length === 20);
      } else {
        setError(response.data?.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch notifications');
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

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(`${API_BASE}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type and related_id
    if (notification.related_id) {
      navigate(`/donations/${notification.related_id}`);
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
    return notificationTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
      case 'team_invitation_received':
      case 'team_invitation_accepted':
      case 'team_member_joined':
      case 'team_member_left':
        return '👥';
      default:
        return '🔔';
    }
  };

  const groupNotificationsByDate = (notifications) => {
    const groups = {
      today: [],
      yesterday: [],
      earlier: [],
    };

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.created_at);
      const isToday = notificationDate.toDateString() === now.toDateString();
      const isYesterday = notificationDate.toDateString() === yesterday.toDateString();

      if (isToday) {
        groups.today.push(notification);
      } else if (isYesterday) {
        groups.yesterday.push(notification);
      } else {
        groups.earlier.push(notification);
      }
    });

    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(notifications);

  if (loading && page === 1) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <CheckCheck size={16} />
              Mark All as Read
            </button>
          )}
        </div>

        {/* Connection Status */}
        {!connected && (
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm mb-4">
            <AlertCircle size={16} />
            <span>Real-time updates disconnected</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500 dark:text-gray-400" />
          <div className="flex gap-2">
            {['all', 'unread', 'donation', 'volunteer', 'system'].map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertCircle size={20} />
            <p>{error}</p>
            <button
              onClick={fetchNotifications}
              className="ml-auto text-sm underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      {notifications.length === 0 && !loading ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <Bell size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No notifications
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'unread' ? 'No unread notifications' : 'You have no notifications yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today */}
          {groupedNotifications.today.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Today</h3>
              <div className="space-y-2">
                {groupedNotifications.today.map(notification => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    getIcon={getNotificationIcon}
                    formatTime={formatTimestamp}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Yesterday */}
          {groupedNotifications.yesterday.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Yesterday</h3>
              <div className="space-y-2">
                {groupedNotifications.yesterday.map(notification => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    getIcon={getNotificationIcon}
                    formatTime={formatTimestamp}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Earlier */}
          {groupedNotifications.earlier.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Earlier</h3>
              <div className="space-y-2">
                {groupedNotifications.earlier.map(notification => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    getIcon={getNotificationIcon}
                    formatTime={formatTimestamp}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={loading}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
              >
                {loading ? <Loader2 size={16} className="animate-spin inline" /> : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * NotificationCard - Individual notification item
 */
function NotificationCard({ notification, onClick, getIcon, formatTime }) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
        notification.is_read
          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 ${
          notification.is_read
            ? 'bg-gray-100 dark:bg-gray-700'
            : 'bg-purple-100 dark:bg-purple-900/50'
        }`}>
          {getIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`font-medium ${
              notification.is_read
                ? 'text-gray-700 dark:text-gray-300'
                : 'text-gray-900 dark:text-white'
            }`}>
              {notification.title}
            </h4>
            {!notification.is_read && (
              <div className="w-2 h-2 bg-purple-500 rounded-full shrink-0 mt-2" />
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {formatTime(notification.created_at)}
          </p>
        </div>

        {/* Action */}
        {!notification.is_read && (
          <div className="shrink-0">
            <Check size={16} className="text-purple-600 dark:text-purple-400" />
          </div>
        )}
      </div>
    </button>
  );
}
