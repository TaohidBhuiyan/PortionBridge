import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { profileApi } from '../../../services/profileApi';

/**
 * SecuritySettings — password change, logout, and basic account info.
 *
 * Extracted out of DonorSettingsPage.jsx (COMING-SOON ELIMINATION pass) so
 * it can be reused as-is by the volunteer settings route and by Admin
 * Settings (AdminSectionPage.jsx) — none of this was ever donor-specific:
 * POST /profile/change-password is an "all protected users" backend route
 * (see server/routes/v1/profile.routes.js), and logout/last-login are the
 * same for every role. Fully self-contained (own loading/error/success
 * state) so any page can drop it in without wiring anything up.
 */
export function SecuritySettings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setActionLoading(true);

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
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      {success && (
        <div className="p-4 bg-success-soft border border-success rounded-lg" role="alert" aria-live="polite">
          <p className="text-sm text-success">{success}</p>
        </div>
      )}
      {error && (
        <div className="p-4 bg-danger-soft border border-danger rounded-lg" role="alert" aria-live="assertive">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

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
            disabled={actionLoading}
            className="w-full px-6 py-2.5 bg-dash-primary hover:bg-dash-primary-hover text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2"
          >
            {actionLoading ? 'Changing...' : 'Change Password'}
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
  );
}
