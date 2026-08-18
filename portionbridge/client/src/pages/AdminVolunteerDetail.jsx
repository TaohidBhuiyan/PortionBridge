import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Calendar, UserCheck, Users, Car, MapPin,
  CheckCircle2, XCircle, Activity, Package,
} from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { SkeletonCard } from '../components/dashboard/skeletons';
import { AdminUserStatusBadge } from '../components/dashboard/admin';
import { StatusBadge } from '../components/donation/StatusBadge';
import { adminApi } from '../services/adminApi';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatBlock({ icon: Icon, label, value, tone = 'primary' }) {
  const toneClasses = {
    primary: 'bg-dash-primary-soft text-dash-primary',
    success: 'bg-success-soft text-success',
    danger: 'bg-danger-soft text-danger',
    warning: 'bg-warning-soft text-warning',
  };
  return (
    <div className="bg-surface rounded-lg border border-border/50 p-4">
      <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-2 ${toneClasses[tone]}`}>
        <Icon size={15} />
      </div>
      <p className="text-xl font-semibold text-text-primary">{value}</p>
      <p className="text-xs text-text-secondary">{label}</p>
    </div>
  );
}

/**
 * AdminVolunteerDetail — single volunteer's admin profile (Phase 4).
 *
 * Backed by GET /admin/volunteers/:id (admin.service.js#getVolunteerDetail),
 * enriched this phase with completion/cancellation rate, derived active
 * status, declared availability (volunteer_profiles), and team membership
 * — on top of the stats/currentAssignments that already existed.
 */
export function AdminVolunteerDetail() {
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
      const result = await adminApi.getVolunteer(id);
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
        <ErrorState title="Failed to load volunteer" message={error} onRetry={() => setRefreshTrigger((t) => t + 1)} />
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const { volunteer, stats, availability, team, currentAssignments = [] } = data;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <button
          onClick={() => navigate('/admin/volunteers-teams')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back to Volunteers & Teams
        </button>

        {/* Profile card */}
        <div className="bg-surface rounded-lg border border-border/50 p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-dash-primary-soft flex items-center justify-center shrink-0">
                <UserCheck size={22} className="text-dash-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">{volunteer.name}</h1>
                <p className="text-sm text-text-secondary">Volunteer</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                stats.isActive ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success'
              }`}>
                {stats.currentStatus}
              </span>
              <AdminUserStatusBadge isBanned={!!volunteer.is_banned} isDeleted={!!volunteer.is_deleted} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="text-text-secondary shrink-0" />
              <span className="text-text-primary">{volunteer.email}</span>
            </div>
            {volunteer.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-text-secondary shrink-0" />
                <span className="text-text-primary">{volunteer.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-text-secondary shrink-0" />
              <span className="text-text-primary">Joined {formatDate(volunteer.created_at)}</span>
            </div>
            {team && (
              <div className="flex items-center gap-2 text-sm">
                <Users size={14} className="text-text-secondary shrink-0" />
                <span className="text-text-primary">
                  {team.role === 'leader' ? 'Leads' : 'Member of'}{' '}
                  <button onClick={() => navigate(`/admin/teams/${team.id}`)} className="text-dash-primary hover:underline">
                    {team.name}
                  </button>
                </span>
              </div>
            )}
          </div>

          {availability && (availability.vehicleType || availability.availability || availability.serviceAreas) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              {availability.vehicleType && (
                <div className="flex items-center gap-2 text-sm">
                  <Car size={14} className="text-text-secondary shrink-0" />
                  <span className="text-text-primary capitalize">{availability.vehicleType}</span>
                </div>
              )}
              {availability.availability && (
                <div className="flex items-center gap-2 text-sm">
                  <Activity size={14} className="text-text-secondary shrink-0" />
                  <span className="text-text-primary">{availability.availability}</span>
                </div>
              )}
              {availability.serviceAreas && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-text-secondary shrink-0" />
                  <span className="text-text-primary truncate">
                    {Array.isArray(availability.serviceAreas) ? availability.serviceAreas.join(', ') : availability.serviceAreas}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Performance */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Performance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatBlock icon={CheckCircle2} label="Completed Missions" value={stats.completedPickups} tone="success" />
            <StatBlock icon={Activity} label="Completion Rate" value={`${stats.completionRate}%`} tone="primary" />
            <StatBlock icon={XCircle} label="Cancellation Rate" value={`${stats.cancellationRate}%`} tone="danger" />
            <StatBlock icon={Package} label="Total Assigned" value={stats.totalAssigned} tone="warning" />
          </div>
        </div>

        {/* Current assignments */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Current Assignments</h2>
          {currentAssignments.length === 0 ? (
            <div className="bg-surface rounded-lg border border-border/50">
              <EmptyState icon={Package} title="No active assignments" showAction={false} size="small" />
            </div>
          ) : (
            <div className="bg-surface rounded-lg border border-border/50 p-4">
              <ul className="divide-y divide-border/50">
                {currentAssignments.map((a) => (
                  <li key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate max-w-[240px]">
                        {a.title || `${a.category} donation`}
                      </p>
                      {a.pickup_location && <p className="text-[11px] text-text-secondary truncate max-w-[240px]">{a.pickup_location}</p>}
                    </div>
                    <StatusBadge status={a.status} size="small" />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
