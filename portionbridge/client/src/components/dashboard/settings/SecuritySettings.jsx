import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Shield, LogOut, Eye, EyeOff, Check, X, KeyRound, Clock, Laptop } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { profileApi } from '../../../services/profileApi';

export function SecuritySettings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Compute password strength meter
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-border', text: '' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-danger', text: 'text-danger' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-warning', text: 'text-warning' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-info', text: 'text-info' };
      case 4:
        return { score: 100, label: 'Strong', color: 'bg-success', text: 'text-success' };
      default:
        return { score: 15, label: 'Very Weak', color: 'bg-danger', text: 'text-danger' };
    }
  };

  const strength = getPasswordStrength(passwordData.newPassword);
  const hasMinLength = passwordData.newPassword.length >= 8;
  const hasNumberOrSymbol = /[0-9]|[^A-Za-z0-9]/.test(passwordData.newPassword);
  const passwordsMatch = passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword;

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      toast.error('New passwords do not match');
      return;
    }

    if (!hasMinLength) {
      setError('Password must be at least 8 characters long');
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setActionLoading(true);

    try {
      const result = await profileApi.changePassword(passwordData);

      if (result.success) {
        setSuccess('Password changed successfully. Redirecting to login...');
        toast.success('Password updated successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 1800);
      } else {
        const msg = result.error || 'Failed to change password';
        setError(msg);
        toast.error(msg);
      }
    } catch {
      const msg = 'Failed to change password. Please check your current password.';
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    toast.success('Logged out successfully');
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {success && (
        <div className="p-4 bg-success-soft border border-success/30 rounded-2xl flex items-center gap-3 animate-fade-in" role="alert">
          <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center shrink-0">
            <Check size={18} strokeWidth={2.5} />
          </div>
          <p className="text-sm font-medium text-success">{success}</p>
        </div>
      )}
      {error && (
        <div className="p-4 bg-danger-soft border border-danger/30 rounded-2xl flex items-center gap-3 animate-fade-in" role="alert">
          <div className="w-8 h-8 rounded-full bg-danger text-white flex items-center justify-center shrink-0">
            <X size={18} strokeWidth={2.5} />
          </div>
          <p className="text-sm font-medium text-danger">{error}</p>
        </div>
      )}

      {/* Change Password Card */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-dash-primary-soft text-dash-primary rounded-xl">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Change Password</h2>
              <p className="text-xs text-text-secondary">Update your password regularly to keep your account safe</p>
            </div>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-5">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-4 py-3 border border-border rounded-xl bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all pr-12 text-sm"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 transition-colors"
                tabIndex={-1}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-4 py-3 border border-border rounded-xl bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all pr-12 text-sm"
                placeholder="Create new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 transition-colors"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {passwordData.newPassword && (
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">Password Strength:</span>
                  <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                </div>
                <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300 ease-out`}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-4 py-3 border border-border rounded-xl bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all pr-12 text-sm"
                placeholder="Re-enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Live Checklist */}
          {passwordData.newPassword && (
            <div className="p-3.5 bg-page rounded-xl border border-border space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center ${hasMinLength ? 'bg-success text-white' : 'bg-border text-text-muted'}`}>
                  <Check size={10} strokeWidth={3} />
                </span>
                <span className={hasMinLength ? 'text-text-primary font-medium' : 'text-text-secondary'}>At least 8 characters long</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center ${hasNumberOrSymbol ? 'bg-success text-white' : 'bg-border text-text-muted'}`}>
                  <Check size={10} strokeWidth={3} />
                </span>
                <span className={hasNumberOrSymbol ? 'text-text-primary font-medium' : 'text-text-secondary'}>Contains numbers or special characters</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordsMatch ? 'bg-success text-white' : 'bg-border text-text-muted'}`}>
                  <Check size={10} strokeWidth={3} />
                </span>
                <span className={passwordsMatch ? 'text-text-primary font-medium' : 'text-text-secondary'}>Passwords match</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={actionLoading}
            className="w-full py-3 bg-dash-primary hover:bg-dash-primary-hover text-white font-medium rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {actionLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <Lock size={16} />
                <span>Update Password</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Security Overview & Active Session */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
          <div className="p-2.5 bg-dash-primary-soft text-dash-primary rounded-xl">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Active Device & Security Info</h2>
            <p className="text-xs text-text-secondary">Session and authentication metrics for your account</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-page rounded-xl border border-border flex items-start gap-3">
            <div className="p-2 bg-surface text-dash-primary rounded-lg shrink-0 border border-border">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Last Login Activity</p>
              <p className="text-sm font-semibold text-text-primary mt-0.5">
                {user?.last_login_at ? new Date(user.last_login_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Active Session'}
              </p>
            </div>
          </div>

          <div className="p-4 bg-page rounded-xl border border-border flex items-start gap-3">
            <div className="p-2 bg-surface text-dash-primary rounded-lg shrink-0 border border-border">
              <Laptop size={18} />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Authentication Provider</p>
              <p className="text-sm font-semibold text-text-primary mt-0.5 capitalize flex items-center gap-2">
                <span>{user?.provider || 'Email & Password'}</span>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-success-soft text-success font-medium">Verified</span>
              </p>
            </div>
          </div>
        </div>

        {/* Logout Action */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-danger-soft hover:bg-danger/10 text-danger rounded-xl transition-all border border-danger/20 font-semibold text-sm"
          >
            <LogOut size={18} />
            <span>Log Out from Current Device</span>
          </button>
        </div>
      </div>
    </div>
  );
}

