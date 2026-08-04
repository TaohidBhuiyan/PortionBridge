import { Bell, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PRIMARY = 'var(--color-primary, oklch(60.6% 0.25 292.717))';

/**
 * NotificationDropdown component with unread count, recent notifications, and view all option
 */
export function NotificationDropdown({ notifications, unreadCount, onClose }) {
  const navigate = useNavigate();

  const handleViewAll = () => {
    navigate('/notifications');
    onClose();
  };

  const handleNotificationClick = (notification) => {
    // Navigate to notification details or mark as read
    console.log('Notification clicked:', notification);
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#120721] rounded-lg shadow-lg border border-gray-200 dark:border-purple-950/30 z-50 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-purple-950/30">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-purple-950/20 text-gray-400 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-purple-950/10 transition-colors border-b border-gray-100 dark:border-purple-950/20 last:border-b-0 ${
                notification.unread ? 'bg-purple-50/50 dark:bg-purple-950/10' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${
                  notification.unread ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {notification.time}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer - View All */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-purple-950/30">
          <button
            onClick={handleViewAll}
            className="w-full py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-lg transition-colors"
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
}
