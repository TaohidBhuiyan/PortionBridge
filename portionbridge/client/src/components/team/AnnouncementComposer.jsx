import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Megaphone } from 'lucide-react';

const TITLE_MAX = 100;
const MESSAGE_MAX = 380;

/**
 * AnnouncementComposer — PHASE 4.
 *
 * Team-leader-only form for sending an announcement to the whole team.
 * Reuses the existing `send_team_announcement` Socket.IO event as-is (see
 * sockets/handlers/team.handler.js) rather than adding a REST endpoint or
 * a new backend field: that event only accepts { teamId, message }, so
 * Title + Message are combined client-side into a single message string
 * before sending. The persisted notification's own `title` column stays
 * the backend's existing "Team Announcement" (identifying the
 * notification's type to the recipient); the volunteer's custom title
 * becomes the lead line of the message body instead. This keeps the
 * announcement feature entirely within the existing architecture — no
 * backend change was made for this composer.
 *
 * Length limits (100 / 380 chars) are chosen to safely stay under the
 * notifications table's `message VARCHAR(500)` column once combined,
 * mirroring the backend's own constraint rather than an arbitrary one.
 */
export function AnnouncementComposer({ isOpen, onClose, onSend, sending = false }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setTitle('');
    setMessage('');
    setError('');
    onClose();
  };

  const handleSend = () => {
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();

    if (!trimmedTitle) {
      setError('Please add a title for the announcement.');
      return;
    }
    if (!trimmedMessage) {
      setError('Please add a message for the announcement.');
      return;
    }

    setError('');
    onSend(`${trimmedTitle}\n\n${trimmedMessage}`);
  };

  return (
    <Modal title="New Team Announcement" onClose={handleClose}>
      <div className="space-y-4">
        <div>
          <label htmlFor="announcement-title" className="block text-sm font-medium text-text-primary mb-2">
            Title
          </label>
          <input
            id="announcement-title"
            type="text"
            value={title}
            maxLength={TITLE_MAX}
            onChange={(e) => { setTitle(e.target.value); setError(''); }}
            placeholder="Tomorrow's Pickup Drive"
            disabled={sending}
            className="w-full px-3 py-2.5 border border-border rounded-lg bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all disabled:opacity-50"
          />
          <p className="text-[11px] text-text-secondary mt-1 text-right">{title.length}/{TITLE_MAX}</p>
        </div>

        <div>
          <label htmlFor="announcement-message" className="block text-sm font-medium text-text-primary mb-2">
            Message
          </label>
          <textarea
            id="announcement-message"
            value={message}
            maxLength={MESSAGE_MAX}
            onChange={(e) => { setMessage(e.target.value); setError(''); }}
            placeholder="Everyone please be available at 10 AM."
            rows={4}
            disabled={sending}
            className="w-full px-3 py-2.5 border border-border rounded-lg bg-page text-text-primary focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all resize-none disabled:opacity-50"
          />
          <p className="text-[11px] text-text-secondary mt-1 text-right">{message.length}/{MESSAGE_MAX}</p>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleClose}
            disabled={sending}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-primary text-sm font-medium hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
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
                <Megaphone size={15} />
                Send Announcement
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}