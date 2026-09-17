import React from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  Star, 
  CheckCircle, 
  Users, 
  ShieldCheck, 
  Truck, 
  Award, 
  Calendar, 
  Phone, 
  ExternalLink,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * VolunteerDetailModal Component
 * Interactive glassmorphic modal displaying rich details for a volunteer or team.
 */
const VolunteerDetailModal = ({ item, isTeam = false, isOpen, onClose, onRequestPickup }) => {
  const navigate = useNavigate();

  if (!isOpen || !item) return null;

  const getProfileImage = () => {
    if (isTeam) return null;
    return item.profile_photo || item.profile_picture || null;
  };

  const getInitials = (name) => {
    if (!name) return 'PB';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDistance = (distance) => {
    if (distance === undefined || distance === null) return 'Nearby';
    const num = parseFloat(distance);
    if (num < 1) {
      return `${Math.round(num * 1000)}m`;
    }
    return `${num.toFixed(1)} km`;
  };

  const calculateETA = (distance) => {
    if (distance === undefined || distance === null) return '15 min';
    const num = parseFloat(distance);
    const timeInMinutes = (num / 20) * 60;
    if (timeInMinutes < 60) {
      return `${Math.max(5, Math.round(timeInMinutes))} min`;
    }
    return `${Math.round(timeInMinutes / 60)} hr`;
  };

  const getVehicleIcon = (vehicleType) => {
    switch (vehicleType) {
      case 'bicycle': return '🚴 Bicycle';
      case 'motorcycle': return '🏍️ Motorbike';
      case 'car': return '🚗 Car';
      case 'van': return '🚐 Cargo Van';
      case 'truck': return '🚚 Logistics Truck';
      default: return '🚶 Foot Patrol';
    }
  };

  const isOnline = isTeam ? true : (item.is_online === 1 || item.is_online === true);

  const handleFullProfileClick = () => {
    if (item.distance) {
      sessionStorage.setItem('volunteer_distance', item.distance);
    }
    onClose();
    if (!isTeam) {
      navigate(`/volunteers/${item.id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-pb-modal overflow-hidden transition-all duration-300">
        
        {/* Header Graphic Gradient */}
        <div className={`h-28 w-full relative ${
          isTeam 
            ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800'
            : 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700'
        }`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_70%)]" />
          
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3 right-3 p-2 rounded-full bg-black/30 text-white/90 hover:text-white hover:bg-black/50 transition-colors backdrop-blur-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            {isTeam ? (
              <>
                <Users className="w-3.5 h-3.5" /> Volunteer Squad
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Volunteer
              </>
            )}
          </div>
        </div>

        {/* Profile Content Container */}
        <div className="px-6 pb-6 pt-0 relative">
          
          {/* Avatar & Badges Header */}
          <div className="flex justify-between items-end -mt-12 mb-4">
            <div className="relative">
              {getProfileImage() ? (
                <img
                  src={getProfileImage()}
                  alt={item.name}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-surface shadow-md"
                />
              ) : (
                <div className={`w-24 h-24 rounded-2xl ${
                  isTeam ? 'bg-purple-600' : 'bg-dash-primary'
                } border-4 border-surface shadow-md flex items-center justify-center text-white font-bold text-2xl`}>
                  {isTeam ? <Users className="w-12 h-12 text-white" /> : getInitials(item.name)}
                </div>
              )}

              {/* Status Dot */}
              {!isTeam && (
                <div 
                  className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full border-2 border-surface text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                    isOnline ? 'bg-success text-white' : 'bg-text-muted text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              )}
            </div>

            {/* Distance & ETA Pills */}
            <div className="flex flex-col items-end gap-1.5">
              <span className="px-3 py-1 rounded-full bg-dash-primary-soft text-dash-primary text-xs font-bold flex items-center gap-1 border border-dash-primary/20">
                <MapPin className="w-3.5 h-3.5" /> {formatDistance(item.distance)} away
              </span>
              <span className="px-3 py-1 rounded-full bg-success-soft text-success text-xs font-semibold flex items-center gap-1 border border-success/20">
                <Zap className="w-3.5 h-3.5" /> ~{calculateETA(item.distance)} response
              </span>
            </div>
          </div>

          {/* Name & Title */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              {item.name}
            </h2>
            {isTeam ? (
              <p className="text-sm text-text-secondary mt-0.5">
                {item.description || `Active Volunteer Team led by ${item.leader_name || 'Squad Lead'}`}
              </p>
            ) : (
              item.team_name && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 mt-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>Member of <strong>{item.team_name}</strong></span>
                </div>
              )
            )}
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 py-3 px-4 bg-page border border-border rounded-xl mb-4">
            <div className="text-center border-r border-border pr-2">
              <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Rating</p>
              <div className="flex items-center justify-center gap-1 mt-0.5 text-text-primary font-bold text-base">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span>{item.rating ? item.rating.toFixed(1) : '5.0'}</span>
              </div>
            </div>

            <div className="text-center border-r border-border px-2">
              <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                {isTeam ? 'Members' : 'Pickups'}
              </p>
              <p className="mt-0.5 text-text-primary font-bold text-base">
                {isTeam ? `${item.member_count || 1} Volunteers` : (item.total_pickups || 0)}
              </p>
            </div>

            <div className="text-center pl-2">
              <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Radius</p>
              <p className="mt-0.5 text-text-primary font-bold text-base">
                {item.coverage_radius ? `${item.coverage_radius} km` : '10 km'}
              </p>
            </div>
          </div>

          {/* Details & Specs List */}
          <div className="space-y-3 mb-6">
            
            {/* Vehicle Type */}
            {!isTeam && item.vehicle_type && (
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-border/50">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-dash-primary" /> Vehicle Transport
                </span>
                <span className="font-semibold text-text-primary">
                  {getVehicleIcon(item.vehicle_type)}
                </span>
              </div>
            )}

            {/* Team Leader */}
            {isTeam && item.leader_name && (
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-border/50">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-purple-600" /> Team Leader
                </span>
                <span className="font-semibold text-text-primary">
                  {item.leader_name}
                </span>
              </div>
            )}

            {/* Skills & Specialties */}
            {item.skills && item.skills.length > 0 && (
              <div className="py-1">
                <p className="text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" /> Verified Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {item.skills.map((skill, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface border border-border text-text-primary shadow-2xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Availability */}
            {item.availability && item.availability.length > 0 && (
              <div className="py-1">
                <p className="text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-dash-primary" /> Preferred Schedule
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {item.availability.map((slot, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-success-soft text-success border border-success/20"
                    >
                      {slot}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {!isTeam && (
              <button
                onClick={handleFullProfileClick}
                className="flex-1 py-2.5 px-4 rounded-xl border border-border text-text-primary hover:bg-surface-hover transition-all font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Full Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => onRequestPickup?.(item)}
              disabled={!isOnline}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isOnline
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-violet-500/25 active:scale-95'
                  : 'bg-border text-text-muted cursor-not-allowed'
              }`}
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{isOnline ? (isTeam ? 'Request Team' : 'Request Pickup') : 'Currently Offline'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default VolunteerDetailModal;
