import React from 'react';
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
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-900 font-medium mb-1">
              This action cannot be undone
            </p>
            <p className="text-sm text-red-700">
              Once cancelled, this donation will be removed and volunteers will no longer be able to accept it.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-600 mb-1">Donation:</p>
          <p className="font-medium text-gray-900">{donationTitle}</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Keep Donation
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
