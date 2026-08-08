import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

/**
 * Cancel Confirmation Modal for donations
 * Redesigned for compact, professional appearance
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
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-danger-50 dark:bg-danger-950/20 rounded-lg border border-danger-200 dark:border-danger-800">
          <AlertTriangle className="w-4 h-4 text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-danger-900 dark:text-danger-100 font-medium mb-1">
              This action cannot be undone
            </p>
            <p className="text-xs text-danger-700 dark:text-danger-300">
              Once cancelled, this donation will be removed and volunteers will no longer be able to accept it.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Donation:</p>
          <p className="font-medium text-sm text-slate-900 dark:text-slate-50">{donationTitle}</p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Keep Donation
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-3 py-2 rounded-lg bg-danger-600 hover:bg-danger-700 dark:bg-danger-500 dark:hover:bg-danger-400 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {isLoading ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
