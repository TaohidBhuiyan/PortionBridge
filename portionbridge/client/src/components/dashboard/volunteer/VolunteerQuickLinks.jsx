import { useNavigate } from 'react-router-dom';
import { Users, History, Bell } from 'lucide-react';

const LINKS = [
  { label: 'My Team', description: 'Members, leader, announcements', icon: Users, path: '/volunteer/team' },
  { label: 'Mission History', description: 'Everything you have been assigned', icon: History, path: '/volunteer/history' },
  { label: 'Notifications', description: 'Team and mission updates', icon: Bell, path: '/notifications' },
];

/**
 * VolunteerQuickLinks — PHASE 5. A small, static row of links to pages
 * that already exist (Team, History, Notifications) but don't have their
 * own dashboard widget. Deliberately lightweight — no data fetching, no
 * loading/error states needed since it's just navigation — so it doesn't
 * compete with or complicate the real widgets above it (Welcome,
 * Statistics, Active Mission, Upcoming Missions), which stay untouched.
 */
export function VolunteerQuickLinks() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {LINKS.map(({ label, description, icon: Icon, path }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border/50 hover:border-dash-primary/30 hover:bg-surface-hover transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-md bg-dash-primary-soft flex items-center justify-center shrink-0">
            <Icon size={16} className="text-dash-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary">{label}</p>
            <p className="text-[11px] text-text-secondary truncate">{description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
