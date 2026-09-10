import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SkeletonCard } from '../skeletons';
import { ErrorState } from '../ErrorState';
import {
  Package,
  UserCheck,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Activity
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * RecentActivities — Sleek Connected Timeline
 * Visualizes donation events chronologically with an elegant vertical line and glowing nodes.
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
        const response = await axios.get(`${API_BASE}/donations/my-history?limit=7`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data?.success) {
          const donations = response.data.data.donations || [];

          // Transform donations into rich activity timeline
          const transformedActivities = donations.map((donation) => {
            let activityType = 'created';
            let icon = Package;
            let title = 'Donation Created';
            let description = `Created listing for "${donation.title}"`;
            let nodeColor = 'bg-dash-primary text-white ring-dash-primary/30';
            let badgeText = 'Created';

            if (donation.status === 'completed') {
              activityType = 'completed';
              icon = CheckCircle2;
              title = 'Donation Completed';
              description = `Successfully delivered "${donation.title}" to community`;
              nodeColor = 'bg-emerald-500 text-white ring-emerald-500/30';
              badgeText = 'Completed';
            } else if (donation.assignedVolunteer) {
              activityType = 'accepted';
              icon = UserCheck;
              title = 'Volunteer Assigned';
              description = `${donation.assignedVolunteer.name} picked up the assignment`;
              nodeColor = 'bg-sky-500 text-white ring-sky-500/30';
              badgeText = 'Assigned';
            } else if (donation.scheduledPickupTime) {
              activityType = 'scheduled';
              icon = Calendar;
              title = 'Pickup Scheduled';
              description = `Scheduled for ${new Date(donation.scheduledPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
              nodeColor = 'bg-amber-500 text-white ring-amber-500/30';
              badgeText = 'Scheduled';
            }

            return {
              id: donation.id,
              type: activityType,
              icon,
              nodeColor,
              badgeText,
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
    if (!timestamp) return 'Recently';
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
      <div className="bg-surface rounded-3xl border border-border/50 p-6 shadow-pb-card h-full flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-36 bg-border/40 rounded-md animate-pulse" />
          <div className="h-4 w-16 bg-border/30 rounded-md animate-pulse" />
        </div>
        <div className="space-y-3">
          <SkeletonCard count={3} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-3xl border border-border/50 p-6 shadow-pb-card h-full flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-text-primary">Recent Activities</h2>
        </div>
        <div className="py-6 flex justify-center">
          <ErrorState
            title="Failed to load activities"
            message="Unable to fetch your recent activities. Please try again."
            onRetry={() => window.location.reload()}
            size="small"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-3xl border border-border/50 p-6 shadow-pb-card h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-dash-primary-soft flex items-center justify-center text-dash-primary">
            <Activity size={16} />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">Activity Stream</h2>
            <p className="text-xs text-text-secondary">Chronological updates</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/donor/my-donations')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-dash-primary hover:text-dash-primary-hover transition-colors"
        >
          <span>History</span>
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Activities Timeline */}
      {activities.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-surface-hover flex items-center justify-center text-text-secondary mb-3">
            <Clock size={22} className="opacity-60" />
          </div>
          <p className="text-sm font-semibold text-text-primary">No recent activity yet</p>
          <p className="text-xs text-text-secondary mt-1">
            As soon as you create or dispatch a donation, updates will appear here.
          </p>
        </div>
      ) : (
        <div className="relative flex-1 pl-2 sm:pl-3 space-y-4 before:absolute before:left-[17px] sm:before:left-[21px] before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-dash-primary/30 via-border/60 to-transparent">
          {activities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={`${item.id}-${idx}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                onClick={() => navigate(`/donations/${item.id}`)}
                className="group relative flex items-start gap-3.5 p-2.5 rounded-2xl hover:bg-surface-hover/80 transition-all duration-150 cursor-pointer"
              >
                {/* Timeline node */}
                <div
                  className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full ${item.nodeColor} flex items-center justify-center ring-4 ring-surface shrink-0 shadow-xs group-hover:scale-110 transition-transform`}
                >
                  <Icon size={13} />
                </div>

                {/* Event details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-text-primary truncate group-hover:text-dash-primary transition-colors">
                      {item.title}
                    </h4>
                    <span className="text-[11px] font-medium text-text-secondary shrink-0">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary truncate">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}