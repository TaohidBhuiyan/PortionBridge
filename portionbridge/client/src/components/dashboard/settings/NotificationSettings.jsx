import { useState, useEffect, useCallback } from 'react';
import { Bell, Mail, Smartphone, Radio, Package, MessageSquare, Save, CheckCircle2, SlidersHorizontal, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { profileApi } from '../../../services/profileApi';

const NOTIFICATION_GROUPS = [
  {
    title: 'Communication Channels',
    description: 'Choose how you would like to receive notifications from PortionBridge.',
    items: [
      { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive important updates and receipts via email', icon: Mail },
      { key: 'smsNotifications', label: 'SMS Alerts', desc: 'Receive urgent pickup alerts via SMS', icon: Smartphone },
      { key: 'pushNotifications', label: 'Browser Push Notifications', desc: 'Real-time desktop alerts when on PortionBridge', icon: Radio },
    ],
  },
  {
    title: 'Donation & Impact Activity',
    description: 'Stay updated when food donations are claimed, picked up, or completed.',
    items: [
      { key: 'donationUpdates', label: 'Donation & Mission Updates', desc: 'Alerts when volunteers claim or pick up your donation', icon: Package },
    ],
  },
  {
    title: 'Messaging & Social',
    description: 'Direct communication alerts between you and assigned volunteers or admins.',
    items: [
      { key: 'chatNotifications', label: 'Direct Messages & Chat', desc: 'Instant notifications when a volunteer messages you', icon: MessageSquare },
    ],
  },
];

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

  const loadNotificationSettings = useCallback(async () => {
    setPageLoading(true);
    try {
      const result = await profileApi.getNotificationSettings();
      if (result.success && result.data?.notificationSettings) {
        const s = result.data.notificationSettings;
        setNotificationSettings({
          emailNotifications: !!s.email_notifications,
          smsNotifications: !!s.sms_notifications,
          pushNotifications: !!s.push_notifications,
          donationUpdates: !!s.donation_updates,
          chatNotifications: !!s.chat_messages,
        });
      }
    } catch {
      // Keep defaults gracefully if API call fails
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotificationSettings();
  }, [loadNotificationSettings]);

  const handleToggle = (key) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleBatchToggle = (enableAll) => {
    setNotificationSettings({
      emailNotifications: enableAll,
      smsNotifications: enableAll,
      pushNotifications: enableAll,
      donationUpdates: enableAll,
      chatNotifications: enableAll,
    });
    toast.success(enableAll ? 'All notifications enabled' : 'All notifications muted');
  };

  const handleSaveNotifications = async () => {
    setActionLoading(true);

    try {
      const result = await profileApi.updateNotificationSettings(notificationSettings);

      if (result.success) {
        toast.success('Notification preferences updated successfully!');
      } else {
        toast.error(result.error || 'Failed to update notification settings');
      }
    } catch {
      toast.error('Failed to update notification settings. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-6 animate-pulse space-y-6">
        <div className="h-7 w-64 bg-border rounded-lg" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-5 w-40 bg-border rounded-md" />
            <div className="h-16 w-full bg-border rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-dash-primary-soft text-dash-primary rounded-xl">
            <Bell size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Notification Preferences</h2>
            <p className="text-xs text-text-secondary mt-0.5">Control how and when you receive real-time alerts</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleBatchToggle(true)}
            className="px-3 py-1.5 text-xs font-medium text-dash-primary bg-dash-primary-soft hover:bg-dash-primary/20 rounded-lg transition-colors"
          >
            Enable All
          </button>
          <button
            onClick={() => handleBatchToggle(false)}
            className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-page hover:bg-surface-hover border border-border rounded-lg transition-colors"
          >
            Mute All
          </button>
          <button
            onClick={handleSaveNotifications}
            disabled={actionLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-dash-primary hover:bg-dash-primary-hover text-white text-sm font-medium rounded-xl shadow-sm transition-all disabled:opacity-50 ml-2"
          >
            {actionLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>{actionLoading ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Notification Category Groups */}
      {NOTIFICATION_GROUPS.map((group, groupIdx) => (
        <div key={groupIdx} className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
          <div className="mb-4 pb-3 border-b border-border">
            <h3 className="text-base font-semibold text-text-primary">{group.title}</h3>
            <p className="text-xs text-text-secondary mt-0.5">{group.description}</p>
          </div>

          <div className="space-y-4">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isChecked = !!notificationSettings[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => handleToggle(item.key)}
                  className="cursor-pointer p-4 rounded-xl border border-border hover:border-dash-primary/40 bg-page/40 hover:bg-page transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${isChecked ? 'bg-dash-primary-soft text-dash-primary' : 'bg-surface text-text-muted border border-border'}`}>
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary truncate">{item.label}</p>
                        {isChecked && (
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-success-soft text-success rounded-full shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">{item.desc}</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                      isChecked ? 'bg-dash-primary' : 'bg-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-xs ${
                        isChecked ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

