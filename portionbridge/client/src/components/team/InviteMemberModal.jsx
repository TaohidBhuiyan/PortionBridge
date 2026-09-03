import { useState } from 'react';
import { Modal } from '../common/Modal';
import { UserPlus } from 'lucide-react';

/**
 * InviteMemberModal — PHASE 5. Team-leader-only, invites an existing
 * volunteer by email via the existing POST /teams/:id/invite endpoint
 * (teamApi.inviteMember). Client-side validation here is just a basic
 * email shape check — the backend's own validator and lookup (user must
 * exist, must be a volunteer, must not already be on a team, must not
 * already have a pending invite to this team) remain the real source of
 * truth, and their specific error messages are surfaced as-is via toast
 * rather than being re-implemented here.
 */
export function InviteMemberModal({ isOpen, onClose, onInvite, sending = false }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setEmail('');
    setError('');
    onClose();
  };

  const handleSubmit = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter an email address.');
      return;
    }
    // Basic shape check only — the backend validates and looks the user up for real.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    onInvite(trimmed);
  };

  return (
    <Modal title="Invite Team Member" onClose={handleClose}>
      <div className="space-y-4">
        <div>
          <label htmlFor="invite-email" className="block text-sm font-medium text-text-primary mb-2">
            Volunteer's email
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="volunteer@example.com"
            disabled={sending}
            className="w-full px-3 py-2.5 border border-border rounded-lg bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all disabled:opacity-50"
          />
          <p className="text-[11px] text-text-secondary mt-1.5">
            They must already have a PortionBridge volunteer account and not currently belong to a team.
          </p>
          {error && <p className="text-xs text-danger mt-1.5">{error}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleClose}
            disabled={sending}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-primary text-sm font-medium hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={sending}
            className="flex-1 px-4 py-2.5 rounded-lg bg-dash-primary text-white text-sm font-medium hover:bg-dash-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <UserPlus size={15} />
                Send Invite
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
