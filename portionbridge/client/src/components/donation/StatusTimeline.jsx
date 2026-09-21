import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

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

export function StatusTimeline({ currentStatus, donation }) {
  const currentIndex = STATUSES.findIndex((s) => s.key === currentStatus);
  const currentStep = STATUSES[currentIndex];
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="space-y-4">
      <div className="relative pl-1">
        {/* Progress connecting line */}
        <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-border/60 rounded-full" />
        
        {/* Progress active filled bar */}
        {currentIndex > 0 && (
          <div
            className="absolute left-[15px] top-3 w-0.5 bg-gradient-to-b from-success via-dash-primary to-dash-primary rounded-full transition-all duration-500"
            style={{
              height: `${Math.min(100, (currentIndex / (STATUSES.length - 1)) * 100)}%`,
            }}
          />
        )}

        <div className="space-y-4">
          {STATUSES.map((s, index) => {
            const isPast = index < currentIndex;
            const isCurrent = index === currentIndex;
            const timestamp = s.timestampKey ? formatTimestamp(donation?.[s.timestampKey]) : null;

            return (
              <div key={s.key} className="relative flex items-start gap-3.5 pl-10 group">
                {/* Node icon / indicator */}
                <div
                  className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm ${
                    isPast
                      ? 'bg-success text-white ring-4 ring-surface'
                      : isCurrent
                        ? 'bg-dash-primary text-white ring-4 ring-dash-primary/20 shadow-pb-elevated'
                        : 'bg-surface border border-border text-text-muted ring-4 ring-surface'
                  }`}
                >
                  {isCurrent && !shouldReduceMotion ? (
                    <motion.span
                      key={currentStatus}
                      initial={{ scale: 0.8, opacity: 0.6 }}
                      animate={{ scale: 1.25, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-full bg-dash-primary/40"
                    />
                  ) : null}
                  {isPast ? (
                    <Check size={14} className="stroke-[2.5]" />
                  ) : (
                    <span className={`text-[11px] font-bold relative ${isCurrent ? 'text-white' : 'text-text-muted'}`}>
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm ${isPast ? 'font-medium text-text-primary' : isCurrent ? 'font-bold text-dash-primary' : 'text-text-secondary'}`}>
                      {s.label}
                    </p>
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-dash-primary-soft text-dash-primary text-[10px] font-bold uppercase tracking-wider animate-pulse">
                        <Sparkles size={10} /> Active Stage
                      </span>
                    )}
                  </div>
                  {timestamp && (
                    <p className="text-xs text-text-muted mt-0.5 font-medium">{timestamp}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {currentStep?.next && (
        <div className="mt-5 pt-4 border-t border-border/60 bg-dash-primary-soft/40 -mx-5 -mb-5 p-4 rounded-b-xl flex items-start gap-2.5">
          <div className="p-1 rounded-md bg-dash-primary/10 text-dash-primary shrink-0 mt-0.5">
            <ArrowRight size={14} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-dash-primary mb-0.5">What Happens Next</p>
            <p className="text-xs text-text-secondary leading-relaxed">{currentStep.next}</p>
          </div>
        </div>
      )}
    </div>
  );
}

