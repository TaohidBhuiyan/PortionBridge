import { useState } from 'react';
import { UserCog, ArrowRightLeft, AlertTriangle, Heart, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { profileApi } from '../../../services/profileApi';
import { ConfirmActionModal } from '../../common/ConfirmActionModal';

const OTHER_ROLE = { donor: 'volunteer', volunteer: 'donor' };

export function AccountTypeSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState('');

  const currentRole = user?.role;
  const targetRole = OTHER_ROLE[currentRole];

  const handleConfirmSwitch = async () => {
    if (!targetRole) return;
    setSwitching(true);
    setError('');
    try {
      await profileApi.switchRole(targetRole);
      toast.success(`Account switched to ${targetRole}. Please log in again.`);
      await logout();
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to switch account type.');
      setSwitching(false);
      setShowConfirm(false);
    }
  };

  if (!currentRole || !targetRole) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-dash-primary-soft text-dash-primary rounded-xl">
            <UserCog size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Account Role & Type</h2>
            <p className="text-xs text-text-secondary mt-0.5">Switch between Donor and Volunteer roles</p>
          </div>
        </div>
      </div>

      {/* Role Comparison Card */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
        <div className="mb-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Current Active Role</p>
              <h3 className="text-xl font-bold text-text-primary capitalize mt-1 flex items-center gap-2">
                <span>{currentRole} Account</span>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-dash-primary text-white">Active</span>
              </h3>
            </div>
            <div className="p-3 bg-dash-primary-soft text-dash-primary rounded-2xl">
              <Heart size={24} />
            </div>
          </div>
        </div>

        <p className="text-sm text-text-secondary mb-6 leading-relaxed">
          You can switch to a <span className="capitalize font-semibold text-text-primary">{targetRole}</span> account
          if your account has not recorded active donation activity, volunteer missions, or team ratings yet.
        </p>

        {/* Requirements Checklist */}
        <div className="p-4 bg-page rounded-xl border border-border space-y-2.5 mb-6 text-xs">
          <p className="font-semibold text-text-primary mb-1">Switch Eligibility Checklist:</p>
          <div className="flex items-center gap-2 text-text-secondary">
            <CheckCircle2 size={14} className="text-success shrink-0" />
            <span>No pending active food delivery missions</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <CheckCircle2 size={14} className="text-success shrink-0" />
            <span>No unrated volunteer team assignments</span>
          </div>
        </div>

        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-dash-primary hover:bg-dash-primary-hover text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer"
        >
          <ArrowRightLeft size={16} />
          <span>Switch Account to {targetRole.toUpperCase()}</span>
        </button>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 p-4 bg-danger-soft rounded-xl border border-danger/30 text-xs">
            <AlertTriangle size={16} className="text-danger shrink-0 mt-0.5" />
            <p className="text-danger font-medium">{error}</p>
          </div>
        )}
      </div>

      <ConfirmActionModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSwitch}
        title={`Switch to ${targetRole.toUpperCase()} Account?`}
        message={`You'll be switched to a ${targetRole} account and logged out. You'll need to log back in to access the new dashboard.`}
        confirmLabel={switching ? 'Switching Account...' : 'Confirm Role Switch'}
        isLoading={switching}
        tone="primary"
      />
    </div>
  );
}

