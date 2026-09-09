import { useState, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  Settings,
  Camera,
  Loader2,
  Image as ImageIcon,
  Lock,
  Bell,
  Moon,
} from 'lucide-react';
import { DashboardLayout } from '../components/dashboard';
import { Avatar } from '../components/common/Avatar';
import { SecuritySettings } from '../components/dashboard/settings/SecuritySettings';
import { NotificationSettings } from '../components/dashboard/settings/NotificationSettings';
import { AppearanceSettings } from '../components/dashboard/settings/AppearanceSettings';
import { profileApi } from '../services/profileApi';
import { useAuth } from '../context/AuthContext';

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
    title: 'Settings',
    icon: Settings,
    description: 'Platform-wide configuration and preferences.',
  },
};

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
  const fileInputRef = useRef(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const [activeTab, setActiveTab] = useState('photo');

  if (!config) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const result = await profileApi.uploadPhoto(file);
      if (result.success) {
        updateUser(result.data.user);
      } else {
        setPhotoError(result.message || 'Failed to upload photo.');
      }
    } catch (err) {
      setPhotoError(err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  // COMING-SOON ELIMINATION: Security/Notifications/Appearance used to be
  // one generic <ComingSoon> panel below the (real) Profile Photo section.
  // All three are now real, reusing the exact same components the
  // donor/volunteer settings page renders — see components/dashboard/
  // settings/ for why each one was already role-agnostic.
  const tabs = [
    { id: 'photo', label: 'Profile Photo', icon: ImageIcon },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Moon },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">{config.title}</h1>
          <p className="text-sm text-text-secondary">{config.description}</p>
        </div>

        <div className="flex gap-6">
          <div className="w-48 flex-shrink-0">
            <div className="bg-surface rounded-2xl border border-border p-2 shadow-sm">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-dash-primary-soft text-dash-primary shadow-sm'
                        : 'text-text-secondary hover:bg-surface-hover'
                    } focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2`}
                    aria-label={`Switch to ${tab.label}`}
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

          <div className="flex-1">
            {activeTab === 'photo' && (
              <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Profile Photo</h2>
                <div className="flex items-center gap-4">
                  <Avatar item={user} tone="dash" className="w-16 h-16 text-xl" />
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoUploading}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-page border border-border text-text-primary rounded-lg hover:bg-surface-hover transition-colors text-sm font-medium disabled:opacity-60"
                    >
                      {photoUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                      {photoUploading ? 'Uploading...' : 'Change Photo'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <p className="text-xs text-text-secondary mt-1.5">JPG, PNG, or WEBP. Max 5MB.</p>
                    {photoError && <p className="text-xs text-danger mt-1">{photoError}</p>}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'appearance' && <AppearanceSettings />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
