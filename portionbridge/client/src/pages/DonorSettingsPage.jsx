import { useState } from 'react';
import { ArrowLeft, Lock, Bell, Moon, Shield, UserCog, Sliders, Search, Sparkles, User, Settings2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard';
import { SecuritySettings } from '../components/dashboard/settings/SecuritySettings';
import { NotificationSettings } from '../components/dashboard/settings/NotificationSettings';
import { AppearanceSettings } from '../components/dashboard/settings/AppearanceSettings';
import { PrivacySettings } from '../components/dashboard/settings/PrivacySettings';
import { AccountTypeSettings } from '../components/dashboard/settings/AccountTypeSettings';
import { DonorPreferencesSettings } from '../components/dashboard/settings/DonorPreferencesSettings';
import { Avatar } from '../components/common/Avatar';
import { useAuth } from '../context/AuthContext';

export function DonorSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  const tabParam = searchParams.get('tab');
  const activeTab = tabParam && ['security', 'notifications', 'appearance', 'preferences', 'privacy', 'accountType'].includes(tabParam)
    ? tabParam
    : 'security';

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const tabs = [
    { id: 'security', label: 'Security & Passwords', icon: Lock, desc: 'Password, sessions & device security' },
    { id: 'notifications', label: 'Notifications & Alerts', icon: Bell, desc: 'Email, SMS & push notification preferences' },
    { id: 'appearance', label: 'Appearance & Theme', icon: Moon, desc: 'Light, dark & interface theme settings' },
    { id: 'preferences', label: 'Donation Preferences', icon: Sliders, desc: 'Pickup time slots & contact channels' },
    { id: 'privacy', label: 'Privacy & Visibility', icon: Shield, desc: 'Leaderboard & public profile controls' },
    { id: 'accountType', label: 'Account Role', icon: UserCog, desc: 'Donor & volunteer role preferences' },
  ];

  const filteredTabs = tabs.filter(t =>
    t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Top Navigation & Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-surface hover:bg-surface-hover border border-border rounded-xl transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-dash-primary shrink-0"
              aria-label="Back to previous page"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-text-primary tracking-tight">
                  Account Settings
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-dash-primary-soft text-dash-primary">
                  Preferences Center
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Manage security, communication preferences, theme, and donation options
              </p>
            </div>
          </div>

          {/* Search Settings Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-xl bg-surface text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-dash-primary transition-all"
            />
          </div>
        </div>

        {/* Hero User Profile Snapshot Banner */}
        <div className="bg-gradient-to-r from-dash-primary/15 via-dash-primary-soft to-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden">
          <div className="flex items-center gap-4 z-10">
            <div className="relative">
              <Avatar
                src={user?.profile_photo_url}
                alt={user?.name || 'User'}
                size="lg"
                className="w-16 h-16 rounded-2xl border-2 border-surface shadow-md object-cover"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success border-2 border-surface flex items-center justify-center text-[10px] text-white font-bold">
                ✓
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text-primary">{user?.name || 'Valued Contributor'}</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-dash-primary text-white uppercase tracking-wider">
                  {user?.role || 'Donor'}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-3 text-[11px] text-text-muted mt-2">
                <span>Member since {user?.created_at ? new Date(user.created_at).getFullYear() : '2026'}</span>
                <span>•</span>
                <span className="text-dash-primary font-medium flex items-center gap-1">
                  <Sparkles size={12} /> Active Account
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/donor/profile')}
            className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text-primary text-xs font-semibold rounded-xl transition-all shadow-xs z-10"
          >
            <User size={14} />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Responsive Horizontal Mobile Tabs */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-dash-primary text-white shadow-sm'
                    : 'bg-surface text-text-secondary hover:bg-surface-hover border border-border'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content & Desktop Tab Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Left Sidebar Navigation */}
          <div className="hidden lg:block lg:col-span-4 space-y-2">
            <div className="bg-surface rounded-2xl border border-border p-3 shadow-sm space-y-1">
              <div className="px-3 py-2 text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Settings2 size={14} /> Settings Navigation
              </div>

              {filteredTabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-dash-primary-soft text-dash-primary font-bold shadow-xs border border-dash-primary/20'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-dash-primary text-white' : 'bg-page text-text-secondary'}`}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-tight">{tab.label}</p>
                      <p className="text-[11px] text-text-muted font-normal mt-0.5 truncate">{tab.desc}</p>
                    </div>
                  </button>
                );
              })}

              {filteredTabs.length === 0 && (
                <div className="p-4 text-center text-xs text-text-muted">
                  No matching settings tab found.
                </div>
              )}
            </div>
          </div>

          {/* Right Main Content Area */}
          <div className="col-span-1 lg:col-span-8 space-y-6">
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'appearance' && <AppearanceSettings />}
            {activeTab === 'preferences' && <DonorPreferencesSettings />}
            {activeTab === 'privacy' && <PrivacySettings />}
            {activeTab === 'accountType' && <AccountTypeSettings />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

