import { useState } from 'react';
import { Modal } from '../common/Modal';
import { UserCheck } from 'lucide-react';

/**
 * AssignMemberModal — PHASE 4. Team-leader-only, assigns a team member
 * to a team-assigned donation via the existing POST /donations/:id/assign-member
 * endpoint (donationApi.assignTeamMember). Displays members as radio options
 * and calls onAssign(memberId) on submit.
 */
export function AssignMemberModal({ isOpen, onClose, onAssign, members, currentAssignedId, assigning = false }) {
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedMemberId(null);
    onClose();
  };

  const handleSubmit = () => {
    if (selectedMemberId === null) {
      return;
    }
    onAssign(selectedMemberId);
  };

  return (
    <Modal title="Assign Team Member" onClose={handleClose}>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-text-secondary mb-3">
            Select a team member to assign to this donation pickup:
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {members && members.length > 0 ? (
              members.map((member) => (
                <label
                  key={member.user_id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedMemberId === member.user_id
                      ? 'bg-dash-primary/10 border-dash-primary'
                      : 'bg-page border-border hover:border-dash-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="assign-member"
                    value={member.user_id}
                    checked={selectedMemberId === member.user_id}
                    onChange={() => setSelectedMemberId(member.user_id)}
                    disabled={assigning}
                    className="w-4 h-4 text-dash-primary focus:ring-dash-primary focus:ring-offset-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {member.name}
                      </span>
                      {member.role === 'leader' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
                          Leader
                        </span>
                      )}
                    </div>
                    {currentAssignedId === member.user_id && (
                      <span className="text-xs text-text-secondary">
                        Currently assigned
                      </span>
                    )}
                  </div>
                </label>
              ))
            ) : (
              <p className="text-sm text-text-secondary text-center py-4">
                No team members available.
              </p>
            )}
          </div>
        </div>

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
            disabled={assigning || selectedMemberId === null}
            className="flex-1 px-4 py-2.5 rounded-lg bg-dash-primary text-white text-sm font-medium hover:bg-dash-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {assigning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserCheck size={15} />
                Assign Member
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
