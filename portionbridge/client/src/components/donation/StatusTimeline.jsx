import { Check } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

// These are the exact statuses supported by the backend's donation_requests.status
// ENUM ('pending', 'accepted', 'scheduled', 'on_the_way', 'picked_up', 'completed').
// There is no 'cancelled' status — cancellation is a soft-delete, not a status
// value, so it isn't part of this progression.
//
// `timestampKey` and `next` map each step to a real column on the donation
// (when present) and a short, honest "what happens next" hint — no invented
// ETAs or fabricated copy, matching TrackingPanel's approach to real data.
const STATUSES = [
  { key: 'pending', label: 'Pending', timestampKey: 'created_at', next: 'Waiting for a volunteer to accept this donation.' },
  { key: 'accepted', label: 'Accepted', timestampKey: 'accepted_at', next: 'The volunteer is arranging pickup details.' },
  { key: 'scheduled', label: 'Scheduled', timestampKey: 'scheduled_at', next: 'Pickup is scheduled — the volunteer will head over soon.' },
  { key: 'on_the_way', label: 'On The Way', timestampKey: null, next: 'The volunteer is heading to the pickup location.' },
  { key: 'picked_up', label: 'Picked Up', timestampKey: null, next: 'Your donation is on its way to its destination.' },
  { key: 'completed', label: 'Completed', timestampKey: 'completed_at', next: null },
];

function formatTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/**
 * StatusTimeline — vertical progression through the real donation lifecycle
 * statuses. Shows a timestamp for any step whose column is present on the
 * donation record, and a short "what's happening now" hint for the current
 * step so the donor always knows what to expect next.
 */
export function StatusTimeline({ currentStatus, donation }) {
  const currentIndex = STATUSES.findIndex((s) => s.key === currentStatus);
  const currentStep = STATUSES[currentIndex];
  const shouldReduceMotion = useReducedMotion();

  return (
    <div>
      <div className="relative">
        <div className="absolute left-3.5 top-1 bottom-1 w-px bg-border" />
        <div className="space-y-3">
          {STATUSES.map((s, index) => {
            const isPast = index < currentIndex;
            const isCurrent = index === currentIndex;
            const timestamp = s.timestampKey ? formatTimestamp(donation?.[s.timestampKey]) : null;

            return (
              <div key={s.key} className="relative flex items-start gap-3 pl-9">
                <div
                  className={`absolute left-0 w-7 h-7 rounded-full flex items-center justify-center ring-4 ring-surface shrink-0 ${
                    isPast
                      ? 'bg-success text-white'
                      : isCurrent
                        ? 'bg-dash-primary text-white'
                        : 'bg-page border border-border text-text-secondary'
                  }`}
                >
                  {isCurrent && !shouldReduceMotion ? (
                    <motion.span
                      key={currentStatus}
                      initial={{ scale: 0.7, opacity: 0.6 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                      className="absolute inset-0 rounded-full ring-4 ring-dash-primary/30"
                    />
                  ) : null}
                  {isPast ? <Check size={13} /> : <span className="text-[10px] font-semibold relative">{index + 1}</span>}
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className={`text-sm ${isPast || isCurrent ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>
                      {s.label}
                    </p>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-dash-primary">Current</span>
                    )}
                  </div>
                  {timestamp && (
                    <p className="text-xs text-text-muted mt-0.5">{timestamp}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {currentStep?.next && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">What happens next</p>
          <p className="text-sm text-text-secondary">{currentStep.next}</p>
        </div>
      )}
    </div>
  );
}
