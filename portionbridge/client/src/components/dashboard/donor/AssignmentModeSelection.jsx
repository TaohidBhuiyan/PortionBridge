import { Bot, User } from 'lucide-react';

/**
 * Assignment Mode Selection Component
 * Allows donor to choose between Auto Assign and Manual Volunteer Selection
 */
const AssignmentModeSelection = ({ selectedMode, onModeChange, disabled = false }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        How would you like your donation to be assigned?
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Auto Assign Option */}
        <button
          onClick={() => !disabled && onModeChange('auto')}
          disabled={disabled}
          className={`relative p-6 rounded-xl border-2 transition-all ${
            selectedMode === 'auto'
              ? 'border-dash-primary bg-dash-primary-soft'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              selectedMode === 'auto'
                ? 'bg-dash-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              <Bot className="w-6 h-6" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Auto Assign
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                System automatically selects the best volunteer based on distance, availability, and workload.
              </p>
            </div>
          </div>
          {selectedMode === 'auto' && (
            <div className="absolute top-4 right-4 w-4 h-4 bg-dash-primary rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>

        {/* Choose Volunteer Option */}
        <button
          onClick={() => !disabled && onModeChange('manual')}
          disabled={disabled}
          className={`relative p-6 rounded-xl border-2 transition-all ${
            selectedMode === 'manual'
              ? 'border-dash-primary bg-dash-primary-soft'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              selectedMode === 'manual'
                ? 'bg-dash-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              <User className="w-6 h-6" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Choose Volunteer
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Browse and select a volunteer yourself from the available options.
              </p>
            </div>
          </div>
          {selectedMode === 'manual' && (
            <div className="absolute top-4 right-4 w-4 h-4 bg-dash-primary rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default AssignmentModeSelection;
