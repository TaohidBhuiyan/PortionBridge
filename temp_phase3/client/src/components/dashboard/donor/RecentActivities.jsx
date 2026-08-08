import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard } from '../skeletons';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import {
  Package,
  UserCheck,
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const TONE_CLASSES = {
  primary: 'bg-dash-primary-soft text-dash-primary',
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
};

/**
 * RecentActivities timeline component — answers "what recently happened?"
 */
export function RecentActivities() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_BASE}/donations/my-history?limit=10`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data?.success) {
          const donations = response.data.data.donations || [];

          // Transform donations into activity timeline
          const transformedActivities = donations.map((donation) => {
            let activityType = 'created';
            let icon = Package;
            let title = 'Donation Created';
            let description = `You created a donation for ${donation.title}`;
            let tone = 'primary';

            if (donation.status === 'completed') {
              activityType = 'completed';
              icon = CheckCircle;
              title = 'Donation Completed';
              description = `Your donation "${donation.title}" was successfully delivered`;
              tone = 'success';
            } else if (donation.assignedVolunteer) {
              activityType = 'accepted';
              icon = UserCheck;
              title = 'Volunteer Accepted';
              description = `${donation.assignedVolunteer.name} accepted your donation`;
              tone = 'info';
            } else if (donation.scheduledPickupTime) {
              activityType = 'scheduled';
              icon = Calendar;
              title = 'Pickup Scheduled';
              description = `Pickup scheduled for ${new Date(donation.scheduledPickupTime).toLocaleString()}`;
              tone = 'warning';
            }

            return {
              id: donation.id,
              type: activityType,
              icon,
              tone,
              title,
              description,
              timestamp: donation.updatedAt || donation.createdAt,
            };
          });

          setActivities(transformedActivities);
        } else {
          throw new Error('Failed to fetch recent activities');
        }
      } catch (err) {
        console.error('Error fetching recent activities:', err);
        setError(err.message);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivities();
  }, []);

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now - activityTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return activityTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-text-primary mb-4">Recent Activities</h2>
        <div className="space-y-3">
          <SkeletonCard count={3} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-text-primary mb-2">Recent Activities</h2>
        <ErrorState
          title="Failed to load activities"
          message="Unable to fetch your recent activities. Please try again."
          onRetry={() => window.location.reload()}
          size="small"
        />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-text-primary mb-2">Recent Activities</h2>
        <EmptyState
          icon={Clock}
          title="No recent activities"
          description="Start making donations to see your activity timeline."
          size="small"
          showAction={false}
        />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <h2 className="text-base font-semibold text-text-primary mb-4">Recent Activities</h2>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3.5 top-1 bottom-1 w-px bg-border" />

        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                onClick={() => navigate(`/donations/${activity.id}`)}
                className="relative flex items-start gap-3 pl-9 cursor-pointer group/item"
              >
                {/* Timeline dot */}
                <div className={`absolute left-0 w-7 h-7 rounded-full flex items-center justify-center ring-4 ring-surface ${TONE_CLASSES[activity.tone]}`}>
                  <Icon size={13} />
                </div>

                {/* Activity content */}
                <div className="flex-1 pb-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary group-hover/item:text-dash-primary transition-colors truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-text-secondary line-clamp-1">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-[11px] text-text-secondary shrink-0">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
