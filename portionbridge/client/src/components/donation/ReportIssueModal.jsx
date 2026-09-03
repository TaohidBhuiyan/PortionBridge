import { useState } from 'react';
import toast from 'react-hot-toast';
import { Flag } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { reportApi } from '../../services/reportApi';

const REASONS = [
  'Volunteer did not show up',
  'Volunteer was unprofessional',
  'Donation items were mishandled',
  'Communication issue',
  'Safety concern',
  'Other',
];

/**
 * ReportIssueModal — files a report about the current donation via the
 * existing POST /reports endpoint (server/controllers/report.controller.js),
 * which previously had no frontend caller at all. Donors and volunteers can
 * both file reports per the backend's authorization rule; this modal is
 * reused for both from DonationDetailsPage.
 */
export function ReportIssueModal({ donationId, onClose, onSubmitted }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await reportApi.createReport({ donationId, reason, details: details.trim() || undefined });
    if (result.success) {
      toast.success('Report submitted. Our team will review it.');
      onSubmitted?.();
      onClose();
    } else {
      toast.error(result.message || 'Failed to submit report.');
    }
    setSubmitting(false);
  };

  return (
    <Modal title="Report an Issue" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-text-secondary">
          Let us know what went wrong with this donation. Our team will review it.
        </p>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">What happened? *</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary"
          >
            {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Additional details (optional)</label>
          <textarea
            rows={4}
            maxLength={2000}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Share any details that will help us understand what happened..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" variant="danger" loading={submitting} icon={Flag} className="flex-1">
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
