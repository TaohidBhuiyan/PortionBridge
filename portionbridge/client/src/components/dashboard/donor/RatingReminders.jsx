import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { ratingApi } from '../../../services/ratingApi';

/**
 * RatingReminders — donor dashboard widget listing completed donations
 * that haven't been rated yet (GET /ratings/pending/reminders). Renders
 * nothing when the donor is caught up, rather than an empty-state card —
 * this is a nudge, not a section that always needs to take up space.
 *
 * Rating itself happens on DonationDetailsPage (`/donations/:id`, "Rate
 * Your Experience" section) — this widget only surfaces which donations
 * need it and links there.
 */
export function RatingReminders() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const result = await ratingApi.getPendingReminders();
        if (result?.success) {
          setReminders(result.data?.reminders || []);
        }
      } catch (err) {
        console.error('Error fetching rating reminders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReminders();
  }, []);

  if (loading || reminders.length === 0) return null;

  return (
    <div className="bg-surface rounded-xl border border-border p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Star size={18} className="text-warning" />
        <h3 className="text-sm font-semibold text-text-primary">
          Rate your recent donations
        </h3>
      </div>
      <div className="space-y-2">
        {reminders.slice(0, 3).map((r) => (
          <button
            key={r.donation_id}
            onClick={() => navigate(`/donations/${r.donation_id}`)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-page hover:bg-surface-hover transition-colors text-left"
          >
            <span className="text-sm text-text-primary truncate">
              {r.title} — picked up by {r.volunteer_name}
            </span>
            <span className="shrink-0 text-xs font-medium text-dash-primary ml-3">Rate now</span>
          </button>
        ))}
      </div>
      {reminders.length > 3 && (
        <p className="text-xs text-text-muted mt-2">
          +{reminders.length - 3} more waiting for a rating
        </p>
      )}
    </div>
  );
}
