import { Check } from 'lucide-react';

// These are the exact statuses supported by the backend's donation_requests.status
// ENUM ('pending', 'accepted', 'scheduled', 'on_the_way', 'picked_up', 'completed').
// There is no 'cancelled' status — cancellation is a soft-delete, not a status
// value, so it isn't part of this progression.
const STATUSES = [
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'on_the_way', label: 'On The Way' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'completed', label: 'Completed' },
];

/**
 * StatusTimeline — compact vertical progression through the real donation
 * lifecycle statuses.
 */
export function StatusTimeline({ currentStatus }) {
  const currentIndex = STATUSES.findIndex((s) => s.key === currentStatus);

  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1 bottom-1 w-px bg-border" />
      <div className="space-y-3">
        {STATUSES.map((s, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={s.key} className="relative flex items-center gap-3 pl-9">
              <div
                className={`absolute left-0 w-7 h-7 rounded-full flex items-center justify-center ring-4 ring-surface shrink-0 ${
                  isPast
                    ? 'bg-success text-white'
                    : isCurrent
                      ? 'bg-dash-primary text-white'
                      : 'bg-page border border-border text-text-secondary'
                }`}
              >
                {isPast ? <Check size={13} /> : <span className="text-[10px] font-semibold">{index + 1}</span>}
              </div>
              <div>
                <p className={`text-sm ${isPast || isCurrent ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>
                  {s.label}
                </p>
                {isCurrent && (
                  <p className="text-xs text-dash-primary">Current status</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
