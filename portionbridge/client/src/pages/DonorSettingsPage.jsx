import { ArrowLeft, Lock, Bell, Moon, Shield } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard';
import { SecuritySettings } from '../components/dashboard/settings/SecuritySettings';
import { NotificationSettings } from '../components/dashboard/settings/NotificationSettings';
import { AppearanceSettings } from '../components/dashboard/settings/AppearanceSettings';
import { PrivacySettings } from '../components/dashboard/settings/PrivacySettings';

/**
 * Account Settings Page — password, notifications, appearance, and logout.
 *
 * File/export name is legacy ("Donor..."), but nothing in here is actually
 * donor-specific: every tab is one of the shared, role-agnostic
 * components in components/dashboard/settings/ (see their own doc
 * comments for why). COMING-SOON ELIMINATION: rather than duplicate this
 * whole page for volunteers, App.jsx also mounts this same component at
 * /volunteer/settings; Admin Settings (AdminSectionPage.jsx) reuses the
 * same three section components directly alongside its own Profile Photo
 * section.
 */
export function DonorSettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam && ['security', 'notifications', 'appearance', 'privacy'].includes(tabParam)
    ? tabParam
    : 'security';

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const tabs = [
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Moon },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Account Settings
            </h1>
            <p className="text-sm text-text-secondary">
              Manage your account preferences
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Tabs */}
          <div className="w-48 flex-shrink-0">
            <div className="bg-surface rounded-2xl border border-border p-2 shadow-sm">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-dash-primary-soft text-dash-primary shadow-sm'
                        : 'text-text-secondary hover:bg-surface-hover'
                    } focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2`}
                    aria-label={`Switch to ${tab.label} settings`}
                    aria-selected={activeTab === tab.id}
                    role="tab"
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'appearance' && <AppearanceSettings />}
            {activeTab === 'privacy' && <PrivacySettings />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
