import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, HeartHandshake, UserCheck, MapPin, Calendar, Flag, Clock,
} from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { SkeletonCard } from '../components/dashboard/skeletons';
import { StatusBadge } from '../components/donation/StatusBadge';
import { adminApi } from '../services/adminApi';

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function PersonCard({ icon: Icon, label, name, email, phone, empty }) {
  return (
    <div className="bg-surface rounded-lg border border-border/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-dash-primary-soft flex items-center justify-center shrink-0">
          <Icon size={13} className="text-dash-primary" />
        </div>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{label}</p>
      </div>
      {empty ? (
        <p className="text-sm text-text-secondary italic">{empty}</p>
      ) : (
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-text-primary">{name}</p>
          {email && <p className="text-xs text-text-secondary">{email}</p>}
          {phone && <p className="text-xs text-text-secondary">{phone}</p>}
        </div>
      )}
    </div>
  );
}

/**
 * AdminDonationDetail — single donation's full admin view (Phase 3),
 * showing Donor → Volunteer → Receiver → Current Status → Status History
 * as requested.
 *
 * Donor/volunteer names come from the new LEFT JOINs in
 * admin.model.js#findDonationById (Phase 3). Status history is unchanged
 * — the existing donation_status_history table, populated by DB triggers,
 * via GET /admin/donations/:id/history. "Receiver" is shown honestly: this
 * schema has no receiver/beneficiary entity (donations go to whoever the
 * volunteer hands them to off-platform), so that section shows the pickup
 * location/context instead of inventing a fake recipient record.
 */
export function AdminDonationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [donation, setDonation] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const [donationResult, historyResult] = await Promise.all([
        adminApi.getDonation(id),
        adminApi.getDonationHistory(id),
      ]);
      if (cancelled) return;
      if (donationResult.success) {
        setDonation(donationResult.data);
      } else {
        setError(donationResult.error);
      }
      if (historyResult.success) {
        setHistory(historyResult.data?.history || []);
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
        <ErrorState title="Failed to load donation" message={error} onRetry={() => setRefreshTrigger((t) => t + 1)} />
      </DashboardLayout>
    );
  }

  if (!donation) return null;

  const displayStatus = donation.is_deleted ? 'cancelled' : donation.status;
  const reports = donation.reports || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <button
          onClick={() => navigate('/admin/donations')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back to Donations
        </button>

        {/* Header */}
        <div className="bg-surface rounded-lg border border-border/50 p-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-text-primary mb-1">
                {donation.title || `${donation.category} donation`}
              </h1>
              <p className="text-sm text-text-secondary capitalize">{donation.category} · Qty {donation.quantity}{donation.quantity_unit ? ` ${donation.quantity_unit}` : ''}</p>
            </div>
            <StatusBadge status={displayStatus} size="large" />
          </div>
          {donation.pickup_location && (
            <p className="flex items-center gap-1.5 text-sm text-text-secondary mt-3">
              <MapPin size={14} /> {donation.pickup_location}
            </p>
          )}
          <p className="flex items-center gap-1.5 text-sm text-text-secondary mt-1">
            <Calendar size={14} /> Created {formatDateTime(donation.created_at)}
          </p>
        </div>

        {/* Reports, if any */}
        {reports.length > 0 && (
          <div className="bg-danger-soft rounded-lg border border-danger/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Flag size={14} className="text-danger" />
              <h2 className="text-sm font-semibold text-text-primary">
                {reports.length} Report{reports.length > 1 ? 's' : ''} Filed
              </h2>
            </div>
            <ul className="space-y-2">
              {reports.map((r) => (
                <li key={r.id} className="bg-surface rounded-lg p-3 border border-border/50">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-medium text-text-primary">{r.reason}</p>
                    <span className="text-[11px] text-text-secondary capitalize">{r.status}</span>
                  </div>
                  {r.details && <p className="text-xs text-text-secondary mb-1">{r.details}</p>}
                  <p className="text-[11px] text-text-secondary">
                    Reported by {r.reporter_name || 'a user'} · {formatDateTime(r.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Donor -> Volunteer -> Receiver flow */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Donor → Volunteer → Receiver</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PersonCard icon={HeartHandshake} label="Donor" name={donation.donor_name} email={donation.donor_email} phone={donation.donor_phone} />
            <PersonCard
              icon={UserCheck}
              label={donation.assignment_mode === 'team' ? 'Volunteer (Team Lead)' : 'Volunteer'}
              name={donation.volunteer_name}
              email={donation.volunteer_email}
              phone={donation.volunteer_phone}
              empty={!donation.volunteer_id ? 'Not yet assigned' : null}
            />
            <PersonCard
              icon={User}
              label="Receiver"
              empty="Not tracked as a system record — donations are handed off by the volunteer at the pickup location above."
            />
          </div>
          {donation.assignment_mode === 'team' && donation.assigned_member_name && (
            <p className="text-xs text-text-secondary mt-2">
              Assigned team member for pickup: <span className="font-medium text-text-primary">{donation.assigned_member_name}</span>
            </p>
          )}
        </div>

        {/* Status history */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Status History</h2>
          {history.length === 0 ? (
            <div className="bg-surface rounded-lg border border-border/50">
              <EmptyState icon={Clock} title="No status changes recorded" showAction={false} size="small" />
            </div>
          ) : (
            <div className="bg-surface rounded-lg border border-border/50 p-4">
              <ul className="space-y-3">
                {history.map((h) => (
                  <li key={h.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-dash-primary-soft flex items-center justify-center shrink-0 mt-0.5">
                      <Clock size={12} className="text-dash-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-text-primary">
                        {h.old_status ? (
                          <>
                            <span className="capitalize">{h.old_status.replace(/_/g, ' ')}</span>
                            {' → '}
                          </>
                        ) : null}
                        <span className="font-medium capitalize">{h.new_status.replace(/_/g, ' ')}</span>
                        {h.changed_by_name && <span className="text-text-secondary"> by {h.changed_by_name} ({h.changed_by_role})</span>}
                      </p>
                      <p className="text-[11px] text-text-secondary">{formatDateTime(h.changed_at)}</p>
                    </div>
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
