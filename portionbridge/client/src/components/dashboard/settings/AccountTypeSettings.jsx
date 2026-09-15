import { useState } from 'react';
import { UserCog, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { profileApi } from '../../../services/profileApi';
import { ConfirmActionModal } from '../../common/ConfirmActionModal';

const OTHER_ROLE = { donor: 'volunteer', volunteer: 'donor' };

/**
 * AccountTypeSettings — self-service donor <-> volunteer role switch
 * (Taohid's "Option A": safe-only switch, no admin involvement).
 *
 * Backend (PATCH /profile/switch-role) only allows this on an account
 * with zero donation/team/rating history — enforced server-side via
 * userModel.hasActivityAsRole, not just hidden in this UI, so the
 * button below can safely just try the switch and surface whatever the
 * backend says rather than pre-computing eligibility itself.
 *
 * A successful switch invalidates the current JWT's role claim, so this
 * logs the user out and sends them to the login page — matches the
 * backend's own response message ("...Please log in again.").
 */
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
      toast.success(`Switched to ${targetRole}. Please log in again.`);
      await logout();
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to switch account type.');
      setSwitching(false);
      setShowConfirm(false);
    }
  };

  if (!currentRole || !targetRole) {
    // Admin accounts (or anything else without a donor/volunteer role)
    // don't get this tab's content — App.jsx only mounts Settings for
    // donor/volunteer routes anyway, so this is a defensive fallback.
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <UserCog className="w-6 h-6 text-dash-primary" />
        <h2 className="text-xl font-semibold text-text-primary">Account Type</h2>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <p className="text-sm text-text-secondary mb-1">Current account type</p>
        <p className="text-lg font-medium text-text-primary capitalize mb-4">{currentRole}</p>

        <p className="text-sm text-text-secondary mb-4">
          You can switch to a <span className="capitalize font-medium text-text-primary">{targetRole}</span> account
          if this account hasn't donated, volunteered, joined a team, or been rated yet. This is a one-way
          action for now — switching back later follows the same rule.
        </p>

        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
        >
          <ArrowRightLeft size={16} />
          Switch to {targetRole}
        </button>

        {error && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-danger-soft rounded-lg border border-danger/30">
            <AlertTriangle size={16} className="text-danger shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}
      </div>

      <ConfirmActionModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSwitch}
        title={`Switch to ${targetRole}?`}
        message={`You'll be switched to a ${targetRole} account and logged out. You'll need to log back in afterward.`}
        confirmLabel={switching ? 'Switching…' : 'Switch'}
        isLoading={switching}
        tone="primary"
      />
    </div>
  );
}
