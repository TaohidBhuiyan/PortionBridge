import { Star, MapPin, Clock, CheckCircle, Shield, Eye, EyeOff } from 'lucide-react';

/**
 * Volunteer Profile Header Component
 * Displays volunteer's key information at the top of the profile page
 */
const VolunteerProfileHeader = ({ volunteer, distance }) => {
  const getProfileImage = () => {
    if (volunteer.profile_photo) return volunteer.profile_photo;
    if (volunteer.profile_picture) return volunteer.profile_picture;
    return null;
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDistance = (dist) => {
    if (!dist) return 'N/A';
    const num = parseFloat(dist);
    if (num < 1) return `${Math.round(num * 1000)}m`;
    return `${num.toFixed(1)}km`;
  };

  const calculateETA = (dist) => {
    if (!dist) return 'N/A';
    const num = parseFloat(dist);
    const timeInMinutes = (num / 20) * 60;
    if (timeInMinutes < 60) return `${Math.round(timeInMinutes)} min`;
    return `${Math.round(timeInMinutes / 60)} hr`;
  };

  const isOnline = volunteer.is_online === 1 || volunteer.is_online === true;
  const isVerified = volunteer.email_verified === 1 || volunteer.email_verified === true;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Photo */}
        <div className="flex-shrink-0">
          <div className="relative">
            {getProfileImage() ? (
              <img
                src={getProfileImage()}
                alt={volunteer.name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl md:text-4xl border-4 border-white dark:border-gray-800 shadow-lg">
                {getInitials(volunteer.name)}
              </div>
            )}
            
            {/* Online Status */}
            <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800 ${
              isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`} />

            {/* Verified Badge */}
            {isVerified && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <Shield className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Volunteer Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {volunteer.name}
              </h1>
              
              {/* Team Name */}
              {volunteer.team && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                    {volunteer.team.name}
                  </span>
                  <span>•</span>
                  <span>{volunteer.team.member_count} members</span>
                </div>
              )}

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {volunteer.rating_summary?.average_rating || volunteer.rating || 'N/A'}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({volunteer.rating_summary?.total_ratings || 0} reviews)
                </span>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
              {isOnline ? (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                  <Eye className="w-4 h-4" />
                  Available Now
                </div>
              ) : (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium">
                  <EyeOff className="w-4 h-4" />
                  Offline
                </div>
              )}
              
              {volunteer.statistics?.active_pickups > 0 && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  {volunteer.statistics.active_pickups} Active Pickup{volunteer.statistics.active_pickups > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Completed Pickups</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {volunteer.statistics?.completed_pickups || volunteer.total_pickups || 0}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Distance</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {distance ? formatDistance(distance) : 'N/A'}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>ETA</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {distance ? calculateETA(distance) : 'N/A'}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Star className="w-3.5 h-3.5" />
                <span>Acceptance Rate</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {volunteer.statistics?.acceptance_rate ? `${volunteer.statistics.acceptance_rate.toFixed(0)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfileHeader;
