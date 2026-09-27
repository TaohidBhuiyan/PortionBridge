import { useState } from 'react';
import { ArrowLeft, Lock, Bell, Moon, Shield, UserCog, Sliders, Search, Sparkles, User, Settings2, ShieldCheck, Database, Globe, AlertTriangle, Users, Activity } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard';
import { Avatar } from '../components/common/Avatar';
import { useAuth } from '../context/AuthContext';

export function AdminSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [autoModeration, setAutoModeration] = useState(true);
  const [spamDetection, setSpamDetection] = useState(true);
  const [theme, setTheme] = useState('light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  const tabParam = searchParams.get('tab');
  const activeTab = tabParam && ['security', 'notifications', 'appearance', 'platform', 'audit', 'moderation'].includes(tabParam)
    ? tabParam
    : 'security';

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const tabs = [
    { id: 'security', label: 'Security & Access', icon: Lock, desc: 'Password, sessions & admin authentication' },
    { id: 'notifications', label: 'Notification Rules', icon: Bell, desc: 'System-wide notification preferences' },
    { id: 'appearance', label: 'Admin Interface', icon: Moon, desc: 'Theme & dashboard customization' },
    { id: 'platform', label: 'Platform Settings', icon: Globe, desc: 'General platform configuration' },
    { id: 'audit', label: 'Audit & Logs', icon: ShieldCheck, desc: 'Activity logs & compliance settings' },
    { id: 'moderation', label: 'Moderation Tools', icon: AlertTriangle, desc: 'Content moderation & spam controls' },
  ];

  const filteredTabs = tabs.filter(t =>
    t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 dark:from-violet-800 dark:via-purple-800 dark:to-indigo-900 shadow-pb-elevated p-6 md:p-8">
          {/* Decorative elements */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-pink-400/20 blur-3xl" />

          <div className="relative flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm rounded-xl transition-all shrink-0"
              aria-label="Back to previous page"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 border border-white/30 backdrop-blur-sm">
                  <Settings2 size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Settings</h1>
                  <p className="text-white/70 text-sm mt-1">Platform administration & configuration</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Settings Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-border/60 rounded-xl bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          />
        </div>

        {/* Admin Profile Banner */}
        <div className="bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 dark:from-violet-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-violet-200 dark:border-violet-800 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden">
          <div className="flex items-center gap-4 z-10">
            <div className="relative">
              <Avatar
                item={user}
                tone="dash"
                className="w-16 h-16 rounded-2xl border-2 border-white shadow-md object-cover"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                ✓
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text-primary">{user?.name || 'Administrator'}</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-violet-600 text-white uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-3 text-[11px] text-text-muted mt-2">
                <span>Admin since {user?.created_at ? new Date(user.created_at).getFullYear() : '2026'}</span>
                <span>•</span>
                <span className="text-violet-600 dark:text-violet-400 font-medium flex items-center gap-1">
                  <Sparkles size={12} /> Full Access
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-surface rounded-lg border border-violet-200 dark:border-violet-800">
              <Activity size={14} className="text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-medium text-text-primary">System Active</span>
            </div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-xs font-semibold rounded-xl transition-all shadow-xs"
            >
              <Users size={14} />
              <span>Dashboard</span>
            </button>
          </div>
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
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-surface text-text-secondary hover:bg-surface-hover border border-border/60'
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
            <div className="bg-surface rounded-2xl border border-border/60 shadow-pb-card p-4 space-y-1">
              <div className="px-3 py-2 text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Settings2 size={14} /> Admin Settings
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
                        ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-bold shadow-xs border border-violet-300 dark:border-violet-700'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-violet-600 text-white'
                        : 'bg-page text-text-secondary'
                    }`}>
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
            {activeTab === 'security' && (
              <div className="bg-surface rounded-2xl border border-border/60 shadow-pb-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                    <Lock size={20} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Security & Access</h3>
                    <p className="text-xs text-text-secondary">Manage your admin account security</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Password</h4>
                        <p className="text-xs text-text-secondary">Last changed 30 days ago</p>
                      </div>
                      <button className="px-3 py-1.5 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
                        Change Password
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Active Sessions</h4>
                        <p className="text-xs text-text-secondary">3 active sessions across devices</p>
                      </div>
                      <button className="px-3 py-1.5 text-xs font-medium bg-surface border border-border/60 rounded-lg hover:bg-surface-hover transition-colors">
                        Manage Sessions
                      </button>
                    </div>
                  </div>


                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-surface rounded-2xl border border-border/60 shadow-pb-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                    <Bell size={20} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Notification Rules</h3>
                    <p className="text-xs text-text-secondary">Configure system-wide notification preferences</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Email Notifications</h4>
                        <p className="text-xs text-text-secondary">Send notifications via email</p>
                      </div>
                      <button
                        onClick={() => setEmailNotifications(!emailNotifications)}
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                          emailNotifications ? 'bg-violet-600' : 'bg-surface border border-border/60'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          emailNotifications ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Push Notifications</h4>
                        <p className="text-xs text-text-secondary">Send in-app push notifications</p>
                      </div>
                      <button
                        onClick={() => setPushNotifications(!pushNotifications)}
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                          pushNotifications ? 'bg-violet-600' : 'bg-surface border border-border/60'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          pushNotifications ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">SMS Notifications</h4>
                        <p className="text-xs text-text-secondary">Send notifications via SMS</p>
                      </div>
                      <button
                        onClick={() => setSmsNotifications(!smsNotifications)}
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                          smsNotifications ? 'bg-violet-600' : 'bg-surface border border-border/60'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          smsNotifications ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="bg-surface rounded-2xl border border-border/60 shadow-pb-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                    <Moon size={20} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Admin Interface</h3>
                    <p className="text-xs text-text-secondary">Customize admin dashboard appearance</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <h4 className="text-sm font-semibold text-text-primary mb-3">Theme</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setTheme('light')}
                        className={`p-3 rounded-xl text-center transition-all ${
                          theme === 'light'
                            ? 'bg-white border-2 border-violet-500 shadow-sm'
                            : 'bg-surface border border-border/60 hover:border-violet-300'
                        }`}
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-lg mx-auto mb-2" />
                        <span className="text-xs font-medium text-text-primary">Light</span>
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`p-3 rounded-xl text-center transition-all ${
                          theme === 'dark'
                            ? 'bg-gray-800 border-2 border-violet-500 shadow-sm'
                            : 'bg-surface border border-border/60 hover:border-violet-300'
                        }`}
                      >
                        <div className="w-8 h-8 bg-gray-800 rounded-lg mx-auto mb-2" />
                        <span className="text-xs font-medium text-text-primary">Dark</span>
                      </button>
                      <button
                        onClick={() => setTheme('auto')}
                        className={`p-3 rounded-xl text-center transition-all ${
                          theme === 'auto'
                            ? 'bg-gradient-to-r from-gray-100 to-gray-800 border-2 border-violet-500 shadow-sm'
                            : 'bg-surface border border-border/60 hover:border-violet-300'
                        }`}
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-gray-100 to-gray-800 rounded-lg mx-auto mb-2" />
                        <span className="text-xs font-medium text-text-primary">Auto</span>
                      </button>
                    </div>
                    <div className="mt-3 p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
                      <p className="text-xs text-violet-700 dark:text-violet-300">
                        Current theme: <span className="font-semibold capitalize">{theme}</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Compact Mode</h4>
                        <p className="text-xs text-text-secondary">Use more compact interface</p>
                      </div>
                      <button
                        onClick={() => setCompactMode(!compactMode)}
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                          compactMode ? 'bg-violet-600' : 'bg-surface border border-border/60'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          compactMode ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Sidebar Default</h4>
                        <p className="text-xs text-text-secondary">Sidebar collapsed by default</p>
                      </div>
                      <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                          sidebarCollapsed ? 'bg-violet-600' : 'bg-surface border border-border/60'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          sidebarCollapsed ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Animations</h4>
                        <p className="text-xs text-text-secondary">Enable interface animations</p>
                      </div>
                      <button
                        onClick={() => setAnimationsEnabled(!animationsEnabled)}
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                          animationsEnabled ? 'bg-violet-600' : 'bg-surface border border-border/60'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          animationsEnabled ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'platform' && (
              <div className="bg-surface rounded-2xl border border-border/60 shadow-pb-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                    <Globe size={20} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Platform Settings</h3>
                    <p className="text-xs text-text-secondary">General platform configuration</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Maintenance Mode</h4>
                        <p className="text-xs text-text-secondary">Put platform in maintenance mode</p>
                      </div>
                      <button
                        onClick={() => setMaintenanceMode(!maintenanceMode)}
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                          maintenanceMode ? 'bg-violet-600' : 'bg-surface border border-border/60'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          maintenanceMode ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Registration</h4>
                        <p className="text-xs text-text-secondary">Allow new user registrations</p>
                      </div>
                      <button
                        onClick={() => setRegistrationEnabled(!registrationEnabled)}
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                          registrationEnabled ? 'bg-violet-600' : 'bg-surface border border-border/60'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          registrationEnabled ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <h4 className="text-sm font-semibold text-text-primary mb-3">Platform Name</h4>
                    <input
                      type="text"
                      defaultValue="PortionBridge"
                      className="w-full px-3 py-2 border border-border/60 rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="bg-surface rounded-2xl border border-border/60 shadow-pb-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                    <ShieldCheck size={20} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Audit & Logs</h3>
                    <p className="text-xs text-text-secondary">Activity logs & compliance settings</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Log Retention</h4>
                        <p className="text-xs text-text-secondary">Keep logs for 90 days</p>
                      </div>
                      <button className="px-3 py-1.5 text-xs font-medium bg-surface border border-border/60 rounded-lg hover:bg-surface-hover transition-colors">
                        Configure
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Export Logs</h4>
                        <p className="text-xs text-text-secondary">Download activity logs</p>
                      </div>
                      <button className="px-3 py-1.5 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
                        Export
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'moderation' && (
              <div className="bg-surface rounded-2xl border border-border/60 shadow-pb-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                    <AlertTriangle size={20} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Moderation Tools</h3>
                    <p className="text-xs text-text-secondary">Content moderation & spam controls</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Auto-Moderation</h4>
                        <p className="text-xs text-text-secondary">Enable automatic content filtering</p>
                      </div>
                      <button
                        onClick={() => setAutoModeration(!autoModeration)}
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                          autoModeration ? 'bg-violet-600' : 'bg-surface border border-border/60'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          autoModeration ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-page rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">Spam Detection</h4>
                        <p className="text-xs text-text-secondary">Enable spam detection algorithms</p>
                      </div>
                      <button
                        onClick={() => setSpamDetection(!spamDetection)}
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${
                          spamDetection ? 'bg-violet-600' : 'bg-surface border border-border/60'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          spamDetection ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}