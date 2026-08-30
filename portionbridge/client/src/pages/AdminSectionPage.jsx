import { useParams, Navigate } from 'react-router-dom';
import {
  ScrollText,
  Settings,
} from 'lucide-react';
import { DashboardLayout, ComingSoon } from '../components/dashboard';

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
// PHASE 11: 'live-operations', 'attention-center', 'reports', and 'analytics'
// were removed as they now have dedicated routes (AdminLiveOperations,
// AdminAttentionCenter, AdminReports, AdminAnalytics) in App.jsx.
// The catch-all /admin/:section route now only handles remaining
// unimplemented sections (audit-logs, settings).
const SECTIONS = {
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

  if (!config) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">{config.title}</h1>
        </div>
        <ComingSoon icon={config.icon} title={config.title} description={config.description} />
      </div>
    </DashboardLayout>
  );
}
