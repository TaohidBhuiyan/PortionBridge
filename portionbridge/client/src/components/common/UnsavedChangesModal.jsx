import React from 'react';
import { Modal } from './Modal';
import { AlertCircle } from 'lucide-react';

/**
 * Unsaved Changes Warning Modal
 * @param {boolean} isOpen - Whether modal is open
 * @param {Function} onClose - Callback when modal closes (stay on page)
 * @param {Function} onConfirm - Callback when user confirms (leave page/discard changes)
 */
export function UnsavedChangesModal({ 
  isOpen, 
  onClose, 
  onConfirm 
}) {
  if (!isOpen) return null;

  return (
    <Modal 
      title="Unsaved Changes" 
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-900 font-medium mb-1">
              You have unsaved changes
            </p>
            <p className="text-sm text-amber-700">
              If you leave this page, your changes will be lost.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Stay on Page
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
          >
            Discard Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}
