import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Crown, Users, Mail, Calendar, Package, Megaphone, UserMinus, Repeat, UserPlus,
} from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { SkeletonCard } from '../components/dashboard/skeletons';
import { StatusBadge } from '../components/donation/StatusBadge';
import { adminApi } from '../services/adminApi';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(value) {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

const ACTIVITY_META = {
  team_member_removed: { label: 'was removed from the team', icon: UserMinus },
  team_leadership_transferred: { label: 'became the new team leader', icon: Crown },
  team_invitation_accepted: { label: 'joined the team', icon: UserPlus },
};

function MissionRow({ mission, onClick }) {
  return (
    <li onClick={onClick} className="py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-hover rounded-md px-2 -mx-2 transition-colors">
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-primary truncate max-w-[240px]">
          {mission.title || `${mission.category} donation`}
        </p>
        {mission.pickup_location && <p className="text-[11px] text-text-secondary truncate max-w-[240px]">{mission.pickup_location}</p>}
      </div>
      <StatusBadge status={mission.status} size="small" />
    </li>
  );
}

/**
 * AdminTeamDetail — single team's admin view (Phase 4): leader, members,
 * active/completed missions, and a merged activity feed.
 *
 * Backed by GET /admin/teams/:id (admin.service.js#getTeamDetail, new
 * this phase). Reuses teamMemberModel.findByTeamId and
 * donationModel.findByTeamId server-side unchanged. The activity feed
 * merges the existing audit_logs rows team.service.js already writes on
 * membership changes with the existing team_announcement notifications
 * (see "Reuse existing notification/team announcement infrastructure").
 */
export function AdminTeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await adminApi.getTeam(id);
      if (cancelled) return;
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [id, refreshTrigger]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <SkeletonCard count={1} />
          <SkeletonCard count={4} />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorState title="Failed to load team" message={error} onRetry={() => setRefreshTrigger((t) => t + 1)} />
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const { team, members = [], activeMissions = [], completedMissions = [], activity = [] } = data;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <button
          onClick={() => navigate('/admin/volunteers-teams')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back to Volunteers & Teams
        </button>

        {/* Header */}
        <div className="bg-surface rounded-lg border border-border/50 p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-lg bg-dash-primary-soft flex items-center justify-center shrink-0">
              <Users size={22} className="text-dash-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">{team.name}</h1>
              {team.description && <p className="text-sm text-text-secondary">{team.description}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <Crown size={14} className="text-warning shrink-0" />
              <button onClick={() => navigate(`/admin/volunteers/${team.leader_id}`)} className="text-dash-primary hover:underline">
                {team.leader_name || 'Unknown'}
              </button>
              <span className="text-text-secondary">(Leader)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="text-text-secondary shrink-0" />
              <span className="text-text-primary">{team.leader_email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-text-secondary shrink-0" />
              <span className="text-text-primary">Created {formatDate(team.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Members */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Members ({members.length})</h2>
          <div className="bg-surface rounded-lg border border-border/50 p-4">
            <ul className="divide-y divide-border/50">
              {members.map((m) => (
                <li
                  key={m.id}
                  onClick={() => navigate(`/admin/volunteers/${m.user_id}`)}
                  className="py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-hover rounded-md px-2 -mx-2 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-dash-primary-soft flex items-center justify-center shrink-0">
                      {m.role === 'leader' ? <Crown size={12} className="text-warning" /> : <Users size={12} className="text-dash-primary" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate max-w-[200px]">{m.name}</p>
                      <p className="text-[11px] text-text-secondary truncate max-w-[200px]">{m.email}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-text-secondary capitalize">{m.role}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Missions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Active Missions ({activeMissions.length})</h2>
            <div className="bg-surface rounded-lg border border-border/50 p-4">
              {activeMissions.length === 0 ? (
                <EmptyState icon={Package} title="No active missions" showAction={false} size="small" />
              ) : (
                <ul className="divide-y divide-border/50">
                  {activeMissions.map((m) => (
                    <MissionRow key={m.id} mission={m} onClick={() => navigate(`/admin/donations/${m.id}`)} />
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Completed Missions ({completedMissions.length})</h2>
            <div className="bg-surface rounded-lg border border-border/50 p-4">
              {completedMissions.length === 0 ? (
                <EmptyState icon={Package} title="No completed missions yet" showAction={false} size="small" />
              ) : (
                <ul className="divide-y divide-border/50">
                  {completedMissions.slice(0, 10).map((m) => (
                    <MissionRow key={m.id} mission={m} onClick={() => navigate(`/admin/donations/${m.id}`)} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Team activity */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Team Activity</h2>
          <div className="bg-surface rounded-lg border border-border/50 p-4">
            {activity.length === 0 ? (
              <EmptyState icon={Repeat} title="No recent activity" description="Membership changes and announcements will appear here." showAction={false} size="small" />
            ) : (
              <ul className="space-y-3">
                {activity.map((entry) => {
                  if (entry.kind === 'announcement') {
                    return (
                      <li key={entry.id} className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-dash-primary-soft flex items-center justify-center shrink-0 mt-0.5">
                          <Megaphone size={13} className="text-dash-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-text-primary">
                            <span className="font-medium">Announcement:</span> {entry.message}
                          </p>
                          <p className="text-[11px] text-text-secondary">{timeAgo(entry.createdAt)}</p>
                        </div>
                      </li>
                    );
                  }
                  const meta = ACTIVITY_META[entry.action] || { label: entry.action.replace(/_/g, ' '), icon: Repeat };
                  const Icon = meta.icon;
                  return (
                    <li key={entry.id} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-dash-primary-soft flex items-center justify-center shrink-0 mt-0.5">
                        <Icon size={13} className="text-dash-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-text-primary">
                          <span className="font-medium">{entry.actorName || 'Someone'}</span> {meta.label}
                        </p>
                        <p className="text-[11px] text-text-secondary">{timeAgo(entry.createdAt)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
