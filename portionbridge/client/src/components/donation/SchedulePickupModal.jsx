import { useState } from 'react';
import { Modal } from '../common/Modal';
import { CalendarClock } from 'lucide-react';

/**
 * SchedulePickupModal — collects a future pickup date/time for
 * PATCH /donations/:id/schedule (body: { scheduledAt }).
 *
 * Mirrors CancelConfirmationModal.jsx's structure/props (isOpen, onClose,
 * onConfirm, isLoading) and reuses the shared Modal shell, rather than
 * introducing a separate modal system.
 */
export function SchedulePickupModal({ isOpen, onClose, onConfirm, donationTitle, isLoading = false }) {
  const [dateTime, setDateTime] = useState('');
  const [validationError, setValidationError] = useState('');
  // Minimum selectable value = now, formatted for a datetime-local input.
  // Computed once via a lazy useState initializer (rather than inline
  // during render) since Date.now() is an impure call — this keeps it out
  // of the render body itself while still only running once per mount.
  const [minDateTime] = useState(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  );

  if (!isOpen) return null;

  // Client-side mirror of the backend's own future-date check
  // (schedulePickupValidationRules / assertAcceptedStatus in
  // donation.service.js#schedulePickup) — this doesn't replace that
  // server-side check, it just avoids a pointless round trip for an
  // obviously invalid time.
  const handleConfirm = () => {
    if (!dateTime) {
      setValidationError('Please choose a pickup date and time.');
      return;
    }
    const selected = new Date(dateTime);
    if (isNaN(selected.getTime()) || selected.getTime() <= Date.now()) {
      setValidationError('Pickup time must be in the future.');
      return;
    }
    setValidationError('');
    onConfirm(selected.toISOString());
  };

  return (
    <Modal title="Schedule Pickup" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-page rounded-lg p-4 border border-border">
          <p className="text-xs text-text-secondary mb-1">Donation:</p>
          <p className="text-sm font-medium text-text-primary">{donationTitle}</p>
        </div>

        <div>
          <label htmlFor="scheduledAt" className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
            <CalendarClock size={16} className="text-text-secondary" />
            Pickup date &amp; time
          </label>
          <input
            id="scheduledAt"
            type="datetime-local"
            min={minDateTime}
            value={dateTime}
            onChange={(e) => {
              setDateTime(e.target.value);
              setValidationError('');
            }}
            disabled={isLoading}
            className="w-full px-3 py-2.5 border border-border rounded-lg bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all disabled:opacity-50"
          />
          {validationError && (
            <p className="text-xs text-danger mt-1.5">{validationError}</p>
          )}
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
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-dash-primary text-white text-sm font-medium hover:bg-dash-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scheduling...
              </>
            ) : (
              'Confirm Schedule'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}