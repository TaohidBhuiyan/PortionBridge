import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

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
                      ? 'bg-primary-50 dark:bg-primary-950/30 border-2 border-primary-600 dark:border-primary-400' 
                      : isCompleted 
                        ? 'bg-success-50 dark:bg-success-950/30 border-2 border-success-600 dark:border-success-400 cursor-pointer hover:bg-success-100 dark:hover:bg-success-950/40'
                        : 'bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700'
                    }
                  `}
                  aria-label={`Go to ${step.title}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs
                    ${isCurrent 
                      ? 'bg-primary-600 dark:bg-primary-400 text-white' 
                      : isCompleted 
                        ? 'bg-success-600 dark:bg-success-400 text-white' 
                        : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                    }
                  `}>
                    {isCompleted ? <Check size={12} /> : index + 1}
                  </div>
                  <span className={`
                    font-medium text-xs
                    ${isCurrent 
                      ? 'text-primary-900 dark:text-primary-100' 
                      : isCompleted 
                        ? 'text-success-900 dark:text-success-100' 
                        : 'text-slate-600 dark:text-slate-400'
                    }
                  `}>
                    {step.title}
                  </span>
                </button>
              </div>

              {!isLast && (
                <div className={`
                  w-8 h-0.5 mx-2
                  ${isCompleted ? 'bg-success-500' : 'bg-slate-200 dark:bg-slate-700'}
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
                    ? 'bg-primary-600 dark:bg-primary-400 text-white scale-110' 
                    : isCompleted 
                      ? 'bg-success-600 dark:bg-success-400 text-white' 
                      : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                  }
                `}
              >
                {isCompleted ? <Check size={10} /> : index + 1}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-900 dark:text-slate-50">
            {steps[currentStep].title}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            {currentStep + 1} of {steps.length}
          </span>
        </div>
      </div>
    </div>
  );
}
