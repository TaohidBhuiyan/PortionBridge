import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

/**
 * ConfirmActionModal — PHASE 5.
 *
 * Generic confirm/cancel modal built on the shared Modal shell, used for
 * Remove Member / Transfer Leadership / Leave Team. Modeled on
 * CancelConfirmationModal.jsx's structure (isOpen/onClose/onConfirm/
 * isLoading props, same button layout) but generalized with title/message/
 * confirmLabel props instead of being donation-specific, so this one
 * component covers all of Phase 5's destructive team actions rather than
 * three near-identical modals.
 */
export function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  isLoading = false,
  tone = 'danger', // 'danger' | 'primary' — transfer leadership isn't destructive like remove/leave, so it uses the primary color instead of red
}) {
  if (!isOpen) return null;

  const confirmClasses = tone === 'danger'
    ? 'bg-danger text-white hover:opacity-90'
    : 'gradient-accent text-white hover:opacity-90';

  return (
    <Modal title={title} onClose={onClose} isOpen={isOpen}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tone === 'danger' ? 'bg-danger-soft text-danger' : 'gradient-accent-subtle text-dash-primary'}`}>
            <AlertTriangle size={16} />
          </div>
          <p className="text-sm text-text-secondary pt-1.5">{message}</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-primary text-sm font-medium hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${confirmClasses}`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Please wait...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
