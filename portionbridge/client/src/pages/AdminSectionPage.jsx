import { useState, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  FileText,
  ScrollText,
  Settings,
  Camera,
  Loader2,
} from 'lucide-react';
import { DashboardLayout, ComingSoon } from '../components/dashboard';
import { Avatar } from '../components/common/Avatar';
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
const SECTIONS = {
  'live-operations': {
    title: 'Live Operations',
    icon: Activity,
    description: 'A real-time view of active pickups and volunteer movement across zones. Coming in a later phase.',
  },
  'attention-center': {
    title: 'Attention Center',
    icon: AlertTriangle,
    description: 'Flagged donations, disputes, and items needing admin review will surface here.',
  },
  analytics: {
    title: 'Analytics',
    icon: BarChart3,
    description: 'Platform trends across donations, users, and impact over time.',
  },
  reports: {
    title: 'Reports',
    icon: FileText,
    description: 'Generate and export platform activity reports.',
  },
  'audit-logs': {
    title: 'Audit Logs',
    icon: ScrollText,
    description: 'A searchable trail of admin and system actions.',
  },
  settings: {
    title: 'Settings',
    icon: Settings,
    description: 'Platform-wide configuration and preferences.',
  },
};

/**
 * AdminSectionPage — shared shell for admin sidebar sections that aren't
 * implemented yet. Renders the real DashboardLayout/Sidebar/TopNavbar so
 * navigation feels complete, with a ComingSoon panel instead of fake data.
 * Unknown slugs redirect back to the admin overview.
 */
export function AdminSectionPage() {
  const { section } = useParams();
  const config = SECTIONS[section];
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState(null);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">{config.title}</h1>
        </div>

        {/* PHASE — Profile Picture Audit: admin had no page anywhere to set
            their own photo. This section is real (wired to the same
            upload endpoint every role uses) — the rest of "Settings"
            below is still the placeholder it always was. */}
        {section === 'settings' && (
          <div className="bg-surface rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Profile Photo</h2>
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

        <ComingSoon icon={config.icon} title={config.title} description={config.description} />
      </div>
    </DashboardLayout>
  );
}
