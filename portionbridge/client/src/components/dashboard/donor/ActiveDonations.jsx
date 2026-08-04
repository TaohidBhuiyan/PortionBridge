import { useState, useEffect } from 'react';
import { SkeletonCard } from '../skeletons';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { Package, Clock, User, Calendar, ArrowRight } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * ActiveDonations widget showing latest active donations
 */
export function ActiveDonations() {
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      on_the_way: { label: 'On the Way', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
      picked_up: { label: 'Picked Up', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not scheduled';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#120721] rounded-xl border border-gray-200 dark:border-purple-950/30 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Active Donations</h2>
        <SkeletonCard count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-[#120721] rounded-xl border border-gray-200 dark:border-purple-950/30 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Active Donations</h2>
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
      <div className="bg-white dark:bg-[#120721] rounded-xl border border-gray-200 dark:border-purple-950/30 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Active Donations</h2>
        <EmptyState
          icon={Package}
          title="No active donations"
          description="You don't have any active donations at the moment."
          actionLabel="Create a Donation"
          onAction={() => console.log('Navigate to donation form')}
          size="small"
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#120721] rounded-xl border border-gray-200 dark:border-purple-950/30 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Active Donations</h2>
        <button className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {donations.map((donation) => (
          <div
            key={donation.id}
            className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-purple-950/30 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-gray-50 dark:hover:bg-purple-950/10 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center shrink-0">
              <Package size={20} className="text-purple-600 dark:text-purple-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    {donation.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="capitalize">{donation.category}</span>
                    <span>•</span>
                    {getStatusBadge(donation.status)}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{formatDate(donation.createdAt)}</span>
                </div>
                {donation.assignedVolunteer && (
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    <span>{donation.assignedVolunteer.name}</span>
                  </div>
                )}
                {donation.scheduledPickupTime && (
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{formatTime(donation.scheduledPickupTime)}</span>
                  </div>
                )}
              </div>
            </div>

            <button className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-950/30 text-purple-600 dark:text-purple-400 transition-colors shrink-0">
              <ArrowRight size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
