import { Avatar } from '../common/Avatar';

/**
 * ProfileCard — a visually prominent identity anchor for the top of each
 * role's dashboard (Donor/Volunteer/Admin), replacing the old thin
 * "greeting bar with a tiny initials circle" header. Purely presentational:
 * every role's dashboard page supplies its own real user object, role
 * label, and stat pills (label/value pairs already computed from real
 * API data) — this component never fetches or invents anything itself.
 *
 * `tone` changes the background treatment (a subtle gradient/tint) and
 * badge color, giving Donor/Volunteer/Admin distinct visual identities:
 *   - 'donor'     → rose pink tint (friendly, community-focused)
 *   - 'volunteer' → sky blue tint (operational, active)
 *   - 'admin'     → violet tint (professional, control-center)
 */
export function ProfileCard({ user, roleLabel, tone = 'donor', stats = [], action }) {
  const displayName = user?.name || 'User';

  const toneConfig = {
    donor: {
      card: 'bg-gradient-to-br from-donor-soft via-surface to-surface border-donor/20',
      badge: 'bg-donor-soft text-donor',
    },
    volunteer: {
      card: 'bg-gradient-to-br from-volunteer-soft via-surface to-surface border-volunteer/20',
      badge: 'bg-volunteer-soft text-volunteer',
    },
    admin: {
      card: 'bg-gradient-to-br from-admin-soft via-surface to-surface border-admin/20',
      badge: 'bg-admin-soft text-admin',
    },
  }[tone] || {
    card: 'bg-surface border-border',
    badge: 'bg-surface-hover text-text-secondary',
  };

  return (
    <div className={`rounded-xl border p-5 h-full flex flex-col ${toneConfig.card}`}>
      <div className="flex items-start gap-4">
        <Avatar item={user} tone="dash" className="w-16 h-16 text-xl shrink-0 shadow-pb-card" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-text-primary truncate">{displayName}</p>
          <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${toneConfig.badge}`}>
            {roleLabel}
          </span>
          {user?.email && (
            <p className="text-xs text-text-secondary truncate mt-1.5">{user.email}</p>
          )}
        </div>
      </div>

      {stats.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/50">
          {stats.map((s) => (
            <div key={s.label} className="min-w-0">
              <p className="text-base font-bold text-text-primary tabular-nums leading-tight truncate">{s.value}</p>
              <p className="text-[10px] text-text-secondary truncate">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {action && <div className="mt-4 pt-4 border-t border-border/50">{action}</div>}
    </div>
  );
}
