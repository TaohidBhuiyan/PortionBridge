import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

/**
 * Stepper component for multi-step form progress indicator
 * Shows current step, completed steps, and remaining steps
 */
export function Stepper({ steps, currentStep, onStepClick }) {
  return (
    <div className="w-full mb-8">
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
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isCurrent 
                      ? 'bg-purple-100 dark:bg-purple-950/30 border-2 border-purple-500 dark:border-purple-400' 
                      : isCompleted 
                        ? 'green-100 dark:bg-green-950/30 border-2 border-green-500 dark:border-green-400 cursor-pointer hover:bg-green-200 dark:hover:bg-green-950/40'
                        : 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600'
                    }
                  `}
                  aria-label={`Go to ${step.title}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm
                    ${isCurrent 
                      ? 'bg-purple-500 text-white' 
                      : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                    }
                  `}>
                    {isCompleted ? <Check size={16} /> : index + 1}
                  </div>
                  <span className={`
                    font-medium text-sm
                    ${isCurrent 
                      ? 'text-purple-900 dark:text-purple-100' 
                      : isCompleted 
                        ? 'text-green-900 dark:text-green-100' 
                        : 'text-gray-600 dark:text-gray-400'
                    }
                  `}>
                    {step.title}
                  </span>
                </button>
              </div>

              {!isLast && (
                <div className={`
                  w-12 h-0.5 mx-2
                  ${isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Stepper - Compact */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div
                key={step.id}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-200
                  ${isCurrent 
                    ? 'bg-purple-500 text-white scale-110' 
                    : isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }
                `}
              >
                {isCompleted ? <Check size={14} /> : index + 1}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-900 dark:text-white">
            {steps[currentStep].title}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
      </div>
    </div>
  );
}
