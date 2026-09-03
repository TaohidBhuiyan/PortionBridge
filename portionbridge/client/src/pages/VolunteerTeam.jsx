import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Users,
  Crown,
  Calendar,
  Megaphone,
  CheckCircle2,
  Loader2,
  Utensils,
  Shirt,
  Package,
  UserPlus,
  LogOut,
  MoreVertical,
  Search,
  UserCheck,
  Navigation,
  ExternalLink,
  ArrowLeftRight,
  UserMinus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuthSocket } from '../context/SocketContext';
import { teamApi } from '../services/teamApi';
import { useTeamRoom } from '../hooks/useTeamRoom';
import { Avatar } from '../components/common/Avatar';
import { StatusBadge } from '../components/donation/StatusBadge';
import { EmptyState } from '../components/dashboard/EmptyState';
import { ErrorState } from '../components/dashboard/ErrorState';
import { SkeletonCard } from '../components/dashboard/skeletons';
import { AnnouncementComposer } from '../components/team/AnnouncementComposer';
import { InviteMemberModal } from '../components/team/InviteMemberModal';
import { ConfirmActionModal } from '../components/common/ConfirmActionModal';

// Buckets purely for display grouping — no invented metrics, just a
// client-side partition of the real donation.status values already
// returned by GET /donations/team/:teamId.
const ACTIVE_STATUSES = new Set(['accepted', 'scheduled', 'on_the_way', 'picked_up']);

/**
 * VolunteerTeam — PHASE 4/5. "My Team" page: overview, members, leader
 * identification, pending invitations, team missions/activity, and (for
 * the team leader) an announcement composer. Phase 5 adds leader-only
 * team management actions (invite, remove, transfer leadership) and a
 * leave-team action for non-leader members.
 *
 * Data sources — all existing endpoints, reached via teamApi.js /
 * donationApi's team route:
 *   - GET /teams/my            → team overview + members (Phase 4 fixed a
 *                                 route-ordering bug that made this 400)
 *   - GET /teams/my/invitations → pending invitations for this user
 *   - GET /donations/team/:id   → team's donations, bucketed client-side
 *                                 into active/completed for the Activity
 *                                 section (Phase 4 also fixed a missing
 *                                 membership check on this endpoint)
 *   - POST /teams/:id/invite   → invite member by email (Phase 5)
 *   - DELETE /teams/:id/members/:memberId → remove member (Phase 5)
 *   - PATCH /teams/:id/members/:memberId/transfer → transfer leadership (Phase 5)
 *   - DELETE /teams/my/leave   → leave team (Phase 5)
 */
export function VolunteerTeam() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useAuthSocket();

  const [team, setTeam] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  // PHASE 5: team management modals and action states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Refresh trigger for post-action reloads (accept invitation, send announcement)
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // PHASE — Team Operations Workspace: search/filter over the already-
  // fetched team.members array (no new API — the full member list is
  // already loaded by GET /teams/my) and a single open-menu tracker for
  // the per-member actions dropdown.
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('all');
  const [openMenuFor, setOpenMenuFor] = useState(null);

  useEffect(() => {
    const loadTeamData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch team info first
        const teamResult = await teamApi.getMyTeam();
        
        if (teamResult.success && teamResult.data) {
          setTeam(teamResult.data);

          // If on a team, fetch donations via donationApi's team route
          const donationsResult = await teamApi.getTeamDonations(teamResult.data.id);
          if (donationsResult.success) {
            setDonations(donationsResult.data.donations || []);
          }
        } else {
          // No team or error — treat as no team for the UI
          setTeam(null);
          setDonations([]);
        }

        // Fetch invitations regardless of team status
        const invitationsResult = await teamApi.getMyInvitations();
        if (invitationsResult.success) {
          setInvitations(invitationsResult.data.invitations || []);
        }
      } catch {
        setError('Failed to load team information. Please try again.');
        setTeam(null);
        setDonations([]);
        setInvitations([]);
      } finally {
        setLoading(false);
      }
    };

    loadTeamData();
  }, [refreshTrigger]);

  // Close the member actions menu on outside click.
  useEffect(() => {
    if (!openMenuFor) return;
    const handleClick = () => setOpenMenuFor(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [openMenuFor]);

  const handleAcceptInvitation = async (invitationId) => {
    if (acceptingId) return;
    setAcceptingId(invitationId);

    const result = await teamApi.acceptInvitation(invitationId);

    if (result.success) {
      toast.success('Invitation accepted! You are now a team member.');
      setRefreshTrigger(t => t + 1);
    } else if (result.status === 409) {
      toast.error('This invitation is no longer available.');
      setRefreshTrigger(t => t + 1);
    } else {
      toast.error(result.error || 'Failed to accept invitation.');
    }

    setAcceptingId(null);
  };

  const handleDeclineInvitation = async (invitationId) => {
    const result = await teamApi.declineInvitation(invitationId);

    if (result.success) {
      toast.success('Invitation declined.');
      setRefreshTrigger(t => t + 1);
    } else {
      toast.error(result.error || 'Failed to decline invitation.');
    }
  };

  const handleSendAnnouncement = async (message) => {
    setSendingAnnouncement(true);

    if (!socket) {
      toast.error('Connection not available. Please try again.');
      setSendingAnnouncement(false);
      return;
    }

    socket.emit('send_team_announcement', { teamId: team.id, message }, (ack) => {
      if (ack?.success) {
        toast.success('Announcement sent to your team.');
        setShowAnnouncementModal(false);
      } else {
        toast.error(ack?.message || 'Failed to send announcement.');
      }
      setSendingAnnouncement(false);
    });
  };

  // PHASE 5: Invite member
  const handleInviteMember = async (email) => {
    setInviting(true);
    const result = await teamApi.inviteMember(team.id, email);
    if (result.success) {
      toast.success('Invitation sent successfully.');
      setShowInviteModal(false);
      setRefreshTrigger(t => t + 1);
    } else {
      toast.error(result.error || 'Failed to send invitation.');
    }
    setInviting(false);
  };

  // PHASE 5: Remove member
  const handleRemoveMember = async (memberUserId, memberName) => {
    setActionLoading(true);
    const result = await teamApi.removeMember(team.id, memberUserId);
    if (result.success) {
      toast.success(`${memberName} removed from the team.`);
      setConfirmModal(null);
      setRefreshTrigger(t => t + 1);
    } else {
      toast.error(result.error || 'Failed to remove member.');
    }
    setActionLoading(false);
  };

  // PHASE 5: Transfer leadership
  const handleTransferLeadership = async (memberUserId, memberName) => {
    setActionLoading(true);
    const result = await teamApi.transferLeadership(team.id, memberUserId);
    if (result.success) {
      toast.success(`Leadership transferred to ${memberName}.`);
      setConfirmModal(null);
      setRefreshTrigger(t => t + 1);
    } else {
      toast.error(result.error || 'Failed to transfer leadership.');
    }
    setActionLoading(false);
  };

  // PHASE 5: Leave team
  const handleLeaveTeam = async () => {
    setActionLoading(true);
    const result = await teamApi.leaveTeam();
    if (result.success) {
      toast.success('You have left the team.');
      setConfirmModal(null);
      setRefreshTrigger(t => t + 1);
    } else {
      toast.error(result.error || 'Failed to leave team.');
    }
    setActionLoading(false);
  };

  // Real-time team room — join when on a team, leave when not
  const isLeader = team?.leader_id === user?.id;
  useTeamRoom(team?.id, {
    onAnnouncement: () => {
      // Refresh donations/activity when an announcement arrives
      setRefreshTrigger(t => t + 1);
    },
    onTeamActivity: () => {
      // Refresh donations/activity when team activity arrives
      setRefreshTrigger(t => t + 1);
    },
  });

  const activeDonations = donations.filter(d => ACTIVE_STATUSES.has(d.status));
  const completedDonations = donations.filter(d => d.status === 'completed');

  // Real, existing data only: donation_requests.assigned_member_id stores
  // the assigned volunteer's user_id (same convention as donor_id/
  // volunteer_id elsewhere), so this is a genuine cross-reference — not a
  // fabricated "current mission" — built from the team's own active
  // donations, keyed by member user_id for O(1) lookup per card.
  const missionByUserId = new Map();
  activeDonations.forEach((d) => {
    const assignedTo = d.assigned_member_id || d.volunteer_id;
    if (assignedTo) missionByUserId.set(assignedTo, d);
  });

  const totalMembers = team.members?.length || 0;
  const onMissionCount = (team.members || []).filter((m) => missionByUserId.has(m.user_id)).length;
  const availableCount = totalMembers - onMissionCount;

  const filteredMembers = (team.members || []).filter((member) => {
    const q = memberSearch.trim().toLowerCase();
    const matchesSearch = !q
      || member.name?.toLowerCase().includes(q)
      || String(member.user_id).includes(q);
    if (!matchesSearch) return false;

    if (memberFilter === 'leader') return member.role === 'leader';
    if (memberFilter === 'mission') return missionByUserId.has(member.user_id);
    if (memberFilter === 'available') return !missionByUserId.has(member.user_id);
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-dash-primary-soft flex items-center justify-center shrink-0">
              <Users size={20} className="text-dash-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
                My Team
              </h1>
              <p className="text-text-secondary text-sm mt-0.5">
                Manage your team and view team activity
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard count={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-dash-primary-soft flex items-center justify-center shrink-0">
              <Users size={20} className="text-dash-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
                My Team
              </h1>
            </div>
          </div>
        </div>
        <ErrorState
          title="Failed to load team information"
          message={error}
          onRetry={() => setRefreshTrigger(t => t + 1)}
        />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-dash-primary-soft flex items-center justify-center shrink-0">
              <Users size={20} className="text-dash-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
                My Team
              </h1>
            </div>
          </div>
        </div>

        <EmptyState
          icon={Users}
          title="You're not on a team yet"
          description="Join a team to collaborate with other volunteers on donation missions. Team invitations will appear here when a team leader invites you."
          showAction={false}
        />

        {invitations.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Pending Invitations</h2>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="bg-surface rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar item={invitation.team} tone="dash" className="w-10 h-10" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{invitation.team?.name}</p>
                        <p className="text-xs text-text-secondary">Invited by {invitation.inviter?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        disabled={acceptingId === invitation.id}
                        className="px-3 py-1.5 rounded-lg bg-dash-primary text-white text-xs font-medium hover:bg-dash-primary-hover transition-colors disabled:opacity-50"
                      >
                        {acceptingId === invitation.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          'Accept'
                        )}
                      </button>
                      <button
                        onClick={() => handleDeclineInvitation(invitation.id)}
                        className="px-3 py-1.5 rounded-lg border border-border text-text-primary text-xs font-medium hover:bg-surface-hover transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-dash-primary-soft flex items-center justify-center shrink-0">
              <Users size={20} className="text-dash-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
                {team.name}
              </h1>
              <p className="text-text-secondary text-sm mt-0.5">
                {team.description || 'Team overview and activity'}
              </p>
            </div>
          </div>
          {isLeader && (
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dash-primary text-white text-sm font-medium hover:bg-dash-primary-hover transition-colors"
            >
              <Megaphone size={16} />
              Send Announcement
            </button>
          )}
        </div>
      </div>

      {/* Team stats — real, derived from the already-loaded members + team donations, no invented numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 bg-surface rounded-lg border border-border/50 divide-x divide-y sm:divide-y-0 divide-border/50 overflow-hidden mb-6">
        <div className="flex items-center gap-2.5 px-4 py-3">
          <Users size={15} className="shrink-0 text-dash-primary" />
          <div className="min-w-0">
            <p className="text-lg font-semibold text-text-primary leading-tight tabular-nums">{totalMembers}</p>
            <p className="text-[11px] font-medium text-text-secondary truncate">Total Members</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-3">
          <UserCheck size={15} className="shrink-0 text-success" />
          <div className="min-w-0">
            <p className="text-lg font-semibold text-text-primary leading-tight tabular-nums">{availableCount}</p>
            <p className="text-[11px] font-medium text-text-secondary truncate">Available</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-3">
          <Navigation size={15} className="shrink-0 text-warning" />
          <div className="min-w-0">
            <p className="text-lg font-semibold text-text-primary leading-tight tabular-nums">{onMissionCount}</p>
            <p className="text-[11px] font-medium text-text-secondary truncate">On a Mission</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-3">
          <Package size={15} className="shrink-0 text-info" />
          <div className="min-w-0">
            <p className="text-lg font-semibold text-text-primary leading-tight tabular-nums">{activeDonations.length}</p>
            <p className="text-[11px] font-medium text-text-secondary truncate">Ongoing Missions</p>
          </div>
        </div>
      </div>

      {/* Team Members — full-width operations workspace: search, filter, premium member cards */}
      <div className="bg-surface rounded-lg border border-border p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Team Members</h2>
          {isLeader && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-dash-primary-soft text-dash-primary text-xs font-medium hover:bg-dash-primary-soft/80 transition-colors"
            >
              <UserPlus size={12} />
              Invite
            </button>
          )}
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" aria-hidden="true" />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search by volunteer name or ID..."
              aria-label="Search team members"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary transition-all"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto" role="tablist" aria-label="Filter team members">
            {[
              { key: 'all', label: 'All' },
              { key: 'leader', label: 'Leader' },
              { key: 'mission', label: 'On Mission' },
              { key: 'available', label: 'Available' },
            ].map((f) => (
              <button
                key={f.key}
                role="tab"
                aria-selected={memberFilter === f.key}
                onClick={() => setMemberFilter(f.key)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  memberFilter === f.key
                    ? 'bg-dash-primary text-white'
                    : 'bg-page border border-border/50 text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-8">
            No members match your search or filter.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredMembers.map((member, index) => {
              const isThisMemberLeader = member.role === 'leader';
              const isThisMemberCurrentUser = member.user_id === user?.id;
              const canManageThisMember = isLeader && !isThisMemberLeader && !isThisMemberCurrentUser;
              const mission = missionByUserId.get(member.user_id);
              const menuOpen = openMenuFor === member.id;

              return (
                <div
                  key={member.id}
                  style={{ animation: 'rowIn 0.25s ease backwards', animationDelay: `${Math.min(index, 8) * 30}ms` }}
                  className={`relative rounded-lg border p-3.5 transition-[box-shadow,transform] duration-150 hover:shadow-pb-card hover:-translate-y-0.5 ${
                    isThisMemberLeader ? 'border-dash-primary/30 bg-dash-primary-soft/40' : 'border-border/50 bg-page'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <Avatar item={member} tone="dash" className="w-9 h-9 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-text-primary truncate">{member.name}</p>
                        {isThisMemberLeader && <Crown size={13} className="text-dash-primary shrink-0" />}
                      </div>
                      <p className="text-[11px] text-text-secondary">
                        ID #{member.user_id} &middot; {isThisMemberLeader ? 'Team Leader' : 'Member'}
                        {isThisMemberCurrentUser && ' (You)'}
                      </p>
                    </div>
                    {(canManageThisMember || !isThisMemberCurrentUser) && (
                      <div className="relative shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenMenuFor(menuOpen ? null : member.id); }}
                          className="p-1 rounded-md hover:bg-surface-hover text-text-secondary transition-colors"
                          aria-label={`Actions for ${member.name}`}
                          aria-expanded={menuOpen}
                        >
                          <MoreVertical size={14} />
                        </button>
                        {menuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{ animation: 'dropdownIn 0.15s ease' }}
                            className="absolute right-0 top-full mt-1 w-44 bg-surface rounded-lg shadow-pb-elevated border border-border py-1 z-20"
                          >
                            <button
                              onClick={() => { navigate(`/volunteers/${member.user_id}`); setOpenMenuFor(null); }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                            >
                              <ExternalLink size={12} /> View Profile
                            </button>
                            {mission && (
                              <button
                                onClick={() => { navigate(`/donations/${mission.id}`); setOpenMenuFor(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                              >
                                <Navigation size={12} /> View Mission
                              </button>
                            )}
                            {canManageThisMember && (
                              <>
                                <div className="my-1 border-t border-border" />
                                <button
                                  onClick={() => {
                                    setConfirmModal({ type: 'transfer', memberUserId: member.user_id, memberName: member.name });
                                    setOpenMenuFor(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                                >
                                  <ArrowLeftRight size={12} /> Transfer Leadership
                                </button>
                                <button
                                  onClick={() => {
                                    setConfirmModal({ type: 'remove', memberUserId: member.user_id, memberName: member.name });
                                    setOpenMenuFor(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-danger hover:bg-danger-soft transition-colors"
                                >
                                  <UserMinus size={12} /> Remove Member
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2.5 border-t border-border/50">
                    {mission ? (
                      <p className="text-[11px] text-warning font-medium truncate flex items-center gap-1">
                        <Navigation size={11} className="shrink-0" /> On mission: {mission.title || `Donation #${mission.id}`}
                      </p>
                    ) : (
                      <p className="text-[11px] text-success font-medium flex items-center gap-1">
                        <UserCheck size={11} className="shrink-0" /> Available
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Team Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Team Overview */}
          <div className="bg-surface rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Team Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Crown size={16} className="text-dash-primary" />
                <span className="text-text-secondary">Leader:</span>
                <span className="text-text-primary font-medium">{team.leader?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users size={16} className="text-dash-primary" />
                <span className="text-text-secondary">Members:</span>
                <span className="text-text-primary font-medium">{team.member_count || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-dash-primary" />
                <span className="text-text-secondary">Created:</span>
                <span className="text-text-primary font-medium">
                  {new Date(team.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="bg-surface rounded-lg border border-border p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">Pending Invitations</h2>
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-start justify-between p-3 rounded-md bg-page border border-border">
                    <div className="flex items-center gap-2">
                      <Avatar item={invitation.team} tone="dash" className="w-8 h-8" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{invitation.team?.name}</p>
                        <p className="text-xs text-text-secondary">From {invitation.inviter?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        disabled={acceptingId === invitation.id}
                        className="px-2 py-1 rounded bg-dash-primary text-white text-xs font-medium hover:bg-dash-primary-hover transition-colors disabled:opacity-50"
                      >
                        {acceptingId === invitation.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          'Accept'
                        )}
                      </button>
                      <button
                        onClick={() => handleDeclineInvitation(invitation.id)}
                        className="px-2 py-1 rounded border border-border text-text-primary text-xs font-medium hover:bg-surface-hover transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PHASE 5: Leave Team button (non-leader only) */}
          {!isLeader && (
            <button
              onClick={() => setConfirmModal({ type: 'leave' })}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-danger text-danger text-sm font-medium hover:bg-danger-soft transition-colors"
            >
              <LogOut size={14} />
              Leave Team
            </button>
          )}
        </div>

        {/* Right Column - Team Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Missions */}
          {activeDonations.length > 0 && (
            <div className="bg-surface rounded-lg border border-border p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">Active Missions</h2>
              <div className="space-y-3">
                {activeDonations.map((donation) => (
                  <div
                    key={donation.id}
                    onClick={() => navigate(`/donations/${donation.id}`)}
                    className="flex items-start gap-3 p-3 rounded-md border border-border hover:border-dash-primary/30 hover:bg-surface-hover cursor-pointer transition-colors"
                  >
                    <div className="w-9 h-9 rounded-md bg-dash-primary-soft flex items-center justify-center shrink-0">
                      {donation.category === 'food' ? (
                        <Utensils size={16} className="text-dash-primary" />
                      ) : (
                        <Shirt size={16} className="text-dash-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="text-sm font-medium text-text-primary truncate">
                          {donation.title}
                        </h3>
                        <StatusBadge status={donation.status} size="small" />
                      </div>
                      {donation.description && (
                        <p className="text-xs text-text-secondary mb-2 line-clamp-2">{donation.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                        <Package size={10} />
                        {donation.quantity} {donation.quantity_unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Missions */}
          {completedDonations.length > 0 && (
            <div className="bg-surface rounded-lg border border-border p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">Completed Missions</h2>
              <div className="space-y-3">
                {completedDonations.map((donation) => (
                  <div
                    key={donation.id}
                    onClick={() => navigate(`/donations/${donation.id}`)}
                    className="flex items-start gap-3 p-3 rounded-md border border-border hover:border-dash-primary/30 hover:bg-surface-hover cursor-pointer transition-colors"
                  >
                    <div className="w-9 h-9 rounded-md bg-success-soft flex items-center justify-center shrink-0">
                      <CheckCircle2 size={16} className="text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="text-sm font-medium text-text-primary truncate">
                          {donation.title}
                        </h3>
                        <StatusBadge status={donation.status} size="small" />
                      </div>
                      {donation.description && (
                        <p className="text-xs text-text-secondary mb-2 line-clamp-2">{donation.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                        <Package size={10} />
                        {donation.quantity} {donation.quantity_unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Activity */}
          {activeDonations.length === 0 && completedDonations.length === 0 && (
            <div className="bg-surface rounded-lg border border-border p-5">
              <EmptyState
                icon={Package}
                title="No team activity yet"
                description="Team missions and activity will appear here once donations are assigned to your team."
                showAction={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* Announcement Composer Modal */}
      <AnnouncementComposer
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        onSend={handleSendAnnouncement}
        sending={sendingAnnouncement}
      />

      {/* PHASE 5: Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteMember}
        sending={inviting}
      />

      {/* PHASE 5: Confirm Action Modal (remove/transfer/leave) */}
      {confirmModal && (
        <ConfirmActionModal
          isOpen={!!confirmModal}
          onClose={() => setConfirmModal(null)}
          onConfirm={() => {
            if (confirmModal.type === 'remove') {
              handleRemoveMember(confirmModal.memberUserId, confirmModal.memberName);
            } else if (confirmModal.type === 'transfer') {
              handleTransferLeadership(confirmModal.memberUserId, confirmModal.memberName);
            } else if (confirmModal.type === 'leave') {
              handleLeaveTeam();
            }
          }}
          title={
            confirmModal.type === 'remove'
              ? 'Remove Team Member'
              : confirmModal.type === 'transfer'
              ? 'Transfer Leadership'
              : 'Leave Team'
          }
          message={
            confirmModal.type === 'remove'
              ? `Are you sure you want to remove ${confirmModal.memberName} from the team? They will lose access to all team activities.`
              : confirmModal.type === 'transfer'
              ? `Are you sure you want to transfer leadership to ${confirmModal.memberName}? You will become a regular member.`
              : 'Are you sure you want to leave this team? You will lose access to all team activities and missions.'
          }
          confirmLabel={
            confirmModal.type === 'remove'
              ? 'Remove Member'
              : confirmModal.type === 'transfer'
              ? 'Transfer Leadership'
              : 'Leave Team'
          }
          isLoading={actionLoading}
          tone={confirmModal.type === 'transfer' ? 'primary' : 'danger'}
        />
      )}
    </div>
  );
}
