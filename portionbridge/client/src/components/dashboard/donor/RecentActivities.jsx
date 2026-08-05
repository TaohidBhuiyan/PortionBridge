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

/**
 * RecentActivities timeline component
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

            if (donation.status === 'completed') {
              activityType = 'completed';
              icon = CheckCircle;
              title = 'Donation Completed';
              description = `Your donation "${donation.title}" was successfully delivered`;
            } else if (donation.assignedVolunteer) {
              activityType = 'accepted';
              icon = UserCheck;
              title = 'Volunteer Accepted';
              description = `${donation.assignedVolunteer.name} accepted your donation`;
            } else if (donation.scheduledPickupTime) {
              activityType = 'scheduled';
              icon = Calendar;
              title = 'Pickup Scheduled';
              description = `Pickup scheduled for ${new Date(donation.scheduledPickupTime).toLocaleString()}`;
            }

            return {
              id: donation.id,
              type: activityType,
              icon,
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
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return activityTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getIconColor = (type) => {
    const colors = {
      created: 'bg-purple-100 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400',
      accepted: 'bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
      scheduled: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400',
      completed: 'bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400',
    };
    return colors[type] || colors.created;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#120721] rounded-xl border border-gray-200 dark:border-purple-950/30 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activities</h2>
        <SkeletonCard count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-[#120721] rounded-xl border border-gray-200 dark:border-purple-950/30 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activities</h2>
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
      <div className="bg-white dark:bg-[#120721] rounded-xl border border-gray-200 dark:border-purple-950/30 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activities</h2>
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
    <div className="bg-white/80 dark:bg-[#120721]/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-purple-950/20 p-6 mb-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Activities</h2>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-purple-950/20" />

        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div 
                key={activity.id} 
                onClick={() => navigate(`/donations/${activity.id}`)}
                className="relative flex items-start gap-4 pl-10 cursor-pointer group/item"
              >
                {/* Timeline dot */}
                <div className={`absolute left-0 w-8 h-8 rounded-full ${getIconColor(activity.type)} flex items-center justify-center border-4 border-white dark:border-[#120721] group-hover/item:scale-110 transition-transform duration-200`}>
                  <Icon size={16} />
                </div>

                {/* Activity content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white mb-1 group-hover/item:text-purple-600 dark:group-hover/item:text-purple-400 transition-colors">
                        {activity.title}
                      </p>
                      <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-[10px] md:text-xs text-gray-450 dark:text-gray-500 shrink-0">
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
