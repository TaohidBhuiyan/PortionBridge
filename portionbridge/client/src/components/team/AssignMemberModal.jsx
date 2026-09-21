import { useState } from 'react';
import { Modal } from '../common/Modal';
import { UserCircle2 } from 'lucide-react';

/**
 * AssignMemberModal — PHASE 4. Team-leader-only, assigns the actual pickup
 * member for a team-accepted donation via POST /donations/:id/assign-member
 * (donationApi.assignTeamMember). The member list comes from the team's own
 * roster (teamApi.getMyTeam()'s `members`, passed in as-is by the caller) —
 * this modal doesn't fetch or fabricate anything itself. The backend
 * remains the source of truth on eligibility (must be a current member,
 * donation must still be in an assignable status); this is just the
 * picker UI that was missing.
 */
export function AssignMemberModal({ isOpen, onClose, onAssign, members = [], currentAssignedId = null, assigning = false }) {
  const [selectedId, setSelectedId] = useState(currentAssignedId ? String(currentAssignedId) : '');

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedId) return;
    onAssign(Number(selectedId));
  };

  return (
    <Modal title="Assign Pickup Member" onClose={handleClose}>
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Choose which team member will actually handle this pickup.
        </p>

        {members.length === 0 ? (
          <p className="text-sm text-text-secondary italic">No team members to assign yet.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {members.map((member) => (
              <label
                key={member.user_id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  selectedId === String(member.user_id)
                    ? 'border-dash-primary bg-dash-primary-soft'
                    : 'border-border hover:bg-surface-hover'
                }`}
              >
                <input
                  type="radio"
                  name="assign-member"
                  value={member.user_id}
                  checked={selectedId === String(member.user_id)}
                  onChange={(e) => setSelectedId(e.target.value)}
                  disabled={assigning}
                  className="accent-dash-primary"
                />
                <UserCircle2 size={18} className="text-text-secondary shrink-0" />
                <span className="text-sm text-text-primary font-medium truncate">{member.name}</span>
                {member.role === 'leader' && (
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-dash-primary shrink-0">Leader</span>
                )}
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleClose}
            disabled={assigning}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-primary text-sm font-medium hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={assigning || !selectedId}
            className="flex-1 px-4 py-2.5 rounded-lg bg-dash-primary text-white text-sm font-medium hover:bg-dash-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {assigning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserCircle2 size={15} />
                Assign
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
