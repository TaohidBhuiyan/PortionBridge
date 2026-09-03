import { Star, MapPin, Clock, CheckCircle, Shield, Eye, EyeOff, Camera, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { resolveMediaUrl } from '../../../utils/mediaUrl';
import { profileApi } from '../../../services/profileApi';
import { useAuth } from '../../../context/AuthContext';

/**
 * Volunteer Profile Header Component
 * Displays volunteer's key information at the top of the profile page
 *
 * PHASE — Profile Picture Audit: `getProfileImage()` was returning the
 * bare relative path (e.g. "profiles/xyz.jpg") straight into <img src>,
 * which the browser resolves against the current page's origin, not the
 * API server — so this never actually rendered a real photo, silently
 * falling through to the broken-image state. Now resolved via the shared
 * resolveMediaUrl() helper. Also adds a working "change photo" control
 * when the logged-in user is viewing their own profile — there was
 * previously no UI anywhere for a volunteer to set their own photo.
 */
const VolunteerProfileHeader = ({ volunteer, distance, isOwnProfile, onPhotoUpdated }) => {
  const { updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  const getProfileImage = () => {
    if (volunteer.profile_photo) return resolveMediaUrl(volunteer.profile_photo);
    if (volunteer.profile_picture) return resolveMediaUrl(volunteer.profile_picture);
    return null;
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const result = await profileApi.uploadPhoto(file);
      if (result.success) {
        updateUser(result.data.user);
        onPhotoUpdated?.(result.data.user);
      } else {
        setPhotoError(result.message || 'Failed to upload photo.');
      }
    } catch (err) {
      setPhotoError(err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setPhotoUploading(false);
    }
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
    <div className="bg-dash-primary-soft border border-border rounded-2xl p-6">
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
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-dash-primary flex items-center justify-center text-white font-bold text-3xl md:text-4xl border-4 border-white dark:border-gray-800 shadow-lg">
                {getInitials(volunteer.name)}
              </div>
            )}
            
            {/* Online Status */}
            <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800 ${
              isOnline ? 'bg-success' : 'bg-text-muted'
            }`} />

            {/* Verified Badge */}
            {isVerified && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-dash-primary rounded-full flex items-center justify-center shadow-lg">
                <Shield className="w-4 h-4 text-white" />
              </div>
            )}

            {isOwnProfile && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  aria-label="Change profile photo"
                  className="absolute bottom-2 left-2 p-2 bg-dash-primary text-white rounded-full hover:bg-dash-primary-hover transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2 disabled:opacity-60"
                >
                  {photoUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </>
            )}
          </div>
          {isOwnProfile && photoError && (
            <p className="text-xs text-danger mt-1 max-w-[8rem]">{photoError}</p>
          )}
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
                  <span className="px-2 py-1 bg-dash-primary-soft text-dash-primary rounded-full font-medium">
                    {volunteer.team.name}
                  </span>
                  <span>•</span>
                  <span>{volunteer.team.member_count} members</span>
                </div>
              )}

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-warning fill-warning" />
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
                <div className="flex items-center gap-1 px-3 py-1.5 bg-success-soft text-success rounded-full text-sm font-medium">
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
                <div className="flex items-center gap-1 px-3 py-1.5 bg-dash-primary-soft text-dash-primary rounded-full text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  {volunteer.statistics.active_pickups} Active Pickup{volunteer.statistics.active_pickups > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-dash-primary/30">
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
