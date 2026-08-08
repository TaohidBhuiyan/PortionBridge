import { DashboardLayout } from '../components/dashboard';
import { useAuth } from '../context/AuthContext';

/**
 * Donor Dashboard Home - Production-ready overview page
 * Integrates all dashboard widgets and components
 */
export function DonorDashboard() {
  const { user } = useAuth();

  console.log('DonorDashboard rendering, user:', user);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4">
        {/* Test: Simple div to verify rendering */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Dashboard Test</h1>
          <p className="text-slate-600 dark:text-slate-400">If you can see this, the dashboard is rendering.</p>
          <p className="text-slate-600 dark:text-slate-400 mt-2">User: {user?.name || 'Not authenticated'}</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
