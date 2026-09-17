import { useNavigate } from 'react';
import { Users, History, Bell, Trophy, HelpCircle, ArrowRight } from 'lucide-react';

const LINKS = [
  { label: 'My Team', description: 'Roster & announcements', icon: Users, path: '/volunteer/team', color: 'from-blue-500 to-indigo-600' },
  { label: 'Mission History', description: 'Rescues & impact log', icon: History, path: '/volunteer/history', color: 'from-emerald-500 to-teal-600' },
  { label: 'Leaderboard', description: 'Community rankings', icon: Trophy, path: '/volunteer/leaderboard', color: 'from-amber-500 to-orange-600' },
  { label: 'Help Center', description: 'FAQs & guidelines', icon: HelpCircle, path: '/volunteer/help', color: 'from-purple-500 to-pink-600' },
  { label: 'Notifications', description: 'Alerts & updates', icon: Bell, path: '/notifications', color: 'from-sky-500 to-blue-600' },
];

export function VolunteerQuickLinks() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {LINKS.map(({ label, description, icon: Icon, path, color }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          className="pb-glass-card pb-hover-lift flex items-center justify-between p-3.5 rounded-2xl border border-border/60 hover:border-dash-primary/40 shadow-sm text-left group transition-all duration-200"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200`}>
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-dash-primary transition-colors truncate">
                {label}
              </p>
              <p className="text-[11px] text-text-muted truncate mt-0.5">{description}</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-text-muted group-hover:text-dash-primary group-hover:translate-x-1 transition-all shrink-0 ml-1" />
        </button>
      ))}
    </div>
  );
}
