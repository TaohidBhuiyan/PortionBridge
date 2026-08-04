import { DashboardLayout } from '../components/dashboard';
import { EmptyState } from '../components/dashboard';
import { User } from 'lucide-react';

/**
 * Sample Volunteer Dashboard page for testing the Dashboard Layout
 */
export function VolunteerDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Volunteer Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your volunteer activities and track your contributions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Pickups Completed', value: '28', color: 'bg-green-500' },
            { label: 'Hours Volunteered', value: '45', color: 'bg-blue-500' },
            { label: 'People Helped', value: '120', color: 'bg-purple-500' },
            { label: 'Rating', value: '4.9', color: 'bg-orange-500' },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-[#120721] rounded-lg border border-gray-200 dark:border-purple-950/30 p-6"
            >
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                <User size={20} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-[#120721] rounded-lg border border-gray-200 dark:border-purple-950/30 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Available Pickups
          </h2>
          <EmptyState
            icon={User}
            title="No available pickups"
            description="There are no pickup requests in your area at the moment."
            actionLabel="Check Later"
            onAction={() => console.log('Check later clicked')}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
