import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, Package, Wifi, WifiOff, Crown, Circle, X, Navigation, MapPin,
} from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { SkeletonCard } from '../components/dashboard/skeletons';
import VolunteerMap from '../components/dashboard/donor/VolunteerMap';
import { StatusBadge } from '../components/donation/StatusBadge';
import { useAuthSocket } from '../context/SocketContext';
import { calculateETA, formatETA } from '../hooks/useDonationTracking';
import { haversineDistanceKm } from '../utils/geo';
import { adminApi } from '../services/adminApi';

const TERMINAL_STATUSES = new Set(['completed']);
const ACTIVE_STATUSES = new Set(['accepted', 'scheduled', 'on_the_way', 'picked_up']);

function StatChip({ icon: Icon, label, value }) {
  return (
    <div className="bg-surface rounded-lg border border-border/50 px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-md bg-dash-primary-soft flex items-center justify-center shrink-0">
        <Icon size={15} className="text-dash-primary" />
      </div>
      <div>
        <p className="text-lg font-semibold text-text-primary leading-tight">{value}</p>
        <p className="text-xs text-text-secondary">{label}</p>
      </div>
    </div>
  );
}

/**
 * AdminLiveOperations — "Live Operations" (Phase 6).
 *
 * Reuses, rather than reinvents, the Phase 5 live-location infrastructure:
 * - VolunteerMap.jsx (same component, same markers/routeLine props added
 *   for the volunteer mission map)
 * - The same 'volunteer_location_updated' / 'donation_status_updated'
 *   Socket.io events (now also broadcast to the 'admin_live_ops' room —
 *   see tracking.handler.js and donation.service.js#emitDonationStatusUpdate)
 * - calculateETA/formatETA and haversineDistanceKm, unchanged
 *
 * No new socket connection, no new map component, no location persistence.
 */
export function AdminLiveOperations() {
  const { socket, connected } = useAuthSocket();
  const navigate = useNavigate();

  const [missions, setMissions] = useState([]);
  const [teamsRoster, setTeamsRoster] = useState({});
  const [volunteerOnlineSnapshot, setVolunteerOnlineSnapshot] = useState({});
  const [positions, setPositions] = useState({}); // donationId -> {latitude, longitude, timestamp}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selected, setSelected] = useState(null); // { type: 'volunteer'|'team', donationId }

  // Initial REST snapshot
  const fetchMissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await adminApi.getLiveOperations();
    if (result.success) {
      setMissions(result.data?.missions || []);
      const onlineMap = {};
      (result.data?.volunteers || []).forEach((v) => { onlineMap[v.id] = v.isOnline; });
      setVolunteerOnlineSnapshot(onlineMap);
      const rosterMap = {};
      (result.data?.teams || []).forEach((t) => { rosterMap[t.id] = t; });
      setTeamsRoster(rosterMap);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (cancelled) return;
      await fetchMissions();
    };
    load();
    return () => { cancelled = true; };
  }, [refreshTrigger, fetchMissions]);

  // Join the admin live-ops room; listen for the same events the
  // donor/volunteer tracking views already consume.
  useEffect(() => {
    if (!socket || !connected) return undefined;

    socket.emit('join_admin_live_ops', {});

    const handleLocation = (data) => {
      if (!data?.donationId || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return;
      setPositions((prev) => ({
        ...prev,
        [data.donationId]: { latitude: data.latitude, longitude: data.longitude, timestamp: data.timestamp },
      }));
    };

    const handleStatus = (data) => {
      if (!data?.donationId) return;
      setMissions((prev) => {
        if (data.isDeleted || TERMINAL_STATUSES.has(data.status)) {
          return prev.filter((m) => m.id !== data.donationId);
        }
        // Phase 10 QA fix: detect when a donation newly enters the active set
        // (e.g., just accepted). The socket event only carries basic info in this case,
        // so trigger a refresh to get full marker data before rendering.
        const existing = prev.find((m) => m.id === data.donationId);
        if (!existing && ACTIVE_STATUSES.has(data.status)) {
          // Unknown mission now active - refresh to get complete data
          fetchMissions();
          return prev;
        }
        return prev.map((m) => (m.id === data.donationId ? { ...m, status: data.status } : m));
      });
    };

    socket.on('volunteer_location_updated', handleLocation);
    socket.on('donation_status_updated', handleStatus);

    return () => {
      socket.emit('leave_admin_live_ops', {});
      socket.off('volunteer_location_updated', handleLocation);
      socket.off('donation_status_updated', handleStatus);
    };
  }, [socket, connected, fetchMissions]);

  const getPersonId = useCallback((mission) => (
    mission.assignment_mode === 'team' ? mission.assigned_member_id : mission.volunteer_id
  ), []);

  const individualMissions = useMemo(
    () => missions.filter((m) => m.assignment_mode !== 'team'),
    [missions]
  );
  const teamMissions = useMemo(
    () => missions.filter((m) => m.assignment_mode === 'team'),
    [missions]
  );

  const volunteerMarkers = useMemo(() => individualMissions
    .filter((m) => positions[m.id])
    .map((m) => {
      const pos = positions[m.id];
      const isOnline = volunteerOnlineSnapshot[m.volunteer_id];
      return {
        ...pos,
        name: m.volunteer_name || 'Volunteer',
        is_online: isOnline,
        distance: (m.pickup_latitude && pos)
          ? haversineDistanceKm(pos.latitude, pos.longitude, m.pickup_latitude, m.pickup_longitude).toFixed(1)
          : '—',
        donationId: m.id,
        popupHtml: `<strong>${m.volunteer_name || 'Volunteer'}</strong><br/>${m.status.replace(/_/g, ' ')}`,
      };
    }), [individualMissions, positions, volunteerOnlineSnapshot]);

  const teamMarkers = useMemo(() => teamMissions
    .filter((m) => positions[m.id])
    .map((m) => {
      const pos = positions[m.id];
      const roster = teamsRoster[m.team_id];
      return {
        ...pos,
        name: roster?.name || 'Team',
        donationId: m.id,
        popupHtml: `<strong>${roster?.name || 'Team'}</strong><br/>${m.assigned_member_name || ''}`,
      };
    }), [teamMissions, positions, teamsRoster]);

  const pickupMarkers = useMemo(() => missions
    .filter((m) => typeof m.pickup_latitude === 'number' && typeof m.pickup_longitude === 'number')
    .map((m) => ({
      id: `pickup-${m.id}`,
      latitude: m.pickup_latitude,
      longitude: m.pickup_longitude,
      color: '#f97316',
      emoji: '📦',
      onClick: () => setSelected({
        type: m.assignment_mode === 'team' ? 'team' : 'volunteer',
        donationId: m.id,
      }),
      popupHtml: `<strong>Pickup — ${m.donor_name || 'Donor'}</strong><br/>${m.category}`,
    })), [missions]);

  const handleMarkerClick = (marker) => {
    setSelected({ type: marker.donationId ? (missions.find((m) => m.id === marker.donationId)?.assignment_mode === 'team' ? 'team' : 'volunteer') : 'volunteer', donationId: marker.donationId });
  };

  const selectedMission = selected ? missions.find((m) => m.id === selected.donationId) : null;
  const selectedPosition = selectedMission ? positions[selectedMission.id] : null;
  const selectedRoute = (selectedPosition && selectedMission?.pickup_latitude) ? {
    points: [
      [selectedPosition.latitude, selectedPosition.longitude],
      [selectedMission.pickup_latitude, selectedMission.pickup_longitude],
    ],
    color: '#3b82f6',
  } : null;

  const activeVolunteerCount = new Set(individualMissions.map((m) => m.volunteer_id).filter(Boolean)).size;
  const activeTeamCount = new Set(teamMissions.map((m) => m.team_id).filter(Boolean)).size;

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
        <ErrorState title="Failed to load live operations" message={error} onRetry={() => setRefreshTrigger((t) => t + 1)} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Live Operations</h1>
            <p className="text-text-secondary text-sm">Real-time volunteers, teams, and missions in progress.</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            connected ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
          }`}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? 'Live' : 'Reconnecting...'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatChip icon={Package} label="Active Missions" value={missions.length} />
          <StatChip icon={UserCheck} label="Active Volunteers" value={activeVolunteerCount} />
          <StatChip icon={Users} label="Active Teams" value={activeTeamCount} />
          <StatChip icon={MapPin} label="Live Positions" value={Object.keys(positions).length} />
        </div>

        {missions.length === 0 ? (
          <EmptyState icon={Package} title="No active missions right now" description="The map will populate as donations are accepted." showAction={false} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-lg overflow-hidden border border-border/50">
              <VolunteerMap
                volunteers={volunteerMarkers}
                teams={teamMarkers}
                markers={pickupMarkers}
                routeLine={selectedRoute}
                onVolunteerClick={handleMarkerClick}
                onTeamClick={handleMarkerClick}
                className="h-[520px]"
              />
            </div>

            <div className="space-y-4">
              {selectedMission ? (
                <MissionDetailPanel
                  mission={selectedMission}
                  position={selectedPosition}
                  isTeam={selected.type === 'team'}
                  teamRoster={selectedMission.team_id ? teamsRoster[selectedMission.team_id] : null}
                  isVolunteerOnline={volunteerOnlineSnapshot[getPersonId(selectedMission)]}
                  onClose={() => setSelected(null)}
                  onOpenDonation={() => navigate(`/admin/donations/${selectedMission.id}`)}
                />
              ) : (
                <MissionListPanel
                  missions={missions}
                  positions={positions}
                  onSelect={(m) => setSelected({ type: m.assignment_mode === 'team' ? 'team' : 'volunteer', donationId: m.id })}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function MissionListPanel({ missions, positions, onSelect }) {
  return (
    <div className="bg-surface rounded-lg border border-border/50 p-4">
      <h2 className="text-sm font-semibold text-text-primary mb-3">Active Missions</h2>
      <ul className="divide-y divide-border/50 max-h-[480px] overflow-y-auto">
        {missions.map((m) => (
          <li
            key={m.id}
            onClick={() => onSelect(m)}
            className="py-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-surface-hover rounded-md px-2 -mx-2 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-primary truncate max-w-[160px]">
                {m.assignment_mode === 'team' ? (m.assigned_member_name || 'Team mission') : (m.volunteer_name || 'Unassigned')}
              </p>
              <p className="text-[11px] text-text-secondary truncate max-w-[160px]">
                #{m.id} · {m.category}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Circle size={7} className={positions[m.id] ? 'fill-success text-success' : 'fill-border text-border'} />
              <StatusBadge status={m.status} size="small" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MissionDetailPanel({ mission, position, isTeam, teamRoster, isVolunteerOnline, onClose, onOpenDonation }) {
  const distanceKm = (position && mission.pickup_latitude)
    ? haversineDistanceKm(position.latitude, position.longitude, mission.pickup_latitude, mission.pickup_longitude)
    : null;
  const etaMinutes = distanceKm !== null ? calculateETA(distanceKm) : null;
  const personName = isTeam ? (mission.assigned_member_name || 'Unassigned') : (mission.volunteer_name || 'Unassigned');

  return (
    <div className="bg-surface rounded-lg border border-border/50 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            {isTeam ? (teamRoster?.name || 'Team') : personName}
          </h2>
          <span className={`inline-flex items-center gap-1 text-xs mt-0.5 ${isVolunteerOnline ? 'text-success' : 'text-text-secondary'}`}>
            <Circle size={7} className={isVolunteerOnline ? 'fill-current' : 'fill-border'} />
            {isVolunteerOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
          <X size={16} />
        </button>
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-text-secondary text-xs">Mission Status</dt>
          <dd><StatusBadge status={mission.status} size="small" /></dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-text-secondary text-xs">Donation ID</dt>
          <dd className="text-text-primary text-xs font-medium">#{mission.id}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-text-secondary text-xs shrink-0">Pickup</dt>
          <dd className="text-text-primary text-xs text-right truncate max-w-[160px]">{mission.pickup_location || '—'}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-text-secondary text-xs shrink-0">Destination</dt>
          <dd className="text-text-secondary text-xs text-right italic">Not tracked by this platform</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-text-secondary text-xs">Distance</dt>
          <dd className="text-text-primary text-xs font-medium">{distanceKm !== null ? `${distanceKm.toFixed(1)} km` : 'Waiting for location...'}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-text-secondary text-xs">ETA</dt>
          <dd className="text-text-primary text-xs font-medium">{etaMinutes !== null ? formatETA(etaMinutes) : '—'}</dd>
        </div>
      </dl>

      {isTeam && teamRoster && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-1.5 mb-2">
            <Users size={12} className="text-dash-primary" />
            <p className="text-xs font-semibold text-text-primary">Team</p>
          </div>
          <p className="text-xs text-text-secondary mb-2 flex items-center gap-1">
            <Crown size={11} className="text-warning" /> {teamRoster.leaderName || 'Unknown'} (Leader)
          </p>
          <ul className="space-y-1.5">
            {teamRoster.members?.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-xs">
                <span className="text-text-primary">{m.name}</span>
                <span className={`flex items-center gap-1 ${m.isOnline ? 'text-success' : 'text-text-secondary'}`}>
                  <Circle size={6} className={m.isOnline ? 'fill-current' : 'fill-border'} />
                  {m.isOnline ? 'Online' : 'Offline'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onOpenDonation}
        className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-dash-primary text-white text-xs font-medium hover:opacity-90 transition-opacity"
      >
        <Navigation size={12} /> View Full Donation Details
      </button>
    </div>
  );
}