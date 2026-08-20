import { Activity, Users, HeartHandshake, Radio } from 'lucide-react';

function StatChip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 bg-surface rounded-lg border border-border/50 px-3 py-2">
      <div className="w-7 h-7 rounded-md bg-dash-primary-soft flex items-center justify-center shrink-0">
        <Icon size={14} className="text-dash-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary leading-none">{value}</p>
        <p className="text-[11px] text-text-secondary">{label}</p>
      </div>
    </div>
  );
}

/**
 * AdminLiveOpsSummary — at-a-glance counts for the Phase 6 Live
 * Operations Map. All real numbers derived from the same snapshot/socket
 * state the map itself renders — nothing here is a separate query.
 */
export function AdminLiveOpsSummary({ missionCount, volunteerCount, teamCount, liveCount }) {
  return (
    <div className="flex flex-wrap gap-2">
      <StatChip icon={Activity} label="Active Missions" value={missionCount} />
      <StatChip icon={Users} label="Active Volunteers" value={volunteerCount} />
      <StatChip icon={HeartHandshake} label="Teams Involved" value={teamCount} />
      <StatChip icon={Radio} label="Live Positions" value={liveCount} />
    </div>
  );
}