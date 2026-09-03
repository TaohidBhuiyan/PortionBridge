import { Avatar } from '../common/Avatar';

/**
 * ProfileCard — a visually prominent identity anchor for the top of each
 * role's dashboard (Donor/Volunteer/Admin), replacing the old thin
 * "greeting bar with a tiny initials circle" header. Purely presentational:
 * every role's dashboard page supplies its own real user object, role
 * label, and stat pills (label/value pairs already computed from real
 * API data) — this component never fetches or invents anything itself.
 *
 * `tone` only changes the background treatment (a subtle gradient/tint),
 * giving Donor/Volunteer/Admin a slightly different personality while
 * sharing the exact same structure and design tokens:
 *   - 'donor'     → soft sky-blue tint (friendly)
 *   - 'volunteer' → deeper solid brand tint (operational)
 *   - 'admin'     → neutral surface, minimal color (professional/control-center)
 */
export function ProfileCard({ user, roleLabel, tone = 'donor', stats = [], action }) {
  const displayName = user?.name || 'User';

  const toneClasses = {
    donor: 'bg-gradient-to-br from-dash-primary-soft via-surface to-surface border-border/50',
    volunteer: 'bg-gradient-to-br from-dash-primary/10 via-surface to-surface border-dash-primary/20',
    admin: 'bg-surface border-border',
  }[tone] || 'bg-surface border-border';

  return (
    <div className={`rounded-xl border p-5 h-full flex flex-col ${toneClasses}`}>
      <div className="flex items-start gap-4">
        <Avatar item={user} tone="dash" className="w-16 h-16 text-xl shrink-0 shadow-pb-card" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-text-primary truncate">{displayName}</p>
          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-dash-primary-soft text-dash-primary">
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
