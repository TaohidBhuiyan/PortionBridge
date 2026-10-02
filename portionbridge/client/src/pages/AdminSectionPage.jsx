import { useState, useRef } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import {
  Settings,
  Camera,
  Loader2,
  Lock,
  Bell,
  Moon,
  ShieldCheck,
  Users,
  Flag,
  ScrollText,
} from 'lucide-react';
import { DashboardLayout } from '../components/dashboard';
import { Avatar } from '../components/common/Avatar';
import { SecuritySettings } from '../components/dashboard/settings/SecuritySettings';
import { NotificationSettings } from '../components/dashboard/settings/NotificationSettings';
import { AppearanceSettings } from '../components/dashboard/settings/AppearanceSettings';
import { profileApi } from '../services/profileApi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// One entry per admin sidebar section that isn't built yet. Each later
// phase will replace its entry here with a real, dedicated page + route
// in App.jsx — this keeps the routing/nav foundation in place until then
// without a stack of near-identical placeholder files.
//
// PHASE 3: 'users' and 'donations' were removed from this map — they now
// have real, dedicated routes (AdminUsers/AdminUserDetail/AdminDonations/
// AdminDonationDetail in App.jsx), which take routing priority over this
// catch-all `/admin/:section` route since React Router ranks static path
// segments above dynamic ones regardless of declaration order.
//
// PHASE 4: 'volunteers-teams' was removed the same way — it now has a
// real route (AdminVolunteersTeams, plus AdminVolunteerDetail/
// AdminTeamDetail) in App.jsx.
//
// BUG FIX: 'live-operations', 'attention-center', 'analytics', and
// 'reports' were removed the same way too — AdminLiveOperations,
// AdminAttentionCenter, AdminAnalytics, and AdminReports all already have
// real routes in App.jsx (and have for a while), which — same as above —
// already took priority over this catch-all. These four entries were
// simply never deleted after that, so they'd been dead, unreachable code
// silently describing already-shipped features as "Coming in a later
// phase."
//
// COMING-SOON ELIMINATION: 'audit-logs' removed the same way — it now has
// a real route (AdminAuditLogs) backed by a real GET /admin/audit-logs API.
const SECTIONS = {
  settings: {
    title: 'Admin Settings',
    icon: Settings,
    description: 'Your account, security, and how the platform reaches you.',
  },
};

// Quick shortcuts surfaced on the settings hero — the tools an
// administrator visiting their own account page is most likely to want
// next, rather than a donor-style "Edit public profile" link (admins
// don't have one).
const QUICK_LINKS = [
  { label: 'Manage users', icon: Users, path: '/admin/users' },
  { label: 'Reports queue', icon: Flag, path: '/admin/reports' },
  { label: 'Audit log', icon: ScrollText, path: '/admin/audit-logs' },
];

/**
 * AdminSectionPage — shell for the /admin/:section catch-all. Currently
 * only 'settings' is a real, wired-up destination (Profile Photo,
 * Security, Notifications, Appearance — the latter three are the same
 * shared components donor/volunteer settings use); any other slug
 * redirects back to the admin overview.
 */
export function AdminSectionPage() {
  const { section } = useParams();
  const config = SECTIONS[section];
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('security');

  if (!config) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoUploading(true);
    try {
      const result = await profileApi.uploadPhoto(file);
      if (result.success) {
        updateUser(result.data.user);
        toast.success('Profile photo updated.');
      } else {
        toast.error(result.message || 'Failed to upload photo.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  // COMING-SOON ELIMINATION: Security/Notifications/Appearance used to be
  // one generic <ComingSoon> panel below the (real) Profile Photo section.
  // All three are now real, reusing the exact same components the
  // donor/volunteer settings page renders — see components/dashboard/
  // settings/ for why each one was already role-agnostic. Profile Photo
  // moved into the hero banner below as an inline edit rather than its
  // own tab, since it's a single control, not a settings panel.
  const tabs = [
    { id: 'security', label: 'Security & Passwords', icon: Lock, desc: 'Password, sessions & device security' },
    { id: 'notifications', label: 'Notifications & Alerts', icon: Bell, desc: 'Email, SMS & push notification preferences' },
    { id: 'appearance', label: 'Appearance & Theme', icon: Moon, desc: 'Light, dark & interface theme settings' },
  ];

  const joinedYear = user?.created_at ? new Date(user.created_at).getFullYear() : null;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Top title bar */}
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">{config.title}</h1>
          <p className="text-xs text-text-secondary mt-0.5">{config.description}</p>
        </div>

        {/* Hero: identity + inline photo edit + admin quick links */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 dark:from-violet-900 dark:via-purple-950 dark:to-indigo-950 shadow-pb-elevated p-6 md:p-8 text-white">
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-pink-400/20 blur-3xl" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 z-10 relative">
            <div className="relative shrink-0">
              <Avatar item={user} tone="dash" className="w-16 h-16 text-xl border-2 border-white/30 shadow-md" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                aria-label="Change profile photo"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white text-violet-700 flex items-center justify-center shadow-md border-2 border-violet-600 hover:scale-105 transition-all disabled:opacity-60"
              >
                {photoUploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={13} />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-white">{user?.name || 'Administrator'}</h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-white/20 border border-white/30 backdrop-blur-sm text-white flex items-center gap-1 uppercase tracking-wider">
                  <ShieldCheck size={12} /> System Admin
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5 truncate">{user?.email}</p>
              {joinedYear && (
                <p className="text-xs text-white/70 mt-1 font-medium">Administering PortionBridge since {joinedYear}</p>
              )}
            </div>
          </div>

          {/* Quick links row */}
          <div className="flex flex-wrap gap-2.5 mt-6 z-10 relative pt-4 border-t border-white/15">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-md text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95"
                >
                  <Icon size={14} className="text-white" />
                  {link.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile horizontal tabs */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

        {/* Desktop sidebar + content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="hidden lg:block lg:col-span-4">
            <div className="bg-surface rounded-2xl border border-border p-3 shadow-sm space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-dash-primary-soft text-dash-primary shadow-sm'
                        : 'text-text-secondary hover:bg-surface-hover'
                    } focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2`}
                    aria-label={`Switch to ${tab.label}`}
                    aria-selected={isSelected}
                    role="tab"
                  >
                    <Icon size={18} />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-[11px] opacity-70">{tab.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-8">
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'appearance' && <AppearanceSettings />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
