import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Lock, Bell, Moon, Sun, LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard';
import { useAuth } from '../context/AuthContext';
import { profileApi } from '../services/profileApi';

/**
 * Donor Account Settings Page
 * Manage password, notifications, appearance, and security
 */
export function DonorSettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('security');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    donationUpdates: true,
    pickupUpdates: true,
    chatNotifications: true,
  });

  const loadNotificationSettings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await profileApi.getNotificationSettings();
      if (result.success) {
        setNotificationSettings(result.data.notificationSettings);
      }
    } catch {
      // Failed to load notification settings
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern used throughout this codebase
    loadNotificationSettings();
  }, [loadNotificationSettings]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await profileApi.changePassword(passwordData);
      
      if (result.success) {
        setSuccess('Password changed successfully. Please log in again.');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2000);
      } else {
        setError(result.error || 'Failed to change password');
      }
    } catch {
      setError('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (e) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Moon },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-10 bg-border rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 w-48 bg-border rounded-lg animate-pulse" />
              <div className="h-4 w-64 bg-border rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Tabs Skeleton */}
          <div className="flex gap-6">
            <div className="w-48 flex-shrink-0 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 w-full bg-border rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="flex-1 space-y-6">
              <div className="bg-surface rounded-2xl border border-border p-6 animate-pulse space-y-4">
                <div className="h-6 w-48 bg-border rounded-lg animate-pulse" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-32 bg-border rounded-lg animate-pulse" />
                    <div className="h-12 w-full bg-border rounded-lg animate-pulse" />
                  </div>
                ))}
                <div className="h-12 w-full bg-border rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Account Settings
            </h1>
            <p className="text-sm text-text-secondary">
              Manage your account preferences
            </p>
          </div>
        </div>

        {/* Success/Error Messages */}
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

        <div className="flex gap-6">
          {/* Sidebar Tabs */}
          <div className="w-48 flex-shrink-0">
            <div className="bg-surface rounded-2xl border border-border p-2 shadow-sm">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-dash-primary-soft text-dash-primary shadow-sm'
                        : 'text-text-secondary hover:bg-surface-hover'
                    } focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2`}
                    aria-label={`Switch to ${tab.label} settings`}
                    aria-selected={activeTab === tab.id}
                    role="tab"
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Change Password */}
                <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Lock size={20} className="text-dash-primary" />
                    Change Password
                  </h2>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-border rounded-xl bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
                        placeholder="Enter current password"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-border rounded-xl bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-border rounded-xl bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-6 py-2.5 bg-dash-primary hover:bg-dash-primary-hover text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2"
                    >
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                  </form>
                </div>

                {/* Account Actions */}
                <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Shield size={20} className="text-dash-primary" />
                    Account Actions
                  </h2>
                  <div className="space-y-3">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-danger-soft text-danger rounded-xl hover:bg-danger-soft/70 transition-all border border-danger font-medium focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
                    >
                      <LogOut size={18} />
                      <span>Logout from Current Device</span>
                    </button>
                    <p className="text-xs text-text-secondary">
                      You will need to log in again to access your account.
                    </p>
                  </div>
                </div>

                {/* Account Info */}
                <div className="bg-page rounded-xl border border-border p-6">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">
                    Security Information
                  </h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Last Login</span>
                      <span className="text-text-primary font-medium">
                        {user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Login Provider</span>
                      <span className="text-text-primary font-medium capitalize">
                        {user?.provider || 'Email'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-surface rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Bell size={20} className="text-dash-primary" />
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                    { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive notifications via SMS' },
                    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive push notifications (coming soon)' },
                    { key: 'donationUpdates', label: 'Donation Updates', desc: 'Updates about your donations' },
                    { key: 'pickupUpdates', label: 'Pickup Updates', desc: 'Updates about pickup status' },
                    { key: 'chatNotifications', label: 'Chat Notifications', desc: 'New message notifications' },
                  ].map((item) => (
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
                    disabled={loading}
                    className="px-6 py-2 bg-dash-primary text-white rounded-lg hover:bg-dash-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="bg-surface rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Moon size={20} className="text-dash-primary" />
                  Appearance
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Sun size={20} className="text-text-secondary" />
                      <div>
                        <p className="font-medium text-text-primary">Theme</p>
                        <p className="text-sm text-text-secondary">Choose your preferred theme</p>
                      </div>
                    </div>
                    <select
                      className="px-4 py-2 border border-border rounded-lg bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary"
                      defaultValue="system"
                    >
                      <option value="system">System Default</option>
                      <option value="light">Light Mode</option>
                      <option value="dark">Dark Mode</option>
                    </select>
                  </div>
                  <p className="text-xs text-text-secondary mt-2">
                    Theme preferences will be saved to your browser.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
