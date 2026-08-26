import React from 'react';
import { Check } from 'lucide-react';

/**
 * Stepper component for multi-step form progress indicator
 * Redesigned for compact, professional appearance
 */
export function Stepper({ steps, currentStep, onStepClick }) {
  return (
    <div className="w-full mb-6">
      {/* Desktop Stepper */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center flex-1">
                <button
                  onClick={() => onStepClick && onStepClick(index)}
                  disabled={!isCompleted && !isCurrent}
                  className={`
                    flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 w-full
                    ${isCurrent 
                      ? 'bg-dash-primary-soft border-2 border-dash-primary' 
                      : isCompleted 
                        ? 'bg-success-soft border-2 border-success cursor-pointer hover:bg-success-soft/70'
                        : 'bg-page border-2 border-border'
                    }
                  `}
                  aria-label={`Go to ${step.title}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs
                    ${isCurrent 
                      ? 'bg-dash-primary text-white' 
                      : isCompleted 
                        ? 'bg-success text-white' 
                        : 'bg-surface text-text-secondary'
                    }
                  `}>
                    {isCompleted ? <Check size={12} /> : index + 1}
                  </div>
                  <span className={`
                    font-medium text-xs
                    ${isCurrent 
                      ? 'text-dash-primary' 
                      : isCompleted 
                        ? 'text-success' 
                        : 'text-text-secondary'
                    }
                  `}>
                    {step.title}
                  </span>
                </button>
              </div>

              {!isLast && (
                <div className={`
                  w-8 h-0.5 mx-2
                  ${isCompleted ? 'bg-success' : 'bg-border'}
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Stepper - Compact */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div
                key={step.id}
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center font-semibold text-[10px] transition-all duration-200
                  ${isCurrent 
                    ? 'bg-dash-primary text-white scale-110' 
                    : isCompleted 
                      ? 'bg-success text-white' 
                      : 'bg-surface text-text-secondary'
                  }
                `}
              >
                {isCompleted ? <Check size={10} /> : index + 1}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-text-primary">
            {steps[currentStep].title}
          </span>
          <span className="text-text-secondary">
            {currentStep + 1} of {steps.length}
          </span>
        </div>
      </div>
    </div>
  );
}
