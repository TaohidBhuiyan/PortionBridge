import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
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
  Plus,
  Send,
  Clock,
  MapPin,
  Building,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { DashboardLayout } from '../components/dashboard';
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
import { BaseLocationCard } from '../components/dashboard/volunteer';

const ACTIVE_STATUSES = new Set(['accepted', 'scheduled', 'on_the_way', 'picked_up']);

export function VolunteerTeam() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useAuthSocket();

  const [team, setTeam] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Action States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [creatingTeam, setCreatingTeam] = useState(false);

  const [showJoinModal, setShowJoinModal] = useState(null); // Selected team object
  const [joinMessage, setJoinMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  const [cancellingRequestId, setCancellingRequestId] = useState(null);
  const [acceptingJoinRequestId, setAcceptingJoinRequestId] = useState(null);
  const [rejectingJoinRequestId, setRejectingJoinRequestId] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Discovery / Filters
  const [noTeamTab, setNoTeamTab] = useState('discover'); // 'discover' | 'requests' | 'invitations'
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [searchingTeams, setSearchingTeams] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Operations Workspace (when in team)
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('all');
  const [openMenuFor, setOpenMenuFor] = useState(null);

  useEffect(() => {
    const loadTeamData = async () => {
      setLoading(true);
      setError(null);

      try {
        const teamResult = await teamApi.getMyTeam();

        if (teamResult.success && teamResult.data) {
          setTeam(teamResult.data);

          // Fetch team donations
          const donationsResult = await teamApi.getTeamDonations(teamResult.data.id);
          if (donationsResult.success) {
            setDonations(donationsResult.data.donations || []);
          }

          // If leader, fetch incoming join requests
          if (teamResult.data.leader_id === user?.id) {
            const requestsResult = await teamApi.listTeamJoinRequests(teamResult.data.id);
            if (requestsResult.success) {
              setIncomingRequests(requestsResult.data.requests || []);
            }
          }
        } else {
          setTeam(null);
          setDonations([]);

          // No team — fetch discoverable teams and user's sent join requests
          const [teamsRes, requestsRes] = await Promise.all([
            teamApi.searchTeams(teamSearchTerm),
            teamApi.getMyJoinRequests(),
          ]);

          if (teamsRes.success) {
            setAvailableTeams(teamsRes.data.teams || []);
          }
          if (requestsRes.success) {
            setMyRequests(requestsRes.data.requests || []);
          }
        }

        // Fetch received invitations
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
  }, [refreshTrigger, teamSearchTerm, user?.id]);

  // Handle Team Search for Discovery
  const handleSearchTeams = async (e) => {
    if (e) e.preventDefault();
    setSearchingTeams(true);
    const result = await teamApi.searchTeams(teamSearchTerm);
    if (result.success) {
      setAvailableTeams(result.data.teams || []);
    } else {
      toast.error('Failed to search teams.');
    }
    setSearchingTeams(false);
  };

  // Close member actions menu on outside click
  useEffect(() => {
    if (!openMenuFor) return;
    const handleClick = () => setOpenMenuFor(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [openMenuFor]);

  // Actions
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      toast.error('Team name is required.');
      return;
    }

    setCreatingTeam(true);
    const result = await teamApi.createTeam(createForm);
    if (result.success) {
      toast.success('Team created successfully! You are now the Team Leader.');
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '' });
      setRefreshTrigger((t) => t + 1);
    } else {
      toast.error(result.error || 'Failed to create team.');
    }
    setCreatingTeam(false);
  };

  const handleSendJoinRequest = async () => {
    if (!showJoinModal) return;
    setSendingRequest(true);

    const result = await teamApi.sendJoinRequest(showJoinModal.id, joinMessage);
    if (result.success) {
      toast.success(`Join request sent to "${showJoinModal.name}"!`);
      setShowJoinModal(null);
      setJoinMessage('');
      setRefreshTrigger((t) => t + 1);
    } else {
      toast.error(result.error || 'Failed to send join request.');
    }
    setSendingRequest(false);
  };

  const handleCancelJoinRequest = async (requestId) => {
    setCancellingRequestId(requestId);
    const result = await teamApi.cancelJoinRequest(requestId);
    if (result.success) {
      toast.success('Join request cancelled.');
      setRefreshTrigger((t) => t + 1);
    } else {
      toast.error(result.error || 'Failed to cancel join request.');
    }
    setCancellingRequestId(null);
  };

  const handleAcceptJoinRequest = async (requestId) => {
    setAcceptingJoinRequestId(requestId);
    const result = await teamApi.acceptJoinRequest(team.id, requestId);
    if (result.success) {
      toast.success('Volunteer added to your team!');
      setRefreshTrigger((t) => t + 1);
    } else {
      toast.error(result.error || 'Failed to accept join request.');
    }
    setAcceptingJoinRequestId(null);
  };

  const handleRejectJoinRequest = async (requestId) => {
    setRejectingJoinRequestId(requestId);
    const result = await teamApi.rejectJoinRequest(team.id, requestId);
    if (result.success) {
      toast.success('Join request declined.');
      setRefreshTrigger((t) => t + 1);
    } else {
      toast.error(result.error || 'Failed to decline join request.');
    }
    setRejectingJoinRequestId(null);
  };

  const handleAcceptInvitation = async (invitationId) => {
    if (acceptingId) return;
    setAcceptingId(invitationId);

    const result = await teamApi.acceptInvitation(invitationId);
    if (result.success) {
      toast.success('Invitation accepted! You are now a team member.');
      setRefreshTrigger((t) => t + 1);
    } else if (result.status === 409) {
      toast.error('This invitation is no longer available.');
      setRefreshTrigger((t) => t + 1);
    } else {
      toast.error(result.error || 'Failed to accept invitation.');
    }
    setAcceptingId(null);
  };

  const handleDeclineInvitation = async (invitationId) => {
    const result = await teamApi.declineInvitation(invitationId);
    if (result.success) {
      toast.success('Invitation declined.');
      setRefreshTrigger((t) => t + 1);
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

  const handleInviteMember = async (email) => {
    setInviting(true);
    const result = await teamApi.inviteMember(team.id, email);
    if (result.success) {
      toast.success('Invitation sent successfully.');
      setShowInviteModal(false);
      setRefreshTrigger((t) => t + 1);
    } else {
      toast.error(result.error || 'Failed to send invitation.');
    }
    setInviting(false);
  };

  const handleRemoveMember = async (memberUserId, memberName) => {
    setActionLoading(true);
    const result = await teamApi.removeMember(team.id, memberUserId);
    if (result.success) {
      toast.success(`${memberName} removed from the team.`);
      setConfirmModal(null);
      setRefreshTrigger((t) => t + 1);
    } else {
      toast.error(result.error || 'Failed to remove member.');
    }
    setActionLoading(false);
  };

  const handleTransferLeadership = async (memberUserId, memberName) => {
    setActionLoading(true);
    const result = await teamApi.transferLeadership(team.id, memberUserId);
    if (result.success) {
      toast.success(`Leadership transferred to ${memberName}.`);
      setConfirmModal(null);
      setRefreshTrigger((t) => t + 1);
    } else {
      toast.error(result.error || 'Failed to transfer leadership.');
    }
    setActionLoading(false);
  };

  const handleLeaveTeam = async () => {
    setActionLoading(true);
    const result = await teamApi.leaveTeam();
    if (result.success) {
      toast.success('You have left the team.');
      setConfirmModal(null);
      setRefreshTrigger((t) => t + 1);
    } else {
      toast.error(result.error || 'Failed to leave team.');
    }
    setActionLoading(false);
  };

  const isLeader = team?.leader_id === user?.id;

  const handleSaveTeamLocation = async (data) => {
    const result = await teamApi.updateTeam(team.id, data);
    if (result.success) {
      setTeam((prev) => ({ ...prev, ...result.data.team }));
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  useTeamRoom(team?.id, {
    onAnnouncement: () => setRefreshTrigger((t) => t + 1),
    onTeamActivity: () => setRefreshTrigger((t) => t + 1),
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-dash-primary-soft flex items-center justify-center shrink-0">
                <Users size={20} className="text-dash-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">My Team</h1>
                <p className="text-text-secondary text-sm mt-0.5">Manage your team and view team activity</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard count={4} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-dash-primary-soft flex items-center justify-center shrink-0">
                <Users size={20} className="text-dash-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">My Team</h1>
              </div>
            </div>
          </div>
          <ErrorState
            title="Failed to load team information"
            message={error}
            onRetry={() => setRefreshTrigger((t) => t + 1)}
          />
        </div>
      </DashboardLayout>
    );
  }

  // =========================================================================
  // 1. NO TEAM STATE (Polished, Intentional Experience)
  // =========================================================================
  if (!team) {
    // Map existing pending requests for quick lookup
    const pendingTeamIds = new Set(
      myRequests.filter((r) => r.status === 'pending').map((r) => r.team_id)
    );

    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header & Quick Action */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-dash-primary-soft/40 via-surface to-surface p-6 rounded-xl border border-dash-primary/20 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-dash-primary text-white flex items-center justify-center shrink-0 shadow-md">
                <Sparkles size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                  Get Started With Your Team
                </h1>
                <p className="text-text-secondary text-sm mt-1 max-w-2xl">
                  Collaborate with other volunteers on donation pickup missions. Join an existing team in your area or form your own team to lead community efforts.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-dash-primary text-white text-sm font-semibold hover:bg-dash-primary-hover shadow-md hover:shadow-lg transition-all shrink-0"
            >
              <Plus size={18} />
              Create a Team
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-border/80 gap-6 text-sm font-medium">
            <button
              onClick={() => setNoTeamTab('discover')}
              className={`pb-3 relative transition-colors ${
                noTeamTab === 'discover'
                  ? 'text-dash-primary font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <Search size={16} />
                Find & Join Teams
                <span className="px-2 py-0.5 rounded-full bg-dash-primary-soft text-dash-primary text-xs">
                  {availableTeams.length}
                </span>
              </div>
              {noTeamTab === 'discover' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dash-primary rounded-t-full" />
              )}
            </button>

            <button
              onClick={() => setNoTeamTab('requests')}
              className={`pb-3 relative transition-colors ${
                noTeamTab === 'requests'
                  ? 'text-dash-primary font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <Send size={16} />
                My Join Requests
                {myRequests.filter((r) => r.status === 'pending').length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-warning-soft text-warning text-xs font-semibold">
                    {myRequests.filter((r) => r.status === 'pending').length}
                  </span>
                )}
              </div>
              {noTeamTab === 'requests' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dash-primary rounded-t-full" />
              )}
            </button>

            <button
              onClick={() => setNoTeamTab('invitations')}
              className={`pb-3 relative transition-colors ${
                noTeamTab === 'invitations'
                  ? 'text-dash-primary font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserPlus size={16} />
                Received Invitations
                {invitations.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-dash-primary text-white text-xs font-semibold">
                    {invitations.length}
                  </span>
                )}
              </div>
              {noTeamTab === 'invitations' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dash-primary rounded-t-full" />
              )}
            </button>
          </div>

          {/* TAB 1: FIND & JOIN TEAMS */}
          {noTeamTab === 'discover' && (
            <div className="space-y-6">
              {/* Search Bar */}
              <form onSubmit={handleSearchTeams} className="flex gap-2 max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                  <input
                    type="text"
                    value={teamSearchTerm}
                    onChange={(e) => setTeamSearchTerm(e.target.value)}
                    placeholder="Search teams by name or ID..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-input text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searchingTeams}
                  className="px-4 py-2.5 rounded-lg bg-dash-primary text-white text-sm font-medium hover:bg-dash-primary-hover transition-colors flex items-center gap-2"
                >
                  {searchingTeams ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
                </button>
              </form>

              {/* Available Teams Grid */}
              {availableTeams.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No teams found"
                  description="Be the first volunteer to create a team in your community!"
                  actionLabel="Create a Team"
                  onAction={() => setShowCreateModal(true)}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {availableTeams.map((t) => {
                    const isPending = pendingTeamIds.has(t.id);

                    return (
                      <div
                        key={t.id}
                        className="bg-surface rounded-xl border border-border p-5 flex flex-col justify-between hover:border-dash-primary/40 hover:shadow-md transition-all duration-200"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar item={t} tone="dash" className="w-10 h-10 shrink-0" />
                              <div className="min-w-0">
                                <h3 className="text-base font-semibold text-text-primary truncate">
                                  {t.name}
                                </h3>
                                <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                                  <Crown size={12} className="text-dash-primary shrink-0" />
                                  Leader: {t.leader_name}
                                </p>
                              </div>
                            </div>
                            <span className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-page border border-border/60 text-text-secondary font-medium flex items-center gap-1">
                              <Users size={12} />
                              {t.member_count} member{t.member_count !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {t.description && (
                            <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                              {t.description}
                            </p>
                          )}

                          {t.base_address && (
                            <p className="text-xs text-text-muted flex items-center gap-1.5 truncate">
                              <MapPin size={13} className="shrink-0 text-dash-primary/70" />
                              {t.base_address}
                            </p>
                          )}
                        </div>

                        <div className="mt-5 pt-3.5 border-t border-border/50">
                          {isPending ? (
                            <button
                              disabled
                              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-warning-soft text-warning text-xs font-semibold cursor-not-allowed"
                            >
                              <Clock size={14} />
                              Request Pending
                            </button>
                          ) : (
                            <button
                              onClick={() => setShowJoinModal(t)}
                              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dash-primary text-dash-primary hover:bg-dash-primary-soft/60 text-xs font-semibold transition-colors"
                            >
                              <Send size={14} />
                              Send Join Request
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY SENT JOIN REQUESTS */}
          {noTeamTab === 'requests' && (
            <div className="space-y-4">
              {myRequests.length === 0 ? (
                <EmptyState
                  icon={Send}
                  title="No join requests sent"
                  description="When you find a team you'd like to collaborate with, send them a join request."
                  showAction={false}
                />
              ) : (
                <div className="bg-surface rounded-xl border border-border divide-y divide-border/60 overflow-hidden">
                  {myRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-hover/50 transition-colors"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-dash-primary-soft flex items-center justify-center shrink-0 mt-0.5">
                          <Building size={20} className="text-dash-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-text-primary">
                              {req.team_name}
                            </h4>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                req.status === 'pending'
                                  ? 'bg-warning-soft text-warning border border-warning/20'
                                  : req.status === 'accepted'
                                  ? 'bg-success-soft text-success border border-success/20'
                                  : req.status === 'rejected'
                                  ? 'bg-danger-soft text-danger border border-danger/20'
                                  : 'bg-page text-text-muted border border-border'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary mt-1">
                            Team Leader: {req.leader_name} &middot; Sent{' '}
                            {new Date(req.created_at).toLocaleDateString()}
                          </p>
                          {req.message && (
                            <p className="text-xs text-text-muted mt-1.5 italic bg-page px-3 py-1.5 rounded border border-border/50 max-w-lg">
                              &ldquo;{req.message}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      {req.status === 'pending' && (
                        <button
                          onClick={() => handleCancelJoinRequest(req.id)}
                          disabled={cancellingRequestId === req.id}
                          className="self-start sm:self-center px-3.5 py-1.5 rounded-lg border border-border text-text-secondary text-xs font-medium hover:bg-danger-soft hover:text-danger hover:border-danger/30 transition-colors disabled:opacity-50"
                        >
                          {cancellingRequestId === req.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            'Cancel Request'
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RECEIVED INVITATIONS */}
          {noTeamTab === 'invitations' && (
            <div className="space-y-4">
              {invitations.length === 0 ? (
                <EmptyState
                  icon={UserPlus}
                  title="No pending invitations"
                  description="When a team leader invites you to join their team, it will appear here."
                  showAction={false}
                />
              ) : (
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="bg-surface rounded-xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3.5">
                        <Avatar item={invitation.team} tone="dash" className="w-11 h-11 shrink-0" />
                        <div>
                          <h4 className="text-base font-semibold text-text-primary">
                            {invitation.team?.name}
                          </h4>
                          <p className="text-xs text-text-secondary mt-0.5">
                            Invited by{' '}
                            <span className="font-medium text-text-primary">
                              {invitation.inviter?.name}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleAcceptInvitation(invitation.id)}
                          disabled={acceptingId === invitation.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-dash-primary text-white text-xs font-semibold hover:bg-dash-primary-hover transition-colors disabled:opacity-50 shadow-sm"
                        >
                          {acceptingId === invitation.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>
                              <Check size={14} /> Accept
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeclineInvitation(invitation.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-text-primary text-xs font-semibold hover:bg-surface-hover transition-colors"
                        >
                          <X size={14} /> Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CREATE TEAM MODAL */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-surface rounded-xl border border-border p-6 max-w-md w-full shadow-pb-elevated space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                    <Crown size={18} className="text-dash-primary" /> Create New Team
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Team Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="e.g. Uttara Relief Squad"
                      className="w-full px-3.5 py-2 rounded-lg border border-border bg-input text-sm text-text-primary focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Team Description (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="Describe your team's mission or coverage area..."
                      className="w-full px-3.5 py-2 rounded-lg border border-border bg-input text-sm text-text-primary focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary focus:outline-none"
                    />
                  </div>

                  <div className="pt-3 flex justify-end gap-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-text-secondary hover:bg-surface-hover"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingTeam}
                      className="px-4 py-2 rounded-lg bg-dash-primary text-white text-xs font-semibold hover:bg-dash-primary-hover flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {creatingTeam ? <Loader2 size={14} className="animate-spin" /> : 'Create Team'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SEND JOIN REQUEST MODAL */}
          {showJoinModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-surface rounded-xl border border-border p-6 max-w-md w-full shadow-pb-elevated space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="text-lg font-bold text-text-primary">
                    Join &ldquo;{showJoinModal.name}&rdquo;
                  </h3>
                  <button
                    onClick={() => setShowJoinModal(null)}
                    className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="text-xs text-text-secondary space-y-1">
                  <p>
                    <span className="font-semibold text-text-primary">Team Leader:</span>{' '}
                    {showJoinModal.leader_name}
                  </p>
                  {showJoinModal.description && (
                    <p className="italic bg-page p-2.5 rounded border border-border/50 text-text-muted">
                      {showJoinModal.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Message to Team Leader (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={joinMessage}
                    onChange={(e) => setJoinMessage(e.target.value)}
                    placeholder="Briefly introduce yourself or mention your availability..."
                    className="w-full px-3.5 py-2 rounded-lg border border-border bg-input text-sm text-text-primary focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary focus:outline-none"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(null)}
                    className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-text-secondary hover:bg-surface-hover"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendJoinRequest}
                    disabled={sendingRequest}
                    className="px-4 py-2 rounded-lg bg-dash-primary text-white text-xs font-semibold hover:bg-dash-primary-hover flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {sendingRequest ? <Loader2 size={14} className="animate-spin" /> : 'Send Request'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // =========================================================================
  // 2. TEAM MEMBER / LEADER EXPERIENCE
  // =========================================================================
  const activeDonations = donations.filter((d) => ACTIVE_STATUSES.has(d.status));
  const completedDonations = donations.filter((d) => d.status === 'completed');

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
    const matchesSearch =
      !q || member.name?.toLowerCase().includes(q) || String(member.user_id).includes(q);
    if (!matchesSearch) return false;

    if (memberFilter === 'leader') return member.role === 'leader';
    if (memberFilter === 'mission') return missionByUserId.has(member.user_id);
    if (memberFilter === 'available') return !missionByUserId.has(member.user_id);
    return true;
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-dash-primary-soft flex items-center justify-center shrink-0">
                <Users size={20} className="text-dash-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">{team.name}</h1>
                <p className="text-text-secondary text-sm mt-0.5">
                  {team.description || 'Team overview and activity'}
                </p>
              </div>
            </div>
            {isLeader && (
              <button
                onClick={() => setShowAnnouncementModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dash-primary text-white text-sm font-medium hover:bg-dash-primary-hover transition-colors shadow-sm"
              >
                <Megaphone size={16} />
                Send Announcement
              </button>
            )}
          </div>
        </div>

        {/* INCOMING JOIN REQUESTS (Leader Only) */}
        {isLeader && incomingRequests.length > 0 && (
          <div className="bg-warning-soft/30 border border-warning/40 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Clock size={16} className="text-warning" />
                Pending Join Requests ({incomingRequests.length})
              </h2>
              <span className="text-xs text-text-secondary">Volunteers requesting to join your team</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-surface rounded-lg border border-border p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <Avatar item={{ name: req.volunteer_name, profile_photo: req.volunteer_photo }} tone="dash" className="w-10 h-10 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {req.volunteer_name}
                      </p>
                      <p className="text-xs text-text-secondary truncate">{req.volunteer_email}</p>
                      {req.message && (
                        <p className="text-xs text-text-muted mt-1.5 italic bg-page p-2 rounded border border-border/50">
                          &ldquo;{req.message}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                    <button
                      onClick={() => handleRejectJoinRequest(req.id)}
                      disabled={rejectingJoinRequestId === req.id}
                      className="px-3 py-1.5 rounded-lg border border-border text-text-secondary text-xs font-semibold hover:bg-surface-hover transition-colors"
                    >
                      {rejectingJoinRequestId === req.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        'Decline'
                      )}
                    </button>
                    <button
                      onClick={() => handleAcceptJoinRequest(req.id)}
                      disabled={acceptingJoinRequestId === req.id}
                      className="px-3 py-1.5 rounded-lg bg-dash-primary text-white text-xs font-semibold hover:bg-dash-primary-hover transition-colors flex items-center gap-1 shadow-xs"
                    >
                      {acceptingJoinRequestId === req.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>
                          <Check size={14} /> Accept
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLeader && (
          <div>
            <BaseLocationCard
              savedLocation={{ baseAddress: team.base_address, coverageRadius: team.coverage_radius }}
              onSave={handleSaveTeamLocation}
              title="Team Base Location"
            />
          </div>
        )}

        {/* Team stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 bg-surface rounded-lg border border-border/50 divide-x divide-y sm:divide-y-0 divide-border/50 overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3">
            <Users size={15} className="shrink-0 text-dash-primary" />
            <div className="min-w-0">
              <p className="text-lg font-semibold text-text-primary leading-tight tabular-nums">
                {totalMembers}
              </p>
              <p className="text-[11px] font-medium text-text-secondary truncate">Total Members</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-3">
            <UserCheck size={15} className="shrink-0 text-success" />
            <div className="min-w-0">
              <p className="text-lg font-semibold text-text-primary leading-tight tabular-nums">
                {availableCount}
              </p>
              <p className="text-[11px] font-medium text-text-secondary truncate">Available</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-3">
            <Navigation size={15} className="shrink-0 text-warning" />
            <div className="min-w-0">
              <p className="text-lg font-semibold text-text-primary leading-tight tabular-nums">
                {onMissionCount}
              </p>
              <p className="text-[11px] font-medium text-text-secondary truncate">On a Mission</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-3">
            <Package size={15} className="shrink-0 text-info" />
            <div className="min-w-0">
              <p className="text-lg font-semibold text-text-primary leading-tight tabular-nums">
                {activeDonations.length}
              </p>
              <p className="text-[11px] font-medium text-text-secondary truncate">
                Ongoing Missions
              </p>
            </div>
          </div>
        </div>

        {/* Team Members Roster */}
        <div className="bg-surface rounded-lg border border-border p-5">
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

          {/* Search & filters */}
          <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search by volunteer name or ID..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-input text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-4 focus:ring-dash-primary/10 focus:border-dash-primary transition-all"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto">
              {[
                { key: 'all', label: 'All' },
                { key: 'leader', label: 'Leader' },
                { key: 'mission', label: 'On Mission' },
                { key: 'available', label: 'Available' },
              ].map((f) => (
                <button
                  key={f.key}
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
              {filteredMembers.map((member) => {
                const isThisMemberLeader = member.role === 'leader';
                const isThisMemberCurrentUser = member.user_id === user?.id;
                const canManageThisMember =
                  isLeader && !isThisMemberLeader && !isThisMemberCurrentUser;
                const mission = missionByUserId.get(member.user_id);
                const menuOpen = openMenuFor === member.id;

                return (
                  <div
                    key={member.id}
                    className={`relative rounded-lg border p-3.5 transition-all duration-150 hover:shadow-pb-card hover:-translate-y-0.5 ${
                      isThisMemberLeader
                        ? 'border-dash-primary/30 bg-dash-primary-soft/40'
                        : 'border-border/50 bg-page'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Avatar item={member} tone="dash" className="w-9 h-9 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {member.name}
                          </p>
                          {isThisMemberLeader && (
                            <Crown size={13} className="text-dash-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-text-secondary">
                          ID #{member.user_id} &middot;{' '}
                          {isThisMemberLeader ? 'Team Leader' : 'Member'}
                          {isThisMemberCurrentUser && ' (You)'}
                        </p>
                      </div>
                      {(canManageThisMember || !isThisMemberCurrentUser) && (
                        <div className="relative shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuFor(menuOpen ? null : member.id);
                            }}
                            className="p-1 rounded-md hover:bg-surface-hover text-text-secondary transition-colors"
                          >
                            <MoreVertical size={14} />
                          </button>
                          {menuOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1 w-44 bg-surface rounded-lg shadow-pb-elevated border border-border py-1 z-20"
                            >
                              <button
                                onClick={() => {
                                  navigate(`/volunteers/${member.user_id}`);
                                  setOpenMenuFor(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                              >
                                <ExternalLink size={12} /> View Profile
                              </button>
                              {mission && (
                                <button
                                  onClick={() => {
                                    navigate(`/donations/${mission.id}`);
                                    setOpenMenuFor(null);
                                  }}
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
                                      setConfirmModal({
                                        type: 'transfer',
                                        memberUserId: member.user_id,
                                        memberName: member.name,
                                      });
                                      setOpenMenuFor(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                                  >
                                    <ArrowLeftRight size={12} /> Transfer Leadership
                                  </button>
                                  <button
                                    onClick={() => {
                                      setConfirmModal({
                                        type: 'remove',
                                        memberUserId: member.user_id,
                                        memberName: member.name,
                                      });
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
                          <Navigation size={11} className="shrink-0" /> On mission:{' '}
                          {mission.title || `Donation #${mission.id}`}
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
                          <p className="text-xs text-text-secondary mb-2 line-clamp-2">
                            {donation.description}
                          </p>
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

            {completedDonations.length > 0 && (
              <div className="bg-surface rounded-lg border border-border p-5">
                <h2 className="text-sm font-semibold text-text-primary mb-4">
                  Completed Missions
                </h2>
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
                          <p className="text-xs text-text-secondary mb-2 line-clamp-2">
                            {donation.description}
                          </p>
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
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showAnnouncementModal && (
        <AnnouncementComposer
          team={team}
          onSend={handleSendAnnouncement}
          onClose={() => setShowAnnouncementModal(false)}
          loading={sendingAnnouncement}
        />
      )}

      {showInviteModal && (
        <InviteMemberModal
          onInvite={handleInviteMember}
          onClose={() => setShowInviteModal(false)}
          loading={inviting}
        />
      )}

      {confirmModal && (
        <ConfirmActionModal
          isOpen={true}
          title={
            confirmModal.type === 'leave'
              ? 'Leave Team?'
              : confirmModal.type === 'remove'
              ? `Remove ${confirmModal.memberName}?`
              : `Transfer Leadership to ${confirmModal.memberName}?`
          }
          message={
            confirmModal.type === 'leave'
              ? 'Are you sure you want to leave this team? You will no longer receive team notifications or be assigned team missions.'
              : confirmModal.type === 'remove'
              ? `Are you sure you want to remove ${confirmModal.memberName} from the team?`
              : `Are you sure you want to transfer team leadership to ${confirmModal.memberName}? You will become a regular member.`
          }
          confirmLabel={
            confirmModal.type === 'leave'
              ? 'Leave Team'
              : confirmModal.type === 'remove'
              ? 'Remove Member'
              : 'Transfer Leadership'
          }
          confirmVariant={confirmModal.type === 'transfer' ? 'primary' : 'danger'}
          onConfirm={() => {
            if (confirmModal.type === 'leave') handleLeaveTeam();
            else if (confirmModal.type === 'remove')
              handleRemoveMember(confirmModal.memberUserId, confirmModal.memberName);
            else if (confirmModal.type === 'transfer')
              handleTransferLeadership(confirmModal.memberUserId, confirmModal.memberName);
          }}
          onCancel={() => setConfirmModal(null)}
          loading={actionLoading}
        />
      )}
    </DashboardLayout>
  );
}
