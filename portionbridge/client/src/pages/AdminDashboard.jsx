import { DashboardLayout } from '../components/dashboard';
import { EmptyState } from '../components/dashboard';
import { Shield } from 'lucide-react';

/**
 * Sample Admin Dashboard page for testing the Dashboard Layout
 */
export function AdminDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Admin Dashboard
          </h1>
          <p className="text-text-secondary">
            Manage users, donations, and platform settings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: '1,234', color: 'bg-dash-primary' },
            { label: 'Active Donors', value: '456', color: 'bg-success' },
            { label: 'Volunteers', value: '78', color: 'bg-info' },
            { label: 'Pending Reports', value: '12', color: 'bg-danger' },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-surface rounded-lg border border-border p-6"
            >
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                <Shield size={20} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-text-primary mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-text-secondary">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-surface rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Recent Activity
          </h2>
          <EmptyState
            icon={Shield}
            title="No recent activity"
            description="There are no recent activities to display."
            actionLabel="Refresh"
            onAction={() => console.log('Refresh clicked')}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
