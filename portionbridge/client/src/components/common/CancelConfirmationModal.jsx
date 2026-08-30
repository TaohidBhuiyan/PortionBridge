
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

/**
 * Cancel Confirmation Modal for donations
 * @param {boolean} isOpen - Whether modal is open
 * @param {Function} onClose - Callback when modal closes
 * @param {Function} onConfirm - Callback when cancel is confirmed
 * @param {string} donationTitle - Title of donation being cancelled
 * @param {boolean} isLoading - Whether cancellation is in progress
 */
export function CancelConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  donationTitle,
  isLoading = false 
}) {
  if (!isOpen) return null;

  return (
    <Modal 
      title="Cancel Donation" 
      onClose={onClose}
      isOpen={isOpen}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-danger-soft rounded-lg border border-danger/20">
          <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-danger font-medium mb-1">
              This action cannot be undone
            </p>
            <p className="text-sm text-danger/90">
              Once cancelled, this donation will be removed and volunteers will no longer be able to accept it.
            </p>
          </div>
        </div>

        <div className="bg-page rounded-lg p-4 border border-border">
          <p className="text-xs text-text-secondary mb-1">Donation:</p>
          <p className="text-sm font-medium text-text-primary">{donationTitle}</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-primary text-sm font-medium hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Keep Donation
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-danger text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel Donation'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
