import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { profileApi } from '../../../services/profileApi';

const NOTIFICATION_ITEMS = [
  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
  { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive notifications via SMS' },
  { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive push notifications (coming soon)' },
  { key: 'donationUpdates', label: 'Donation Updates', desc: 'Updates about your donations' },
  { key: 'chatNotifications', label: 'Chat Notifications', desc: 'New message notifications' },
];

/**
 * NotificationSettings — the notification-preferences toggles.
 *
 * Extracted out of DonorSettingsPage.jsx (COMING-SOON ELIMINATION pass) so
 * it can be reused as-is by the volunteer settings route and by Admin
 * Settings — GET/PATCH /profile/notifications are both "all protected
 * users" backend routes (see server/routes/v1/profile.routes.js), never
 * donor-specific. Fully self-contained: fetches its own data and owns its
 * own loading/error/success state.
 */
export function NotificationSettings() {
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    donationUpdates: true,
    chatNotifications: true,
  });
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadNotificationSettings = useCallback(async () => {
    setPageLoading(true);
    try {
      const result = await profileApi.getNotificationSettings();
      if (result.success) {
        // The API returns the raw DB row (snake_case columns); this
        // component's state/toggle keys are camelCase.
        const s = result.data.notificationSettings;
        setNotificationSettings((prev) => ({
          ...prev,
          emailNotifications: !!s.email_notifications,
          smsNotifications: !!s.sms_notifications,
          pushNotifications: !!s.push_notifications,
          donationUpdates: !!s.donation_updates,
          chatNotifications: !!s.chat_messages,
        }));
      }
    } catch {
      // Failed to load notification settings
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern used throughout this codebase
    loadNotificationSettings();
  }, [loadNotificationSettings]);

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleSaveNotifications = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await profileApi.updateNotificationSettings(notificationSettings);

      if (result.success) {
        setSuccess('Notification settings updated successfully!');
      } else {
        setError(result.error || 'Failed to update notification settings');
      }
    } catch {
      setError('Failed to update notification settings. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6 animate-pulse space-y-4">
        <div className="h-6 w-56 bg-border rounded-lg" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-full bg-border rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      {success && (
        <div className="mb-4 p-4 bg-success-soft border border-success rounded-lg" role="alert" aria-live="polite">
          <p className="text-sm text-success">{success}</p>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-danger-soft border border-danger rounded-lg" role="alert" aria-live="assertive">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}
      <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Bell size={20} className="text-dash-primary" />
        Notification Preferences
      </h2>
      <div className="space-y-4">
        {NOTIFICATION_ITEMS.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div>
              <p className="font-medium text-text-primary">{item.label}</p>
              <p className="text-sm text-text-secondary">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name={item.key}
                checked={notificationSettings[item.key]}
                onChange={handleNotificationChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-dash-primary/40 rounded-full peer dark:bg-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-border peer-checked:bg-dash-primary"></div>
            </label>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSaveNotifications}
          disabled={actionLoading}
          className="px-6 py-2 bg-dash-primary text-white rounded-lg hover:bg-dash-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {actionLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
