import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard } from '../skeletons';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { StatusBadge } from '../../donation/StatusBadge';
import { Package, Clock, User, Calendar, ArrowRight } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * ActiveDonations widget showing latest active donations — the primary,
 * highest-priority section of the donor dashboard.
 */
export function ActiveDonations() {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActiveDonations = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE}/donations/my-history?status=pending,scheduled,on_the_way&limit=5`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data?.success) {
          setDonations(response.data.data.donations || []);
        } else {
          throw new Error('Failed to fetch active donations');
        }
      } catch (err) {
        console.error('Error fetching active donations:', err);
        setError(err.message);
        setDonations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveDonations();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return null;
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-text-primary mb-4">Active Donations</h2>
        <div className="space-y-3">
          <SkeletonCard count={3} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-text-primary mb-2">Active Donations</h2>
        <ErrorState
          title="Failed to load donations"
          message="Unable to fetch your active donations. Please try again."
          onRetry={() => window.location.reload()}
          size="small"
        />
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-text-primary mb-2">Active Donations</h2>
        <EmptyState
          icon={Package}
          title="No active donations yet"
          description="Your next donation could make a difference."
          actionLabel="Donate Food"
          onAction={() => navigate('/donation/create')}
          size="small"
        />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-text-primary">Active Donations</h2>
        <button
          onClick={() => navigate('/donor/my-donations')}
          className="text-xs text-dash-primary hover:text-dash-primary-hover font-medium focus:outline-none focus-visible:underline"
        >
          View All
        </button>
      </div>

      <div className="space-y-2">
        {donations.map((donation) => (
          <div
            key={donation.id}
            onClick={() => navigate(`/donations/${donation.id}`)}
            className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-dash-primary/40 hover:bg-surface-hover cursor-pointer transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-dash-primary-soft flex items-center justify-center shrink-0">
              <Package size={16} className="text-dash-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="text-sm font-medium text-text-primary truncate">
                  {donation.title}
                </h3>
                <StatusBadge status={donation.status} size="small" />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                <span className="capitalize">{donation.category}</span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(donation.createdAt)}
                </span>
                {donation.assignedVolunteer && (
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {donation.assignedVolunteer.name}
                  </span>
                )}
                {formatTime(donation.scheduledPickupTime) && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatTime(donation.scheduledPickupTime)}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/donations/${donation.id}`); }}
              aria-label="View donation details"
              className="p-1.5 rounded-lg hover:bg-dash-primary-soft text-dash-primary transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
