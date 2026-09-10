import { Check, Sparkles } from 'lucide-react';

const getStepSubtitle = (stepId, category) => {
  if (stepId === 'details') {
    if (category === 'food') return 'Food & Dietary Specs';
    if (category === 'clothes') return 'Clothing & Condition';
    return 'Item specifications';
  }
  if (stepId === 'pickup') {
    return category === 'food' ? 'Perishable pickup timing' : 'Pickup & scheduling';
  }
  if (stepId === 'images') {
    return category === 'food' ? 'Food & packing photos' : 'Garment condition photos';
  }
  const defaultSubtitles = {
    basic: 'Category & basics',
    details: 'Item specifications',
    pickup: 'Location & time slot',
    images: 'Visual verification',
    assignment: 'Volunteer match',
    review: 'Final review receipt',
  };
  return defaultSubtitles[stepId] || 'Step details';
};

/**
 * Stepper component - Multi-step form progress indicator
 * Ultra-premium design with connected fluid progress bar, glowing active states,
 * contextual category-aware step subtitles, and clean mobile ticker.
 */
export function Stepper({ steps, currentStep, onStepClick, category }) {
  const progressPercent = Math.round((currentStep / (steps.length - 1)) * 100);

  return (
    <div className="w-full mb-8">
      {/* Desktop Stepper */}
      <div className="hidden lg:block relative">
        {/* Continuous Track Line */}
        <div className="absolute top-5 left-8 right-8 h-1 bg-border rounded-full -z-0">
          <div 
            className="h-full bg-gradient-to-r from-dash-primary to-emerald-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Steps Grid */}
        <div className="relative z-10 flex items-start justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isClickable = index < currentStep || isCurrent;
            const subtitle = getStepSubtitle(step.id, category);

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => isClickable && onStepClick && onStepClick(index)}
                disabled={!isClickable}
                className={`group flex flex-col items-center text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary rounded-xl px-2 py-1 ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
                }`}
                aria-label={`Go to ${step.title}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* Step Circle Indicator */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-sm
                    ${
                      isCurrent
                        ? 'bg-dash-primary text-white ring-4 ring-dash-primary/20 shadow-lg shadow-dash-primary/25 scale-110'
                        : isCompleted
                        ? 'bg-emerald-600 text-white group-hover:bg-emerald-500 group-hover:scale-105 shadow-emerald-500/20'
                        : 'bg-surface border-2 border-border text-text-muted group-hover:border-dash-primary/40'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check size={16} className="stroke-[3]" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Step Labels */}
                <div className="mt-2.5 max-w-[120px]">
                  <p
                    className={`text-xs font-semibold tracking-tight transition-colors line-clamp-1 ${
                      isCurrent
                        ? 'text-dash-primary'
                        : isCompleted
                        ? 'text-text-primary group-hover:text-dash-primary'
                        : 'text-text-secondary'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1">
                    {subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Medium Screens (Tablets) Stepper */}
      <div className="hidden md:flex lg:hidden items-center justify-between gap-2 p-3 bg-surface rounded-2xl border border-border/80 shadow-sm">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = index < currentStep || isCurrent;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => isClickable && onStepClick && onStepClick(index)}
              disabled={!isClickable}
              className={`flex-1 flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
                isCurrent
                  ? 'bg-dash-primary-soft text-dash-primary font-semibold ring-1 ring-dash-primary/30'
                  : isCompleted
                  ? 'text-text-primary hover:bg-surface-hover'
                  : 'text-text-muted opacity-60'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isCurrent
                    ? 'bg-dash-primary text-white'
                    : isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-page border border-border text-text-secondary'
                }`}
              >
                {isCompleted ? <Check size={12} className="stroke-[3]" /> : index + 1}
              </div>
              <span className="text-xs truncate">{step.title}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Stepper - Ultra-Compact & Elegant */}
      <div className="md:hidden bg-surface rounded-2xl border border-border/80 p-3.5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-dash-primary/10 text-dash-primary">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-xs font-bold text-text-primary truncate">
              {steps[currentStep].title}
            </span>
          </div>
          <span className="text-xs font-semibold text-text-secondary flex items-center gap-1">
            <Sparkles size={12} className="text-dash-primary" />
            {progressPercent}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-page rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-dash-primary to-emerald-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Quick Stepper dots */}
        <div className="flex items-center justify-between mt-2.5 px-1">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => (isCompleted || isCurrent) && onStepClick && onStepClick(index)}
                disabled={!isCompleted && !isCurrent}
                aria-label={`Step ${index + 1}: ${step.title}`}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  isCurrent
                    ? 'w-6 bg-dash-primary'
                    : isCompleted
                    ? 'w-3 bg-emerald-600'
                    : 'w-2 bg-border'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
