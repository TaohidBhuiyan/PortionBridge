import { Star, MapPin, Clock, CheckCircle, Shield, Eye, EyeOff, Camera, Loader2, Sparkles, Award } from 'lucide-react';
import { useRef, useState } from 'react';
import { resolveMediaUrl } from '../../../utils/mediaUrl';
import { profileApi } from '../../../services/profileApi';
import { useAuth } from '../../../context/AuthContext';

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
    return `${num.toFixed(1)} km`;
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
    <div className="pb-volunteer-hero rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-md">
      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
        {/* Profile Avatar Frame */}
        <div className="relative shrink-0 mx-auto md:mx-0">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br from-dash-primary via-indigo-500 to-emerald-500 p-1 shadow-xl">
            <div className="w-full h-full rounded-[22px] bg-surface overflow-hidden relative group flex items-center justify-center">
              {getProfileImage() ? (
                <img
                  src={getProfileImage()}
                  alt={volunteer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-dash-primary-soft flex items-center justify-center text-dash-primary font-extrabold text-3xl sm:text-4xl">
                  {getInitials(volunteer.name)}
                </div>
              )}

              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  aria-label="Change profile photo"
                  className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  {photoUploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                  <span className="text-[10px] font-bold mt-1">Update Photo</span>
                </button>
              )}
            </div>
          </div>

          {/* Hidden File Input */}
          {isOwnProfile && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
            />
          )}

          {/* Online Radar Dot */}
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-emerald-400' : 'bg-gray-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-5 w-5 border-2 border-surface ${isOnline ? 'bg-emerald-500' : 'bg-gray-500'}`}></span>
          </span>

          {/* Verified Badge */}
          {isVerified && (
            <div className="absolute -top-2 -left-2 w-7 h-7 bg-dash-primary text-white rounded-full flex items-center justify-center shadow-md" title="Verified Volunteer">
              <Shield className="w-3.5 h-3.5 fill-white" />
            </div>
          )}

          {isOwnProfile && photoError && (
            <p className="text-[11px] text-danger mt-1 text-center font-medium">{photoError}</p>
          )}
        </div>

        {/* Volunteer Main Info */}
        <div className="flex-1 min-w-0 text-center md:text-left space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-dash-primary-soft text-dash-primary border border-dash-primary/20">
                  <Sparkles size={12} /> Verified Volunteer
                </span>
                {volunteer.team && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Award size={12} /> {volunteer.team.name} ({volunteer.team.member_count} members)
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                {volunteer.name}
              </h1>
            </div>

            {/* Availability Badges */}
            <div className="flex items-center justify-center md:justify-end gap-2 flex-wrap">
              {isOnline ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                  <Eye className="w-3.5 h-3.5" /> Available Now
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-500/10 text-text-muted rounded-full text-xs font-semibold border border-border">
                  <EyeOff className="w-3.5 h-3.5" /> Currently Offline
                </div>
              )}
            </div>
          </div>

          {/* Rating Summary Pill */}
          <div className="flex items-center justify-center md:justify-start gap-3 text-xs sm:text-sm">
            <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{volunteer.rating_summary?.average_rating || volunteer.rating || '5.0'}</span>
            </div>
            <span className="text-text-muted">
              ({volunteer.rating_summary?.total_ratings || 0} donor reviews)
            </span>
          </div>

          {/* Quick Metrics Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/60">
            <div className="pb-glass-card p-3 rounded-xl border border-border/60 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1 text-[11px] font-semibold text-text-muted mb-0.5">
                <CheckCircle className="w-3 h-3 text-emerald-500" /> Completed
              </div>
              <p className="text-base sm:text-lg font-extrabold text-text-primary">
                {volunteer.statistics?.completed_pickups || volunteer.total_pickups || 0}
              </p>
            </div>

            <div className="pb-glass-card p-3 rounded-xl border border-border/60 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1 text-[11px] font-semibold text-text-muted mb-0.5">
                <MapPin className="w-3 h-3 text-rose-500" /> Distance
              </div>
              <p className="text-base sm:text-lg font-extrabold text-text-primary">
                {distance ? formatDistance(distance) : 'N/A'}
              </p>
            </div>

            <div className="pb-glass-card p-3 rounded-xl border border-border/60 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1 text-[11px] font-semibold text-text-muted mb-0.5">
                <Clock className="w-3 h-3 text-dash-primary" /> Est. ETA
              </div>
              <p className="text-base sm:text-lg font-extrabold text-text-primary">
                {distance ? calculateETA(distance) : 'N/A'}
              </p>
            </div>

            <div className="pb-glass-card p-3 rounded-xl border border-border/60 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1 text-[11px] font-semibold text-text-muted mb-0.5">
                <Star className="w-3 h-3 text-amber-500" /> Success Rate
              </div>
              <p className="text-base sm:text-lg font-extrabold text-text-primary">
                {volunteer.statistics?.acceptance_rate ? `${volunteer.statistics.acceptance_rate.toFixed(0)}%` : '100%'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfileHeader;
